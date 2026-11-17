import { describe, expect, it } from 'vitest';
import { nomeCurto } from '../../lib/nomeEmpresa.js';

describe('nomeCurto', () => {
  it.each([
    ['Petróleo Brasileiro S.A.', 'Petróleo Brasileiro'],
    ['Banco Bradesco SA', 'Banco Bradesco'],
    ['Vale S/A', 'Vale'],
    ['Itaú Unibanco Holding S.A.', 'Itaú Unibanco'],
    ['Ultrapar Participações S.A.', 'Ultrapar Participações'],
  ])('tira o sufixo de %s', (entrada, esperado) => {
    expect(nomeCurto(entrada)).toBe(esperado);
  });

  it('põe em título nome todo em maiúsculas, com as preposições em minúscula', () => {
    expect(nomeCurto('BANCO DO BRASIL S.A.')).toBe('Banco do Brasil');
    expect(nomeCurto('CSN MINERACAO')).toBe('Csn Mineracao');
  });

  it('não muda nome já misto', () => {
    expect(nomeCurto('Itaú Unibanco')).toBe('Itaú Unibanco');
    expect(nomeCurto('Petrobras')).toBe('Petrobras');
  });

  it('não corta palavras que só terminam parecido', () => {
    expect(nomeCurto('Casa Verde')).toBe('Casa Verde');
    expect(nomeCurto('Raia Drogasil')).toBe('Raia Drogasil');
  });

  it('ausente ou vazio vira null, nunca 0 ou texto vazio', () => {
    expect(nomeCurto(null)).toBeNull();
    expect(nomeCurto(undefined)).toBeNull();
    expect(nomeCurto('   ')).toBeNull();
  });
});

describe('nomeCurto: nome com travessão', () => {
  it('fica com o nome conhecido depois do travessão', () => {
    expect(nomeCurto('PETRÓLEO BRASILEIRO S.A. - PETROBRAS')).toBe('Petrobras');
  });
});
