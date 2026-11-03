import { describe, expect, it } from 'vitest';
import {
  centesimosDoTom,
  fechamentoAnterior,
  fracaoDe,
  linhaDoTempo,
  partesDoTom,
  semAbertura,
  tetoVezes,
} from '../../lib/hoje.js';

describe('centesimosDoTom', () => {
  it('soma sempre 100, pelo maior resto', () => {
    expect(centesimosDoTom({ positivas: 689, neutras: 418, negativas: 252 })).toEqual([51, 31, 18]);
    expect(centesimosDoTom({ positivas: 1, neutras: 1, negativas: 1 })).toEqual([34, 33, 33]);
  });

  it('sem contagens ou com total zero: null', () => {
    expect(centesimosDoTom(null)).toBeNull();
    expect(centesimosDoTom({ positivas: 0, neutras: 0, negativas: 0 })).toBeNull();
  });
});

describe('semAbertura', () => {
  it('tira a primeira frase do resumo e mantém o resto', () => {
    expect(semAbertura('Resumo do pregão de quinta-feira, 22 de outubro de 2026. O Ibovespa fechou em 1 pts.')).toBe(
      'O Ibovespa fechou em 1 pts.',
    );
  });

  it('devolve o texto igual quando não começa com a abertura', () => {
    expect(semAbertura('O Ibovespa subiu.')).toBe('O Ibovespa subiu.');
  });
});

describe('partesDoTom', () => {
  it('divide o tom em frações que somam 1', () => {
    const partes = partesDoTom({ total: 10, positivas: 2, neutras: 6, negativas: 2 });
    expect(partes.positivas).toBeCloseTo(0.2);
    expect(partes.neutras).toBeCloseTo(0.6);
    expect(partes.negativas).toBeCloseTo(0.2);
  });

  it('sem contagem completa ou com total zero: null, nunca barra com zero', () => {
    expect(partesDoTom(null)).toBeNull();
    expect(partesDoTom({ total: 4, positivas: 2, neutras: null, negativas: 2 })).toBeNull();
    expect(partesDoTom({ total: 0, positivas: 0, neutras: 0, negativas: 0 })).toBeNull();
  });
});

describe('fechamentoAnterior', () => {
  it('desfaz a variação do dia', () => {
    expect(fechamentoAnterior(5.0333, 0.0026)).toBeCloseTo(5.0333 / 1.0026, 10);
  });
  it('sem valor, sem variação ou variação de −100%: null', () => {
    expect(fechamentoAnterior(null, 0.01)).toBeNull();
    expect(fechamentoAnterior(5, null)).toBeNull();
    expect(fechamentoAnterior(5, -1)).toBeNull();
  });
});

describe('fracaoDe e tetoVezes', () => {
  it('fração do módulo sobre o teto, presa em 1', () => {
    expect(fracaoDe(0.025, 0.05)).toBe(0.5);
    expect(fracaoDe(-0.05, 0.05)).toBe(1);
    expect(fracaoDe(3, 2)).toBe(1);
    expect(fracaoDe(null, 1)).toBeNull();
    expect(fracaoDe(1, 0)).toBeNull();
  });
  it('teto do volume nunca abaixo de 2', () => {
    expect(tetoVezes([1.5])).toBe(2);
    expect(tetoVezes([3.2, 2])).toBe(3.2);
    expect(tetoVezes([])).toBeNull();
    expect(tetoVezes([null])).toBeNull();
  });
});

describe('linhaDoTempo', () => {
  const hoje = '2026-10-22';
  it('um ponto por data, posição entre hoje e o último dia', () => {
    const t = linhaDoTempo(
      [
        { ticker: 'AAAA3', data_pagamento: '2026-10-24' },
        { ticker: 'BBBB3', data_pagamento: '2026-10-24' },
        { ticker: 'CCCC3', data_pagamento: '2026-11-05' },
        { ticker: 'DDDD3', data_pagamento: '2026-10-01' },
      ],
      hoje,
    );
    expect(t.ate).toBe(14);
    expect(t.pontos).toHaveLength(2);
    expect(t.pontos[0]).toMatchObject({ dias: 2, tickers: ['AAAA3', 'BBBB3'], posicao: 0.1429 });
    expect(t.pontos[1].posicao).toBe(1);
  });
  it('pagamento perto de hoje: a régua tem pelo menos 7 dias', () => {
    expect(linhaDoTempo([{ ticker: 'A', data_pagamento: '2026-10-23' }], hoje).ate).toBe(7);
  });
  it('sem datas futuras: null', () => {
    expect(linhaDoTempo([], hoje)).toBeNull();
    expect(linhaDoTempo([{ ticker: 'A', data_pagamento: null }], hoje)).toBeNull();
  });
});
