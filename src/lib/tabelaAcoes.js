/**
 * Tabela completa de "As ações": monta as linhas com os números de cada ação e
 * ordena por coluna. Funções puras, sem texto de tela.
 *
 * Valor ausente fica null (ou um campo {valor: null, status}, que explica o motivo),
 * nunca 0. Nulos ficam sempre por último, em qualquer direção.
 */

import { valorOuNulo } from './valor.js';

/** Colunas que podem ordenar a tabela, na ordem em que aparecem. */
export const COLUNAS_TABELA = [
  'ticker',
  'setor',
  'preco',
  'dia',
  'm1',
  'a1',
  'pl',
  'pvp',
  'roe',
  'dy',
  'dl_ebitda',
  'volume',
];

const DIRECOES = ['ascending', 'descending'];
const COLUNAS_DE_TEXTO = ['ticker', 'setor'];

const ehCampo = (c) => c != null && typeof c === 'object' && 'status' in c;

/**
 * Primeiro valor utilizável entre os candidatos (número puro ou campo {valor, status}).
 * Sem valor, devolve o primeiro campo com status, para explicar a ausência.
 */
function primeiroCampo(...candidatos) {
  for (const c of candidatos) {
    if (typeof c === 'number' && Number.isFinite(c)) return { valor: c, status: 'ok' };
    if (ehCampo(c) && valorOuNulo(c) != null) return c;
  }
  return candidatos.find(ehCampo) ?? { valor: null, status: 'indisponivel' };
}

/**
 * Linhas da tabela, na ordem recebida (a da lista filtrada).
 * @param {object[]} acoesPregao entradas de data.acoes_pregao (ou da lista já filtrada)
 * @param {object[]} [sugestoes] cartões de data.sugestoes; traz resumo_acao só das ações com sinal
 * @param {object[]} [resumos] registros de resumo_acao (todas as ações); têm prioridade
 */
export function linhasDaTabela(acoesPregao = [], sugestoes = [], resumos = []) {
  const resumoDe = new Map();
  for (const s of sugestoes ?? []) {
    if (s?.ticker && s.resumo_acao) resumoDe.set(s.ticker, s.resumo_acao);
  }
  for (const r of resumos ?? []) {
    if (r?.ticker) resumoDe.set(r.ticker, r);
  }

  return (acoesPregao ?? []).map((acao) => {
    const R = resumoDe.get(acao.ticker) ?? {};
    return {
      ticker: acao.ticker,
      nome: acao.nome ?? null,
      setor: acao.setor_nome ?? null,
      preco: primeiroCampo(acao.fechamento, R.cotacao?.fechamento),
      dia: primeiroCampo(acao.variacao_dia, R.cotacao?.variacao_dia),
      m1: primeiroCampo(R.variacao_preco?.m1),
      a1: primeiroCampo(R.variacao_preco?.a1),
      pl: primeiroCampo(R.pl),
      pvp: primeiroCampo(R.pvp),
      roe: primeiroCampo(R.roe),
      dy: primeiroCampo(R.dividend_yield),
      dl_ebitda: primeiroCampo(R.endividamento?.dl_ebitda),
      volume: primeiroCampo(R.volume?.relativo),
    };
  });
}

/** Valor comparável da célula: número, texto ou null. */
function valorDaCelula(linha, coluna) {
  const v = linha[coluna];
  if (v != null && typeof v === 'object') return valorOuNulo(v);
  return v === '' ? null : (v ?? null);
}

/**
 * Nova lista ordenada pela coluna. direcao 'ascending' ou 'descending'; sem coluna ou
 * direção válida, devolve a ordem recebida. Nulos vão para o fim em qualquer direção.
 */
export function ordenarTabela(linhas = [], coluna = null, direcao = 'none') {
  const copia = [...(linhas ?? [])];
  if (!COLUNAS_TABELA.includes(coluna) || !DIRECOES.includes(direcao)) return copia;

  const sentido = direcao === 'descending' ? -1 : 1;
  const textual = COLUNAS_DE_TEXTO.includes(coluna);

  return copia.sort((x, y) => {
    const a = valorDaCelula(x, coluna);
    const b = valorDaCelula(y, coluna);
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    const cmp = textual
      ? String(a).localeCompare(String(b), 'pt-BR', { numeric: true, sensitivity: 'base' })
      : a - b;
    return sentido * cmp;
  });
}
