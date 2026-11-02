import { describe, expect, it } from 'vitest';
import { ancoraDoSetor, descricaoDoSetor, sinalDaVariacao } from '../../lib/setores.js';
import { TEXTOS } from '../../lib/textos.js';

describe('ancoraDoSetor', () => {
  it('gera um id sem acento e sem espaço para o cartão do setor', () => {
    expect(ancoraDoSetor('Consumo cíclico')).toBe('setor-consumo-ciclico');
    expect(ancoraDoSetor('Petróleo e gás')).toBe('setor-petroleo-e-gas');
    expect(ancoraDoSetor('Saúde')).toBe('setor-saude');
  });
});

describe('descricaoDoSetor', () => {
  it('acha a descrição pelo nome bruto da B3 e pelo nome curto da tela', () => {
    const descricoes = TEXTOS.setores.descricoes;
    expect(descricaoDoSetor('Utilidade Pública', descricoes)).toBe(descricoes['Utilidade Pública']);
    expect(descricaoDoSetor('Utilidade pública', descricoes)).toBe(descricoes['Utilidade Pública']);
    expect(descricaoDoSetor('Petróleo e gás', descricoes)).toBe(descricoes['Petróleo, Gás e Biocombustíveis']);
  });

  it('devolve null para setor sem descrição, sem inventar texto', () => {
    expect(descricaoDoSetor('Setor novo', TEXTOS.setores.descricoes)).toBeNull();
  });
});

describe('sinalDaVariacao', () => {
  it('separa alta, queda e estável; sem valor não vira zero', () => {
    expect(sinalDaVariacao(1.2)).toBe('alta');
    expect(sinalDaVariacao(-0.4)).toBe('queda');
    expect(sinalDaVariacao(0)).toBe('estavel');
    expect(sinalDaVariacao(null)).toBe('estavel');
  });
});
