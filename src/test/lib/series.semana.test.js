import { describe, expect, it } from 'vitest';
import { acumuladoNaJanela, PERIODOS } from '../../lib/mercadoTela.js';
import { cortarJanela, JANELAS, rebase } from '../../lib/series.js';

/** Série de 10 pregões com o campo de retorno total: 100, 101, ..., 109. */
const serie10 = () => ({
  datas: Array.from({ length: 10 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`),
  valores: { indice_retorno_total: Array.from({ length: 10 }, (_, i) => 100 + i) },
});

describe('janela de 1 semana (6 pontos = 5 pregões de variação)', () => {
  it('a janela da semana tem 6 pontos e é a primeira da lista de períodos', () => {
    expect(JANELAS['1s']).toBe(6);
    expect(PERIODOS.map((p) => p.chave)).toEqual(['1s', '1m', '6m', '1a']);
  });

  it('cortarJanela pega só os últimos 6 pontos de datas e valores', () => {
    const r = cortarJanela(serie10(), JANELAS['1s']);
    expect(r.datas).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10']);
    expect(r.valores.indice_retorno_total).toEqual([104, 105, 106, 107, 108, 109]);
  });

  it('rebase põe o primeiro ponto da janela em 0% e mantém a proporção', () => {
    const r = cortarJanela(serie10(), JANELAS['1s']).valores.indice_retorno_total;
    const base = rebase(r);
    expect(base[0]).toBe(0);
    expect(base[5]).toBeCloseTo(109 / 104 - 1, 12);
  });

  it('acumuladoNaJanela da semana começa em 0% e a falta no meio vira null, nunca 0', () => {
    const s = serie10();
    s.valores.indice_retorno_total[7] = null;
    const r = acumuladoNaJanela(s, JANELAS['1s']);
    expect(r.datas).toHaveLength(6);
    expect(r.valores[0]).toBe(0);
    expect(r.valores[2]).toBeCloseTo(106 / 104 - 1, 12);
    expect(r.valores[3]).toBeNull();
    expect(r.valores[5]).toBeCloseTo(109 / 104 - 1, 12);
  });

  it('série com menos pregões que a janela da semana não gera acumulado', () => {
    const curta = { datas: ['2026-10-01', '2026-10-02'], valores: { indice_retorno_total: [1, 2] } };
    expect(acumuladoNaJanela(curta, JANELAS['1s'])).toBeNull();
  });
});
