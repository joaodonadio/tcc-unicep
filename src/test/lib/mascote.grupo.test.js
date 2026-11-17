import { describe, expect, it } from 'vitest';
import { humorDaMaioriaDeSinais } from '../../lib/mascote.js';

describe('humorDaMaioriaDeSinais: humor do grupo pela maioria das variações do dia', () => {
  it('mais altas que quedas: contente', () => {
    expect(humorDaMaioriaDeSinais(['up', 'up', 'down', 'flat'])).toBe('contente');
  });

  it('mais quedas que altas: preocupado', () => {
    expect(humorDaMaioriaDeSinais(['down', 'down', 'up'])).toBe('preocupado');
  });

  it('empate ou só estáveis: neutro', () => {
    expect(humorDaMaioriaDeSinais(['up', 'down'])).toBe('neutro');
    expect(humorDaMaioriaDeSinais(['flat', 'flat'])).toBe('neutro');
  });

  it('sem nenhum sinal conhecido: pensativo, nunca neutro', () => {
    expect(humorDaMaioriaDeSinais([])).toBe('pensativo');
    expect(humorDaMaioriaDeSinais([null, undefined])).toBe('pensativo');
  });
});
