// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { buscarSeriesDaSemana } from '../../services/seriesSemana.js';

const serie = (ticker) => ({ ticker, datas: ['2026-11-02'], valores: { fechamento: [10] } });

describe('buscarSeriesDaSemana (fonte api)', () => {
  it('usa a rota local em uma chamada só e não busca por ticker', async () => {
    const pedir = vi.fn(async () => ({ series: { PETR4: serie('PETR4'), VALE3: serie('VALE3') } }));
    const porTicker = vi.fn();
    const mapa = await buscarSeriesDaSemana(['PETR4', 'VALE3'], { pedir, porTicker, fonte: 'api' });
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(pedir).toHaveBeenCalledWith('series-semana', expect.any(Object));
    expect(porTicker).not.toHaveBeenCalled();
    expect(mapa.get('PETR4')).toEqual(serie('PETR4'));
    expect(mapa.get('VALE3')).toEqual(serie('VALE3'));
  });

  it('se a rota falhar, cai no caminho por ticker', async () => {
    const pedir = vi.fn(async () => {
      throw new Error('HTTP 502');
    });
    const porTicker = vi.fn(async (ticker) => serie(ticker));
    const mapa = await buscarSeriesDaSemana(['PETR4', 'VALE3'], { pedir, porTicker, fonte: 'api' });
    expect(porTicker).toHaveBeenCalledTimes(2);
    expect(mapa.get('VALE3')).toEqual(serie('VALE3'));
  });

  it('ticker sem série na rota vira null, nunca 0', async () => {
    const pedir = vi.fn(async () => ({ series: { PETR4: serie('PETR4'), VALE3: null } }));
    const mapa = await buscarSeriesDaSemana(['PETR4', 'VALE3', 'ITUB4'], { pedir, porTicker: vi.fn(), fonte: 'api' });
    expect(mapa.get('VALE3')).toBeNull();
    expect(mapa.get('ITUB4')).toBeNull();
    expect([...mapa.values()]).not.toContain(0);
  });

  it('no caminho por ticker, uma série que falhou vira null', async () => {
    const pedir = vi.fn(async () => {
      throw new Error('HTTP 502');
    });
    const porTicker = vi.fn(async (ticker) => {
      if (ticker === 'VALE3') return null;
      return serie(ticker);
    });
    const mapa = await buscarSeriesDaSemana(['PETR4', 'VALE3'], { pedir, porTicker, fonte: 'api' });
    expect(mapa.get('PETR4')).toEqual(serie('PETR4'));
    expect(mapa.get('VALE3')).toBeNull();
  });
});

describe('buscarSeriesDaSemana (fora da fonte api)', () => {
  it('não chama a rota e usa só o caminho por ticker', async () => {
    const pedir = vi.fn();
    const porTicker = vi.fn(async (ticker) => serie(ticker));
    const mapa = await buscarSeriesDaSemana(['PETR4'], { pedir, porTicker, fonte: 'arquivos' });
    expect(pedir).not.toHaveBeenCalled();
    expect(mapa.get('PETR4')).toEqual(serie('PETR4'));
  });
});
