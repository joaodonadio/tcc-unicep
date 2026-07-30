import { describe, expect, it } from 'vitest';
import {
  CONTORNO_NORMALIZADO,
  dentroDoContorno,
  normalizar,
  posicaoNoPalco,
} from '../lib/projecaoBrasil.js';

/**
 * Mapa (canvas) e pins (DOM) só coincidem se usarem a MESMA projeção — é o que
 * estes testes travam. Referência: posições do protótipo validado.
 */

describe('projeção do mapa do Brasil', () => {
  it('normaliza Brasília para o centro-oeste do retângulo', () => {
    const { nx, ny } = normalizar(-15.79, -47.88);
    expect(nx).toBeCloseTo(0.666, 2);
    expect(ny).toBeCloseTo(0.539, 2);
  });

  it('posiciona Brasília onde o protótipo a colocava (≈66%, ≈53%)', () => {
    const { left, top } = posicaoNoPalco(-15.79, -47.88);
    expect(left).toBeGreaterThan(64);
    expect(left).toBeLessThan(68);
    expect(top).toBeGreaterThan(51);
    expect(top).toBeLessThan(55);
  });

  it('reconhece pontos dentro e fora do contorno', () => {
    const brasilia = normalizar(-15.79, -47.88);
    const oceanoAtlantico = normalizar(-20, -30);
    expect(dentroDoContorno(brasilia.nx, brasilia.ny, CONTORNO_NORMALIZADO)).toBe(true);
    expect(dentroDoContorno(oceanoAtlantico.nx, oceanoAtlantico.ny, CONTORNO_NORMALIZADO)).toBe(
      false,
    );
  });
});
