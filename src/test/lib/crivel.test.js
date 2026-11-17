import { describe, expect, it } from 'vitest';
import {
  janelaComSalto,
  saltoDeEscala,
  ultimoSalto,
  variacaoDiaConfiavel,
  variacaoDiaCrivel,
  variacaoDiaSuspeita,
} from '../../lib/crivel.js';

describe('variação do dia crível', () => {
  it('aceita a faixa de −75% a +100% (fração)', () => {
    expect(variacaoDiaCrivel(0.05)).toBe(true);
    expect(variacaoDiaCrivel(-0.2)).toBe(true);
    expect(variacaoDiaCrivel(1)).toBe(true);
    expect(variacaoDiaCrivel(-0.75)).toBe(true);
    expect(variacaoDiaCrivel(0)).toBe(true);
  });

  it('rejeita o que passa de +100% ou fica abaixo de −75%', () => {
    expect(variacaoDiaCrivel(1.0001)).toBe(false);
    expect(variacaoDiaCrivel(89.33)).toBe(false);
    expect(variacaoDiaCrivel(-0.7501)).toBe(false);
  });

  it('null e NaN não são crível nem suspeita', () => {
    expect(variacaoDiaCrivel(null)).toBe(false);
    expect(variacaoDiaCrivel(NaN)).toBe(false);
    expect(variacaoDiaSuspeita(null)).toBe(false);
    expect(variacaoDiaSuspeita(NaN)).toBe(false);
    expect(variacaoDiaConfiavel(null)).toBeNull();
    expect(variacaoDiaConfiavel(NaN)).toBeNull();
  });

  it('suspeita é o número fora da faixa', () => {
    expect(variacaoDiaSuspeita(89.33)).toBe(true);
    expect(variacaoDiaSuspeita(-0.9)).toBe(true);
    expect(variacaoDiaSuspeita(0.5)).toBe(false);
  });

  it('variacaoDiaConfiavel devolve o número crível e null para o resto', () => {
    expect(variacaoDiaConfiavel(0.0125)).toBe(0.0125);
    expect(variacaoDiaConfiavel(89.33)).toBeNull();
    expect(variacaoDiaConfiavel(-0.9)).toBeNull();
  });
});

describe('salto de escala nos fechamentos', () => {
  it('RAIZ4: R$ 0,30 para R$ 27,10 é salto (ponto depois do salto)', () => {
    const fechamentos = [0.3, 0.3, 27.1, 27.4];
    expect(saltoDeEscala(fechamentos)).toBe(2);
    expect(janelaComSalto(fechamentos)).toBe(true);
  });

  it('desdobramento 40 para 8 é salto', () => {
    expect(saltoDeEscala([40, 40, 8, 8])).toBe(2);
    expect(janelaComSalto([40, 8])).toBe(true);
  });

  it('queda real forte (MGLU3 −58% e VAMO3 −57% em 26/10/2026, circuit breaker) não é salto', () => {
    expect(janelaComSalto([12.69, 5.3, 5.75])).toBe(false);
    expect(janelaComSalto([6.41, 2.77])).toBe(false);
    // limites iguais aos da variação do dia: −75% e +100% ainda são possíveis
    expect(janelaComSalto([40, 10])).toBe(false);
    expect(janelaComSalto([10, 20])).toBe(false);
    expect(janelaComSalto([10, 20.5])).toBe(true);
  });

  it('série sem salto não tem salto', () => {
    const serie = [30, 31, 29.5, 30.2, 28, 27.9];
    expect(saltoDeEscala(serie)).toBe(-1);
    expect(janelaComSalto(serie)).toBe(false);
  });

  it('valores ausentes são pulados e não viram salto', () => {
    expect(janelaComSalto([30, null, NaN, 31])).toBe(false);
    expect(janelaComSalto([])).toBe(false);
    expect(janelaComSalto()).toBe(false);
  });
});

describe('ultimoSalto', () => {
  it('sem salto devolve -1', () => {
    expect(ultimoSalto([10, 10.5, 11])).toBe(-1);
  });
  it('acha o ponto depois do último salto, pulando ausentes', () => {
    expect(ultimoSalto([0.3, 0.31, 27.1, 27.5])).toBe(2);
    expect(ultimoSalto([10, 1, 1.1, null, 11, 11.2])).toBe(4);
  });
});
