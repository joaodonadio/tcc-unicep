// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { comRepeticao, criarLimitador, mapearComLimite } from '../../lib/concorrencia.js';
import { repetirSeTransitorio } from '../../services/erros.js';

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

describe('mapearComLimite', () => {
  it('nunca passa de 4 em andamento ao processar 20 itens', async () => {
    let emAndamento = 0;
    let pico = 0;
    const fn = async (x) => {
      emAndamento += 1;
      pico = Math.max(pico, emAndamento);
      await esperar(5);
      emAndamento -= 1;
      return x;
    };
    const itens = Array.from({ length: 20 }, (_, i) => i);
    await mapearComLimite(itens, 4, fn);
    expect(pico).toBeLessThanOrEqual(4);
    expect(pico).toBeGreaterThan(1);
  });

  it('preserva a ordem dos resultados mesmo quando terminam fora de ordem', async () => {
    const fn = async (x) => {
      await esperar((5 - x) * 3);
      return x * 10;
    };
    const resultados = await mapearComLimite([0, 1, 2, 3, 4], 4, fn);
    expect(resultados.map((r) => r.valor)).toEqual([0, 10, 20, 30, 40]);
    expect(resultados.every((r) => r.ok)).toBe(true);
  });

  it('um erro vira {ok: false} sem derrubar os outros itens', async () => {
    const erro = new Error('falhou');
    const fn = async (x) => {
      if (x === 3) throw erro;
      return x;
    };
    const resultados = await mapearComLimite([1, 2, 3, 4], 2, fn);
    expect(resultados[2]).toEqual({ ok: false, erro });
    expect(resultados.filter((r) => r.ok).map((r) => r.valor)).toEqual([1, 2, 4]);
  });

  it('lista vazia devolve lista vazia', async () => {
    expect(await mapearComLimite([], 4, async () => 1)).toEqual([]);
  });
});

describe('comRepeticao', () => {
  it('repete um 503 duas vezes e depois relança o erro', async () => {
    const erro = Object.assign(new Error('indisponível'), { status: 503 });
    const fn = vi.fn(async () => {
      throw erro;
    });
    await expect(comRepeticao(fn, repetirSeTransitorio, { esperaMs: 0 })).rejects.toBe(erro);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('não repete um 401', async () => {
    const erro = Object.assign(new Error('não autorizado'), { status: 401 });
    const fn = vi.fn(async () => {
      throw erro;
    });
    await expect(comRepeticao(fn, repetirSeTransitorio, { esperaMs: 0 })).rejects.toBe(erro);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('devolve o valor quando a segunda tentativa dá certo', async () => {
    let n = 0;
    const fn = vi.fn(async () => {
      n += 1;
      if (n === 1) throw Object.assign(new Error('503'), { status: 503 });
      return 'ok';
    });
    expect(await comRepeticao(fn, repetirSeTransitorio, { esperaMs: 0 })).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('criarLimitador', () => {
  it('nunca passa de 4 em andamento com 10 tarefas e devolve o valor de cada uma', async () => {
    const limitar = criarLimitador(4);
    let emAndamento = 0;
    let pico = 0;
    const tarefas = Array.from({ length: 10 }, (_, i) =>
      limitar(async () => {
        emAndamento += 1;
        pico = Math.max(pico, emAndamento);
        await esperar(10);
        emAndamento -= 1;
        return i;
      }),
    );
    expect(await Promise.all(tarefas)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(pico).toBe(4);
  });

  it('uma tarefa que lança rejeita só a sua promessa e as outras seguem', async () => {
    const limitar = criarLimitador(2);
    const ruim = limitar(async () => {
      throw new Error('falhou');
    });
    const boa = limitar(async () => 'ok');
    const depois = limitar(async () => 'depois');
    await expect(ruim).rejects.toThrow('falhou');
    expect(await boa).toBe('ok');
    expect(await depois).toBe('depois');
  });
});
