// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  acumuladoDesdeInicio,
  alinharPorData,
  JANELAS,
  rentabilidadeComparada,
} from '../../lib/series.js';

/** Testes de rentabilidade comparada: funções puras e conferência com public/dados. */

const TIMEOUT = 30000;

const lerRegistros = (arquivo) =>
  JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'dados', arquivo), 'utf8')).registros;

describe('alinharPorData', () => {
  it('traz o valor da mesma data ou null', () => {
    expect(alinharPorData(['a', 'b', 'c'], ['b', 'c', 'd'], [2, 3, 4])).toEqual([null, 2, 3]);
  });
});

describe('acumuladoDesdeInicio', () => {
  it('começa em 0 no primeiro valor presente e mantém as faltas como null', () => {
    const r = acumuladoDesdeInicio([null, 100, 110, null, 90]);
    expect(r[0]).toBeNull();
    expect(r[1]).toBe(0);
    expect(r[2]).toBeCloseTo(0.1, 10);
    expect(r[3]).toBeNull();
    expect(r[4]).toBeCloseTo(-0.1, 10);
  });

  it('aceita lista vazia e lista só com faltas', () => {
    expect(acumuladoDesdeInicio([])).toEqual([]);
    expect(acumuladoDesdeInicio([null, null])).toEqual([null, null]);
  });
});

describe('rentabilidadeComparada', () => {
  const acao = {
    datas: ['d1', 'd2', 'd3', 'd4'],
    valores: { indice_retorno_total: [10, 11, 12, 13] },
  };
  const ibov = {
    datas: ['d0', 'd1', 'd2', 'd3', 'd4'],
    valores: { indice_retorno_total: [50, 100, 100, 110, 120] },
  };

  it('compara as duas séries nos últimos n pregões da ação, ambas partindo de 0', () => {
    const r = rentabilidadeComparada(acao, ibov, 3);
    expect(r.datas).toEqual(['d2', 'd3', 'd4']);
    expect(r.acao[0]).toBeCloseTo(0, 10);
    expect(r.acao[1]).toBeCloseTo(1 / 11, 10);
    expect(r.acao[2]).toBeCloseTo(2 / 11, 10);
    expect(r.ibov[0]).toBeCloseTo(0, 10);
    expect(r.ibov[1]).toBeCloseTo(0.1, 10);
    expect(r.ibov[2]).toBeCloseTo(0.2, 10);
  });

  it('sem série do Ibovespa, ibov é null', () => {
    expect(rentabilidadeComparada(acao, null, 3).ibov).toBeNull();
  });

  it('sem série da ação, o resultado é null', () => {
    expect(rentabilidadeComparada(null, ibov, 3)).toBeNull();
  });
});

describe('rentabilidadeComparada x resumo_acao (PETR4, 6m)', () => {
  const series = lerRegistros('series_diarias.json');
  const resumo = lerRegistros('resumo_acao.json');
  const petr4 = series.find((s) => s.ticker === 'PETR4');
  const ibov = series.find((s) => s.ticker === 'IBOV');
  const resumoPetr4 = resumo.find((r) => r.ticker === 'PETR4');

  it(
    'último ponto da ação e do Ibovespa batem com rentabilidade.m6 e rentabilidade.ibov.m6',
    () => {
      const r = rentabilidadeComparada(petr4, ibov, JANELAS['6m']);
      expect(r.acao.at(-1)).toBeCloseTo(resumoPetr4.rentabilidade.m6.valor, 6);
      expect(r.ibov.at(-1)).toBeCloseTo(resumoPetr4.rentabilidade.ibov.m6.valor, 6);
    },
    TIMEOUT,
  );
});
