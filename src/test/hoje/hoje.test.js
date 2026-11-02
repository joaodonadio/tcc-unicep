import { describe, expect, it } from 'vitest';
import { partesDoTom, semAbertura } from '../../lib/hoje.js';

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
