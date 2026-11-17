import { describe, expect, it } from 'vitest';
import {
  FILTROS,
  filtrarAcoes,
  semAcento,
} from '../../lib/listaAcoes.js';

const acao = (ticker, nome, forte, atencao, contexto, variacao_dia) => ({
  ticker,
  nome,
  contagem: { forte, atencao, contexto, total: forte + atencao + contexto },
  variacao_dia,
});

const ACOES = [
  acao('PETR4', 'Petróleo Brasileiro', 1, 0, 0, 0.012),
  acao('VALE3', 'Vale', 0, 1, 2, -0.02),
  acao('ITUB4', 'Itaú Unibanco', 0, 0, 1, 0.005),
  acao('BBAS3', 'Banco do Brasil', 2, 0, 0, null),
  acao('MGLU3', 'Magazine Luiza', 0, 0, 0, 0.03),
];

const tickers = (lista) => lista.map((a) => a.ticker);

describe('constantes da lista', () => {
  it('tem os filtros na ordem da tela', () => {
    expect(FILTROS).toEqual(['todas', 'forte', 'atencao', 'contexto']);
  });
});

describe('semAcento', () => {
  it('tira acento e põe em minúsculas', () => {
    expect(semAcento('Petróleo Ação')).toBe('petroleo acao');
    expect(semAcento(null)).toBe('');
  });
});

describe('filtrarAcoes por tipo', () => {
  it('todas devolve a lista inteira', () => {
    expect(filtrarAcoes(ACOES)).toHaveLength(5);
    expect(filtrarAcoes(ACOES, { filtro: 'todas' })).toHaveLength(5);
  });

  it('forte pega ações com contagem.forte > 0', () => {
    expect(tickers(filtrarAcoes(ACOES, { filtro: 'forte' }))).toEqual(['PETR4', 'BBAS3']);
  });

  it('atencao pega ações com contagem.atencao > 0', () => {
    expect(tickers(filtrarAcoes(ACOES, { filtro: 'atencao' }))).toEqual(['VALE3']);
  });

  it('contexto pega só quem não tem forte nem atenção', () => {
    expect(tickers(filtrarAcoes(ACOES, { filtro: 'contexto' }))).toEqual(['ITUB4']);
  });

  it('filtro desconhecido vale como todas', () => {
    expect(filtrarAcoes(ACOES, { filtro: 'qualquer' })).toHaveLength(5);
  });

  it('aceita entrada nula', () => {
    expect(filtrarAcoes(null)).toEqual([]);
  });
});

describe('busca', () => {
  it('acha pelo ticker, sem diferença de caixa', () => {
    expect(tickers(filtrarAcoes(ACOES, { busca: 'vale' }))).toEqual(['VALE3']);
  });

  it('acha pelo nome da empresa sem acento', () => {
    expect(tickers(filtrarAcoes(ACOES, { busca: 'itau' }))).toEqual(['ITUB4']);
    expect(tickers(filtrarAcoes(ACOES, { busca: 'PETROLEO' }))).toEqual(['PETR4']);
  });

  it('combina busca com filtro', () => {
    expect(tickers(filtrarAcoes(ACOES, { filtro: 'forte', busca: 'banco' }))).toEqual(['BBAS3']);
  });

  it('busca em branco não restringe', () => {
    expect(filtrarAcoes(ACOES, { busca: '   ' })).toHaveLength(5);
  });
});
