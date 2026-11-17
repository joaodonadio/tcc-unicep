/**
 * Lista "As ações" da página inicial: filtros por tipo de sinal, busca por
 * ticker ou empresa (sem acento) e ordenação. Funções puras, sem texto de tela.
 */

import { valorOuNulo } from './valor.js';

export const FILTROS = ['todas', 'forte', 'atencao', 'contexto'];

/** Texto sem acentos e em minúsculas, para comparar buscas. */
export const semAcento = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Quantidade de sinais do tipo na ação; campo ausente não conta como sinal. */
const sinais = (a, tipo) => Number(a?.contagem?.[tipo]);

const temSinal = (a, tipo) => sinais(a, tipo) > 0;

/** Casa o filtro de tipo com a ação. */
function casaFiltro(a, filtro) {
  switch (filtro) {
    case 'forte':
      return temSinal(a, 'forte');
    case 'atencao':
      return temSinal(a, 'atencao');
    case 'contexto':
      return !temSinal(a, 'forte') && !temSinal(a, 'atencao') && temSinal(a, 'contexto');
    default:
      return true;
  }
}

/**
 * Ações que passam pelo filtro e pela busca.
 * @param {object[]} acoes entradas de montarAnaliseDoDia (ticker, nome, contagem, variacao_dia)
 * @param {{filtro?: string, busca?: string}} [opcoes]
 */
export function filtrarAcoes(acoes, { filtro = 'todas', busca = '' } = {}) {
  const termo = semAcento(String(busca ?? '').trim());
  return (acoes ?? []).filter(
    (a) =>
      casaFiltro(a, filtro) &&
      (!termo || semAcento(`${a?.ticker ?? ''} ${a?.nome ?? ''}`).includes(termo)),
  );
}

/**
 * Ação mais negociada de cada setor no dia: a de maior volume.total do resumo (empate: ticker em
 * ordem). Ação sem volume não concorre; setor sem volume não entra. Devolve um Set de tickers.
 * @param {object[]} acoesPregao entradas de data.acoes_pregao (ticker, setor_nome)
 * @param {object[]} [resumos] registros de resumo_acao (ticker, volume)
 */
export function maisNegociadaPorSetor(acoesPregao = [], resumos = []) {
  const volumeDe = new Map((resumos ?? []).map((r) => [r.ticker, valorOuNulo(r.volume?.total)]));
  const melhores = new Map();
  for (const a of acoesPregao ?? []) {
    const setor = a?.setor_nome;
    const volume = volumeDe.get(a?.ticker);
    if (!setor || volume == null) continue;
    const atual = melhores.get(setor);
    if (!atual || volume > atual.volume || (volume === atual.volume && String(a.ticker) < atual.ticker)) {
      melhores.set(setor, { ticker: String(a.ticker), volume });
    }
  }
  return new Set([...melhores.values()].map((m) => m.ticker));
}
