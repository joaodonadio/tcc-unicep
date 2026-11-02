// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cortarJanela, JANELAS, rebase, serieInsuficiente } from '../../lib/series.js';

/**
 * Confere as séries reais de public/dados com os números de resumo_acao:
 * o último ponto do rebase de cada série tem que bater com a rentabilidade
 * (ou variação de preço) publicada para a mesma janela.
 */

const TIMEOUT = 30000;

const lerRegistros = (arquivo) =>
  JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'dados', arquivo), 'utf8')).registros;

const resumo = lerRegistros('resumo_acao.json');
const series = lerRegistros('series_diarias.json');

const serieDe = (ticker) => series.find((s) => s.ticker === ticker);
const resumoDe = (ticker) => resumo.find((r) => r.ticker === ticker);

const ultimoRebase = (serie, campo, n) => {
  const corte = cortarJanela(serie, n).valores[campo];
  return rebase(corte).at(-1);
};

const JANELAS_TESTE = [
  ['m1', '1m'],
  ['m6', '6m'],
  ['a1', '1a'],
];

describe('séries reais x resumo_acao (PETR4)', () => {
  const petr4 = serieDe('PETR4');
  const resumoPetr4 = resumoDe('PETR4');

  for (const [chave, janela] of JANELAS_TESTE) {
    const n = JANELAS[janela];

    it(
      `retorno total ${janela} bate com rentabilidade.${chave}`,
      () => {
        expect(ultimoRebase(petr4, 'indice_retorno_total', n)).toBeCloseTo(
          resumoPetr4.rentabilidade[chave].valor,
          8,
        );
      },
      TIMEOUT,
    );

    it(
      `preço ${janela} bate com variacao_preco.${chave}`,
      () => {
        expect(ultimoRebase(petr4, 'fechamento', n)).toBeCloseTo(
          resumoPetr4.variacao_preco[chave].valor,
          8,
        );
      },
      TIMEOUT,
    );
  }
});

describe('séries reais x comparativos (PETR4)', () => {
  const resumoPetr4 = resumoDe('PETR4');

  for (const [chave, janela] of JANELAS_TESTE) {
    const n = JANELAS[janela];

    it(
      `IBOV ${janela} bate com rentabilidade.ibov.${chave}`,
      () => {
        expect(ultimoRebase(serieDe('IBOV'), 'indice_retorno_total', n)).toBeCloseTo(
          resumoPetr4.rentabilidade.ibov[chave].valor,
          8,
        );
      },
      TIMEOUT,
    );

    it(
      `SETOR_SEM:PETR4 ${janela} bate com rentabilidade.setor.${chave}`,
      () => {
        expect(ultimoRebase(serieDe('SETOR_SEM:PETR4'), 'indice_retorno_total', n)).toBeCloseTo(
          resumoPetr4.rentabilidade.setor[chave].valor,
          8,
        );
      },
      TIMEOUT,
    );
  }
});

describe('suficiência de séries reais', () => {
  it(
    'IDIV (quase sem histórico) é insuficiente na janela de 1 mês',
    () => {
      expect(serieInsuficiente(serieDe('IDIV'), 'indice_retorno_total', JANELAS['1m'])).toBe(true);
    },
    TIMEOUT,
  );

  it(
    'AZUL3 (histórico curto) é insuficiente na janela de 1 ano',
    () => {
      expect(serieInsuficiente(serieDe('AZUL3'), 'indice_retorno_total', JANELAS['1a'])).toBe(
        true,
      );
    },
    TIMEOUT,
  );

  it(
    'PETR4 tem histórico completo nas três janelas',
    () => {
      const petr4 = serieDe('PETR4');
      for (const n of Object.values(JANELAS)) {
        expect(serieInsuficiente(petr4, 'indice_retorno_total', n)).toBe(false);
      }
    },
    TIMEOUT,
  );
});
