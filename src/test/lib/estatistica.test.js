import { describe, expect, it } from 'vitest';
import { quartis } from '../../lib/estatistica.js';

describe('quartis', () => {
  it('calcula os quartis de uma sequência simples', () => {
    const r = quartis([1, 2, 3, 4, 5]);
    expect(r.q1).toBe(2);
    expect(r.mediana).toBe(3);
    expect(r.q3).toBe(4);
    expect(r.min).toBe(1);
    expect(r.max).toBe(5);
    expect(r.n).toBe(5);
    expect(r.atipicos).toEqual([]);
  });

  it('separa o valor fora das cercas de Tukey como atípico e deixa o máximo dentro delas', () => {
    const r = quartis([1, 2, 3, 4, 100]);
    expect(r.atipicos).toEqual([100]);
    expect(r.max).toBe(4);
    expect(r.min).toBe(1);
    expect(r.mediana).toBe(3);
  });

  it('devolve null com menos de 3 valores válidos', () => {
    expect(quartis([])).toBeNull();
    expect(quartis([1, 2])).toBeNull();
  });

  it('ignora null, NaN e infinitos', () => {
    const r = quartis([1, null, NaN, 2, 3, 4, Infinity]);
    expect(r.n).toBe(4);
    expect(r.mediana).toBe(2.5);
  });
});
