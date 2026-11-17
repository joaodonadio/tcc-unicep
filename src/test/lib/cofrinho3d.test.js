import { describe, expect, it } from 'vitest';
import { abanoDasOrelhas, abanoDoRabo, formaDoCofrinho, olhoContente } from '../../lib/cofrinho3d.js';

describe('formaDoCofrinho', () => {
  it('fica neutro longe da moeda', () => {
    expect(formaDoCofrinho(-1)).toEqual({ altura: 0, escalaY: 1, inclina: 0 });
  });

  it('não dá salto entre um quadro e o seguinte', () => {
    let antes = formaDoCofrinho(-1);
    for (let t = -1; t < 2.4; t += 1 / 120) {
      const agora = formaDoCofrinho(t);
      expect(Math.abs(agora.altura - antes.altura)).toBeLessThan(0.03);
      expect(Math.abs(agora.escalaY - antes.escalaY)).toBeLessThan(0.02);
      expect(Math.abs(agora.inclina - antes.inclina)).toBeLessThan(0.02);
      antes = agora;
    }
  });

  it('sobe no pulo e volta ao chão', () => {
    expect(formaDoCofrinho(0.15).altura).toBeGreaterThan(0.2);
    expect(formaDoCofrinho(0.5).altura).toBe(0);
  });

  it('o balanço morre antes do próximo ciclo', () => {
    expect(Math.abs(formaDoCofrinho(2.4).inclina)).toBeLessThan(0.001);
  });
});

describe('orelhas, rabo e olhos', () => {
  it('só reagem depois da moeda', () => {
    expect(abanoDasOrelhas(-0.2)).toBe(0);
    expect(abanoDoRabo(-0.2)).toBe(0);
    expect(olhoContente(-0.2)).toBe(1);
  });

  it('os olhos apertam e voltam', () => {
    expect(olhoContente(0.3)).toBe(0.5);
    expect(olhoContente(1)).toBe(1);
  });
});
