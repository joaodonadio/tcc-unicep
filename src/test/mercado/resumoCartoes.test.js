import { describe, expect, it } from 'vitest';
import { cemViraram } from '../../lib/mercadoTela.js';

describe('cemViraram: quanto viram R$ 100 com a rentabilidade', () => {
  it('converte a fração em valor final com duas casas', () => {
    expect(cemViraram(-0.097)).toBe('90,30');
    expect(cemViraram(0.068)).toBe('106,80');
    expect(cemViraram(0)).toBe('100,00');
  });

  it('sem valor finito, devolve null (nunca zero)', () => {
    expect(cemViraram(null)).toBeNull();
    expect(cemViraram(undefined)).toBeNull();
    expect(cemViraram(Number.NaN)).toBeNull();
  });
});
