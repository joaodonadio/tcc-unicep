import { describe, expect, it } from 'vitest';
import { validarAnaliseDoDia, validarRespostaChat } from '../services/validacao.js';
import analiseDoDia from '../mocks/analise-do-dia.json';

/**
 * A regra da §3 é "registro inválido → estado de erro do card, nunca tela
 * quebrada". Estes testes fixam esse contrato.
 */

describe('validarAnaliseDoDia', () => {
  it('aceita o mock de referência sem descartar nada', () => {
    const resultado = validarAnaliseDoDia(analiseDoDia);
    expect(resultado.descartados).toBe(0);
    expect(resultado.recomendacoes).toHaveLength(6);
  });

  it('descarta apenas a recomendação malformada e mantém a tela de pé', () => {
    const corrompido = {
      ...analiseDoDia,
      recomendacoes: [
        ...analiseDoDia.recomendacoes,
        { id: 'quebrada', ticker: 'XXXX', tipo: 'oportunidade' },
      ],
    };
    const resultado = validarAnaliseDoDia(corrompido);
    expect(resultado.descartados).toBe(1);
    expect(resultado.recomendacoes.some((r) => r.id === 'quebrada')).toBe(false);
  });

  it('rejeita payload sem os campos estruturais', () => {
    expect(() => validarAnaliseDoDia({ gerado_em: '2026-07-14T09:42:00-03:00' })).toThrow(
      /recomendacoes/,
    );
    expect(() => validarAnaliseDoDia(null)).toThrow();
  });

  it('recusa confiança fora da faixa 0–100', () => {
    const forte = {
      ...analiseDoDia,
      recomendacoes: [{ ...analiseDoDia.recomendacoes[0], confianca: 140 }],
    };
    expect(validarAnaliseDoDia(forte).recomendacoes).toHaveLength(0);
  });
});

describe('validarRespostaChat', () => {
  it('normaliza campos ausentes para o formato do contrato', () => {
    const resultado = validarRespostaChat({ resposta: 'olá' });
    expect(resultado).toMatchObject({ tickers_citados: [], fontes: [], modo: 'llm' });
  });

  it('preserva o modo fallback para a UI poder avisar (RA-9)', () => {
    expect(validarRespostaChat({ resposta: 'x', modo: 'fallback' }).modo).toBe('fallback');
  });
});
