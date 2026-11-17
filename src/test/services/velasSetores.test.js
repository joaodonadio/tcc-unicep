// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { buscarVelasSetores } from '../../services/velasSetores.js';

const DATAS = Array.from({ length: 30 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
const serie = (ticker) => ({ ticker, datas: DATAS, valores: { fechamento: DATAS.map((_, i) => 100 + i) } });
const acoes = [
  { ticker: 'AAA3', setor: 'Financeiro' },
  { ticker: 'BBB3', setor: 'Financeiro' },
];

describe('buscarVelasSetores (fonte api)', () => {
  it('usa a rota local em uma chamada só e não busca por ticker', async () => {
    const velas = { s1: [{ setor: 'Financeiro' }], m1: [], m6: [], a1: [] };
    const pedir = vi.fn(async () => ({ velas }));
    const porTicker = vi.fn();
    const resultado = await buscarVelasSetores(acoes, { pedir, porTicker, fonte: 'api' });
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(pedir).toHaveBeenCalledWith('velas-setores', expect.any(Object));
    expect(porTicker).not.toHaveBeenCalled();
    expect(resultado).toBe(velas);
  });

  it('se a rota lançar erro, cai na busca por ticker e devolve os 4 períodos', async () => {
    const pedir = vi.fn(async () => {
      throw new Error('503');
    });
    const porTicker = vi.fn(async (t) => serie(t));
    const resultado = await buscarVelasSetores(acoes, { pedir, porTicker, fonte: 'api' });
    expect(porTicker).toHaveBeenCalledTimes(2);
    expect(Object.keys(resultado).sort()).toEqual(['a1', 'm1', 'm6', 's1']);
    expect(resultado.a1[0].setor).toBe('Financeiro');
  });

  it('fora da fonte api não chama a rota local', async () => {
    const pedir = vi.fn();
    const porTicker = vi.fn(async (t) => serie(t));
    await buscarVelasSetores(acoes, { pedir, porTicker, fonte: 'arquivos' });
    expect(pedir).not.toHaveBeenCalled();
    expect(porTicker).toHaveBeenCalledTimes(2);
  });

  it('todas as séries nulas: a promessa rejeita', async () => {
    const porTicker = vi.fn(async () => null);
    await expect(buscarVelasSetores(acoes, { porTicker, fonte: 'arquivos' })).rejects.toThrow('nenhuma série obtida');
  });
});
