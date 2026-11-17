import { describe, expect, it } from 'vitest';
import { historicoSelic, selicDaSerie, serieDoCampo } from '../../lib/mercadoTela.js';

const datas = (n) => Array.from({ length: n }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);

describe('serieDoCampo', () => {
  const d = datas(4);

  it('troca valor inválido por null e mantém os finitos', () => {
    const r = serieDoCampo({ datas: d, valores: { fechamento: [5, null, 'x', 5.2] } });
    expect(r).toEqual({ datas: d, valores: [5, null, null, 5.2] });
  });

  it('anula as datas dentro de um trecho com status diferente de ok', () => {
    const r = serieDoCampo({
      datas: d,
      valores: { fechamento: [5, 5.1, 5.2, 5.3] },
      status: { fechamento: [{ de: d[1], ate: d[2], status: 'indisponivel' }] },
    });
    expect(r.valores).toEqual([5, null, null, 5.3]);
  });

  it('lê o status alinhado ponto a ponto', () => {
    const r = serieDoCampo({
      datas: datas(3),
      valores: { fechamento: [5, 6, 7] },
      status: { fechamento: ['ok', 'indisponivel', 'ok'] },
    });
    expect(r.valores).toEqual([5, null, 7]);
  });

  it('aceita {valor, status} só com status ok', () => {
    const r = serieDoCampo({
      datas: d,
      valores: {
        fechamento: [
          { valor: 5, status: 'ok' },
          { valor: 5.1, status: 'indisponivel' },
          { valor: 5.2, status: 'ok' },
          null,
        ],
      },
    });
    expect(r.valores).toEqual([5, null, 5.2, null]);
  });

  it('com menos de 2 valores, ou sem série, devolve null', () => {
    expect(serieDoCampo({ datas: d, valores: { fechamento: [null, 5, null, null] } })).toBeNull();
    expect(serieDoCampo(null)).toBeNull();
    expect(serieDoCampo(undefined)).toBeNull();
  });
});

describe('selicDaSerie', () => {
  it('lê a meta ao ano dia a dia e marca as mudanças', () => {
    const d = datas(6);
    const r = selicDaSerie({
      datas: d,
      valores: { indice_retorno_total: [0.15, 0.15, 0.1475, 0.1475, 0.145, 0.145] },
    });
    expect(r.datas).toEqual(d);
    expect(r.valores).toEqual([0.15, 0.15, 0.1475, 0.1475, 0.145, 0.145]);
    expect(r.mudancas).toEqual([
      { data: d[2], de: 0.15, para: 0.1475 },
      { data: d[4], de: 0.1475, para: 0.145 },
    ]);
  });

  it('valor fora de (0, 1) não é nível: null', () => {
    expect(selicDaSerie({ datas: datas(2), valores: { indice_retorno_total: [0.15, 179] } })).toBeNull();
  });

  it('sem série: null', () => {
    expect(selicDaSerie(null)).toBeNull();
  });
});

describe('historicoSelic', () => {
  const cdi = {
    datas: datas(3),
    valores: { indice_retorno_total: [100, 100.05, 100.1] },
  };
  const selic = {
    datas: datas(3),
    valores: { indice_retorno_total: [0.15, 0.15, 0.1475] },
  };

  it('usa a série SELIC publicada quando existe', () => {
    const r = historicoSelic(selic, cdi);
    expect(r.origem).toBe('serie');
    expect(r.serie.valores).toEqual([0.15, 0.15, 0.1475]);
  });

  it('sem SELIC, cai na estimativa pelo CDI', () => {
    const taxas = [0.149, 0.149, 0.149, 0.149, 0.149, 0.149, 0.149, 0.149];
    const valores = [100];
    for (const a of taxas) valores.push(valores.at(-1) * (1 + a) ** (1 / 252));
    const r = historicoSelic(null, { datas: datas(valores.length), valores: { indice_retorno_total: valores } });
    expect(r.origem).toBe('cdi');
    expect(r.serie.mudancas).toEqual([]);
  });

  it('sem SELIC e sem CDI: null', () => {
    expect(historicoSelic(null, null)).toBeNull();
  });
});
