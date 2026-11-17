import { describe, expect, it } from 'vitest';
import { brilhoDoSentimento, porcentagemDoTotal, tomPredominante } from '../../lib/termometroNoticias.js';

describe('brilhoDoSentimento', () => {
  it('otimista é alta, pessimista é queda, neutro e ausente ficam em aço', () => {
    expect(brilhoDoSentimento('otimista')).toBe('alta');
    expect(brilhoDoSentimento('otimista_moderado')).toBe('alta');
    expect(brilhoDoSentimento('pessimista')).toBe('queda');
    expect(brilhoDoSentimento('pessimista_moderado')).toBe('queda');
    expect(brilhoDoSentimento('neutro')).toBe('aco');
    expect(brilhoDoSentimento(null)).toBe('aco');
    expect(brilhoDoSentimento('algo_novo')).toBe('aco');
  });
});

describe('porcentagemDoTotal', () => {
  it('arredonda a parte do total em porcentagem inteira', () => {
    expect(porcentagemDoTotal(328, 1482)).toBe(22);
    expect(porcentagemDoTotal(681, 1482)).toBe(46);
  });

  it('sem total ou com valor ausente devolve null, nunca 0', () => {
    expect(porcentagemDoTotal(5, 0)).toBeNull();
    expect(porcentagemDoTotal(null, 10)).toBeNull();
    expect(porcentagemDoTotal(3, null)).toBeNull();
  });
});

describe('tomPredominante', () => {
  it('devolve o tom com mais manchetes', () => {
    expect(tomPredominante({ positivas: 30, neutras: 43, negativas: 56 })).toBe('negativas');
    expect(tomPredominante({ positivas: 50, neutras: 2, negativas: 1 })).toBe('positivas');
    expect(tomPredominante({ positivas: 1, neutras: 9, negativas: 2 })).toBe('neutras');
  });

  it('empate entre os maiores devolve empate', () => {
    expect(tomPredominante({ positivas: 4, neutras: 4, negativas: 1 })).toBe('empate');
  });

  it('qualquer contagem ausente, ou todas zeradas, devolve null', () => {
    expect(tomPredominante({ positivas: 3, neutras: null, negativas: 1 })).toBeNull();
    expect(tomPredominante({ positivas: 0, neutras: 0, negativas: 0 })).toBeNull();
    expect(tomPredominante({})).toBeNull();
  });
});
