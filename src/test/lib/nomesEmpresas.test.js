import { describe, expect, it } from 'vitest';
import { corrigirNome } from '../../lib/nomesEmpresas.js';

describe('corrigirNome', () => {
  it.each([
    ['CSN Mineracao', 'CSN Mineração'],
    ['Sao Martinho', 'São Martinho'],
    ['Itau Unibanco', 'Itaú Unibanco'],
    ['PetroReconcavo', 'PetroRecôncavo'],
    ['Rede DOr', "Rede D'Or"],
    ['Pao de Acucar', 'Pão de Açúcar'],
    ['Metalurgica Gerdau', 'Metalúrgica Gerdau'],
    ['Raizen', 'Raízen'],
    ['SLC Agricola', 'SLC Agrícola'],
  ])('corrige %s', (entrada, esperado) => {
    expect(corrigirNome(entrada)).toBe(esperado);
  });

  it('preserva a inicial minúscula da palavra original', () => {
    expect(corrigirNome('acucar')).toBe('açúcar');
  });

  it('não altera nomes já corretos', () => {
    expect(corrigirNome('Petrobras')).toBe('Petrobras');
    expect(corrigirNome('CSN')).toBe('CSN');
    expect(corrigirNome('Gás Natural')).toBe('Gás Natural');
    expect(corrigirNome('Auren Energia')).toBe('Auren Energia');
  });

  it('só troca palavras inteiras', () => {
    expect(corrigirNome('Saudade Holding')).toBe('Saudade Holding');
    expect(corrigirNome('Itausa')).toBe('Itaúsa');
  });

  it('é idempotente', () => {
    const uma = corrigirNome('CSN Mineracao');
    expect(corrigirNome(uma)).toBe(uma);
  });

  it('devolve valores que não são texto sem mexer', () => {
    expect(corrigirNome(null)).toBeNull();
    expect(corrigirNome(undefined)).toBeUndefined();
  });
});
