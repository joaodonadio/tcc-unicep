// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { medianaDe, resumoSerie, trechosSemValor } from '../../lib/historicoAcao.js';

describe('medianaDe', () => {
  it('ignora null e usa a média dos dois centrais em lista par', () => {
    expect(medianaDe([3, null, 1, 2])).toBe(2);
    expect(medianaDe([4, 1, 3, 2])).toBe(2.5);
  });

  it('sem nenhum número, null (nunca 0)', () => {
    expect(medianaDe([null, null])).toBeNull();
    expect(medianaDe([])).toBeNull();
  });
});

describe('resumoSerie', () => {
  it('atual é o último valor; mínima, máxima e mediana ignoram null', () => {
    const r = resumoSerie([5, null, 9, 1, 7]);
    expect(r.atual).toBe(7);
    expect(r.minima).toBe(1);
    expect(r.maxima).toBe(9);
    expect(r.mediana).toBe(6);
  });

  it('percentil do atual: fração dos valores do período menores ou iguais a ele', () => {
    // valores válidos: 1, 5, 7, 9; atual 7 -> três de quatro são <= 7
    expect(resumoSerie([5, null, 9, 1, 7]).percentil).toBe(0.75);
  });

  it('com o último valor null, o atual é null e não vira 0', () => {
    const r = resumoSerie([2, 4, null]);
    expect(r.atual).toBeNull();
    expect(r.minima).toBe(2);
    expect(r.percentil).toBeNull();
  });

  it('sem nenhum valor, tudo null', () => {
    expect(resumoSerie([null, null])).toEqual({ atual: null, minima: null, maxima: null, mediana: null, percentil: null });
    expect(resumoSerie(undefined).atual).toBeNull();
  });
});

describe('trechosSemValor', () => {
  const datas = ['2026-01-02', '2026-01-03', '2026-06-01'];

  it('mantém só trechos com status diferente de ok que caem no período', () => {
    const trechos = [
      { de: '2025-12-01', ate: '2025-12-20', status: 'indisponivel' },
      { de: '2026-01-02', ate: '2026-01-02', status: 'lucro_negativo' },
      { de: '2026-02-01', ate: '2026-02-10', status: 'ok' },
    ];
    expect(trechosSemValor(trechos, datas)).toEqual([{ de: '2026-01-02', ate: '2026-01-02', status: 'lucro_negativo' }]);
  });

  it('sem lista de trechos, vazio', () => {
    expect(trechosSemValor(undefined, datas)).toEqual([]);
    expect(trechosSemValor([{ de: '2026-01-02', ate: '2026-01-02', status: 'x' }], [])).toEqual([]);
  });
});
