import { describe, expect, it } from 'vitest';
import {
  brl,
  brlCompacto,
  numero,
  pct,
  pontos,
  pp,
  quantidade,
  quantidadeCheia,
  vezes,
} from '../../lib/formato.js';

describe('porcentagem', () => {
  it('negativo usa o menos tipográfico U+2212', () => {
    expect(pct(-0.011501)).toBe('−1,2%');
  });

  it('positivo recebe sinal de mais', () => {
    expect(pct(0.0013853)).toBe('+0,1%');
  });

  it('zero não recebe sinal', () => {
    expect(pct(0)).toBe('0,0%');
    expect(pct(0.0001)).toBe('0,0%');
  });

  it('sinal pode ser omitido para positivos', () => {
    expect(pct(0.05, { sinal: false })).toBe('5,0%');
  });

  it('null e undefined viram string vazia, nunca zero', () => {
    expect(pct(null)).toBe('');
    expect(pct(undefined)).toBe('');
  });

  it('diferença em pontos percentuais', () => {
    expect(pp(0.052)).toBe('+5,2 p.p.');
  });
});

describe('moeda', () => {
  it('brl usa vírgula decimal e duas casas', () => {
    expect(brl(57.83)).toBe('R$ 57,83');
  });

  it('brlCompacto usa bilhões', () => {
    expect(brlCompacto(15397436000)).toBe('R$ 15,4 bi');
    expect(brlCompacto(273323000000)).toBe('R$ 273,3 bi');
  });

  it('brlCompacto usa milhões e mil', () => {
    expect(brlCompacto(980000000)).toBe('R$ 980,0 mi');
    expect(brlCompacto(12500)).toBe('R$ 12,5 mil');
  });

  it('brlCompacto abaixo de mil cai no formato comum', () => {
    expect(brlCompacto(999.5)).toBe('R$ 999,50');
  });

  it('brlCompacto negativo usa o menos U+2212', () => {
    expect(brlCompacto(-15397436000)).toBe('−R$ 15,4 bi');
  });
});

describe('números', () => {
  it('numero usa separador de milhar e vírgula', () => {
    expect(numero(1234.5)).toBe('1.234,50');
  });

  it('vezes usa uma casa e o símbolo de multiplicação', () => {
    expect(vezes(0.9394)).toBe('0,9×');
  });

  it('pontos do índice', () => {
    expect(pontos(204120)).toBe('204.120 pts');
  });

  it('quantidade compacta', () => {
    expect(quantidade(39860200)).toBe('39,9 milhões');
    expect(quantidade(1200)).toBe('1,2 mil');
    expect(quantidade(850)).toBe('850');
  });

  it('quantidade cheia com separador de milhar', () => {
    expect(quantidadeCheia(39860200)).toBe('39.860.200');
  });
});
