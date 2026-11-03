import { describe, expect, it } from 'vitest';
import { ACOES, HUMORES, humorDoResumo } from '../../lib/mascote.js';

describe('humorDoResumo: humor do Pavio pelos motivos da ação', () => {
  it('atenção vence, mesmo com motivo forte', () => {
    expect(humorDoResumo({ forte: 2, atencao: 1, contexto: 0 })).toBe('atento');
  });

  it('motivo forte sem atenção deixa contente', () => {
    expect(humorDoResumo({ forte: 1, atencao: 0, contexto: 3 })).toBe('contente');
  });

  it('zeros ou só contexto ficam neutros', () => {
    expect(humorDoResumo({ forte: 0, atencao: 0, contexto: 2 })).toBe('neutro');
  });

  it('sem contagem, ou com campos que não são números, fica neutro', () => {
    expect(humorDoResumo(null)).toBe('neutro');
    expect(humorDoResumo(undefined)).toBe('neutro');
    expect(humorDoResumo({})).toBe('neutro');
    expect(humorDoResumo({ forte: '2', atencao: 'x' })).toBe('neutro');
    expect(humorDoResumo({ forte: NaN, atencao: NaN })).toBe('neutro');
  });
});

describe('listas do Pavio', () => {
  it('tem os cinco humores, com o neutro como padrão', () => {
    expect(HUMORES).toEqual(['neutro', 'contente', 'atento', 'pensativo', 'dormindo']);
  });

  it('tem as ações ocioso, acenando e vivo (válida para o Top 5)', () => {
    expect(ACOES).toEqual(['ocioso', 'acenando', 'vivo']);
  });
});
