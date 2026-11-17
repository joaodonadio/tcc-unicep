import { describe, expect, it } from 'vitest';
import {
  ALTURA_PULO, DURACAO_ANTECIPA, DURACAO_POUSO, DURACAO_PULO, POSE_PAVIO_NEUTRA, alturaDoPulo, formaDoPulo, poseDoPavio,
} from '../../lib/setores3d.js';

describe('poseDoPavio', () => {
  it('setor que subiu: braços para cima, sem encolher, com pulinho', () => {
    const p = poseDoPavio('alta');
    expect(p.bracos[0]).toBeLessThan(-2);
    expect(p.bracos[1]).toBeGreaterThan(2);
    expect(p.encolhe).toBe(0);
    expect(p.pulo).toBe(true);
  });

  it('setor que caiu: encolhe e inclina para a frente, braços soltos, sem pulo', () => {
    const p = poseDoPavio('queda');
    expect(p.encolhe).toBeGreaterThan(0);
    expect(p.inclina).toBeGreaterThan(0);
    expect(Math.abs(p.bracos[0])).toBeLessThan(0.5);
    expect(p.pulo).toBe(false);
  });

  it('estável, sem dado ou sinal desconhecido: pose neutra', () => {
    for (const s of ['estavel', null, undefined, 'toString']) {
      expect(poseDoPavio(s)).toBe(POSE_PAVIO_NEUTRA);
    }
    expect(POSE_PAVIO_NEUTRA).toMatchObject({ encolhe: 0, inclina: 0, pulo: false });
  });

  it('a pose muda conforme o sinal', () => {
    const alta = poseDoPavio('alta');
    const queda = poseDoPavio('queda');
    const neutra = poseDoPavio('estavel');
    expect(alta).not.toEqual(neutra);
    expect(queda).not.toEqual(neutra);
    expect(alta).not.toEqual(queda);
  });
});

describe('alturaDoPulo', () => {
  it('começa e termina no chão, sobe no meio e nunca passa de ALTURA_PULO', () => {
    expect(alturaDoPulo(0)).toBe(0);
    expect(alturaDoPulo(-1)).toBe(0);
    expect(alturaDoPulo(DURACAO_PULO)).toBe(0);
    expect(alturaDoPulo(DURACAO_PULO * 2)).toBe(0);
    expect(alturaDoPulo(DURACAO_PULO / 2)).toBeCloseTo(ALTURA_PULO);
    for (let t = 0.01; t < DURACAO_PULO; t += 0.01) {
      expect(alturaDoPulo(t)).toBeLessThanOrEqual(ALTURA_PULO + 1e-9);
    }
  });
});

describe('formaDoPulo', () => {
  const FIM = DURACAO_ANTECIPA + DURACAO_PULO + DURACAO_POUSO;

  it('antes de começar e depois de acabar: neutro, sem altura', () => {
    expect(formaDoPulo(-1)).toEqual({ altura: 0, escalaY: 1 });
    expect(formaDoPulo(0)).toEqual({ altura: 0, escalaY: 1 });
    expect(formaDoPulo(FIM + 0.01)).toEqual({ altura: 0, escalaY: 1 });
  });

  it('agacha antes de sair: escala baixa e sem altura', () => {
    const f = formaDoPulo(DURACAO_ANTECIPA * 0.99);
    expect(f.altura).toBe(0);
    expect(f.escalaY).toBeLessThan(1);
    expect(f.escalaY).toBeGreaterThan(0.85);
  });

  it('no ar sobe até ALTURA_PULO e nunca passa dela', () => {
    let max = 0;
    for (let t = DURACAO_ANTECIPA; t < DURACAO_ANTECIPA + DURACAO_PULO; t += 0.005) {
      max = Math.max(max, formaDoPulo(t).altura);
    }
    expect(max).toBeGreaterThan(ALTURA_PULO * 0.95);
    expect(max).toBeLessThanOrEqual(ALTURA_PULO + 1e-9);
  });

  it('é contínua: a escala muda pouco entre quadros de 10 ms', () => {
    let antes = formaDoPulo(0).escalaY;
    for (let t = 0.01; t <= FIM; t += 0.01) {
      const agora = formaDoPulo(t).escalaY;
      expect(Math.abs(agora - antes)).toBeLessThan(0.03);
      antes = agora;
    }
  });
});
