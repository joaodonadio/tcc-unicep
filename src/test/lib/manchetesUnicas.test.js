import { describe, expect, it } from 'vitest';
import { contarManchetesUnicas } from '../../lib/resumoDia.js';

// a mesma manchete aparece para cada classe de ação da empresa (BBDC3 e BBDC4)
const noticias = [
  {
    ticker: 'BBDC3',
    itens: [
      { titulo: 'Banco lucra', rotulo: 'positivo' },
      { titulo: 'Juros sobem', rotulo: 'negativo' },
    ],
  },
  {
    ticker: 'BBDC4',
    itens: [
      { titulo: 'Banco lucra', rotulo: 'positivo' },
      { titulo: 'Mercado calmo', rotulo: 'neutro' },
    ],
  },
];

describe('contarManchetesUnicas', () => {
  it('conta cada título uma vez, por rótulo', () => {
    expect(contarManchetesUnicas(noticias)).toEqual({ total: 3, positivas: 1, neutras: 1, negativas: 1 });
  });

  it('sem manchetes, devolve null (e não zero)', () => {
    expect(contarManchetesUnicas([])).toBeNull();
    expect(contarManchetesUnicas([{ ticker: 'AAAA3', itens: [] }])).toBeNull();
  });
});
