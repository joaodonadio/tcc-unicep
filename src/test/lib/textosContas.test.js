import { describe, expect, it } from 'vitest';
import { TEXTOS } from '../../lib/textos.js';

describe('TEXTOS.contas', () => {
  it('toda conta tem o texto simples e o técnico diferentes', () => {
    Object.values(TEXTOS.contas.itens).forEach((item) => {
      expect(item.como.simples).toBeTruthy();
      expect(item.como.tecnico).toBeTruthy();
      expect(item.como.simples).not.toBe(item.como.tecnico);
    });
  });

  it('intro tem os dois níveis diferentes', () => {
    expect(TEXTOS.contas.intro.simples).not.toBe(TEXTOS.contas.intro.tecnico);
  });
});
