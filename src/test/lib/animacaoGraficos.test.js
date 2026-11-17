import { describe, expect, it } from 'vitest';
import { animacaoGrafico, transicaoBalao } from '../../lib/animacaoGraficos.js';

describe('animacaoGrafico', () => {
  it('com animação, entrada e troca de dados usam 300ms e cubicOut', () => {
    expect(animacaoGrafico(true)).toEqual({
      animation: true,
      animationDuration: 300,
      animationDurationUpdate: 300,
      animationEasing: 'cubicOut',
      animationEasingUpdate: 'cubicOut',
    });
  });

  it('a duração da entrada pode ser outra, sem mudar a da troca', () => {
    const o = animacaoGrafico(true, 1100);
    expect(o.animationDuration).toBe(1100);
    expect(o.animationDurationUpdate).toBe(300);
  });

  it('sem animação (movimento reduzido), desliga tudo', () => {
    expect(animacaoGrafico(false).animation).toBe(false);
  });
});

describe('transicaoBalao', () => {
  it('150ms com animação e zero sem ela', () => {
    expect(transicaoBalao(true)).toEqual({ transitionDuration: 0.15 });
    expect(transicaoBalao(false)).toEqual({ transitionDuration: 0 });
  });
});
