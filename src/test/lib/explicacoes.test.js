// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { EXPLICACOES } from '../../lib/explicacoes.js';

/** Conceitos que a interface precisa explicar (Hoje, Mercado e os termos da análise). */
const CHAVES_OBRIGATORIAS = [
  'pregao',
  'sinais',
  'regra_acender',
  'setor',
  'ibovespa',
  'dolar',
  'proventos',
  'pl',
  'roe',
  'cdi',
  'ipca',
  'ivvb11',
  'smll',
  'idiv',
  'brent',
  'finbert',
  'tres_noticias',
  'volume',
];

describe('explicações: conceitos obrigatórios', () => {
  it.each(CHAVES_OBRIGATORIAS)('%s existe com título, texto simples e técnico preenchidos', (chave) => {
    const item = EXPLICACOES[chave];
    expect(item, `falta EXPLICACOES.${chave}`).toBeDefined();
    expect(item.titulo.trim()).not.toBe('');
    expect(item.simples.trim()).not.toBe('');
    expect(item.tecnico.trim()).not.toBe('');
  });

  it('o texto simples de volume fala em quantidade de ações', () => {
    expect(EXPLICACOES.volume.simples).toMatch(/quantidade de ações/);
  });
});
