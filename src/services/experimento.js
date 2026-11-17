/**
 * Normalização do experimento "maior chance de superar o Ibovespa".
 *
 * O experimento está em avaliação: a chance só aparece quando o pacote marca
 * `exibir: true`. Nada aqui é sugestão de compra.
 */

const TITULO_PADRAO = 'Maior chance de superar o Ibovespa no próximo pregão (experimento)';
import { AVISO_FIXO as AVISO_PADRAO } from '../lib/textos.js';
import { valorOuNulo } from '../lib/valor.js';
const SELO_PADRAO = 'em avaliação';
const SELOS_EM_AVALIACAO = new Set(['em_avaliacao', 'em avaliação']);
const EFEITOS = new Set(['ajudou', 'atrapalhou', 'neutro']);

function normalizarSelo(selo) {
  if (selo == null) return SELO_PADRAO;
  return SELOS_EM_AVALIACAO.has(selo) ? SELO_PADRAO : selo;
}

/** Aceita envelope com `registros`, lista, ou o registro direto. Devolve o registro ou null. */
function extrairRegistro(resp) {
  if (!resp || typeof resp !== 'object') return null;
  if (Array.isArray(resp)) return resp[0] ?? null;
  if (Array.isArray(resp.registros)) return resp.registros[0] ?? null;
  if ('registros' in resp) return null;
  return Object.keys(resp).length ? resp : null;
}

function normalizarMotivo(motivo) {
  return {
    texto: motivo.texto,
    efeito: EFEITOS.has(motivo.efeito) ? motivo.efeito : 'neutro',
    fator: motivo.fator,
    valor: motivo.valor,
  };
}

function normalizarChance(chance) {
  if (chance?.exibir !== true || chance?.valor == null) return null;
  // sem referência do acaso a chance não é mostrada
  const referencia = chance.media ?? chance.referencia_acaso ?? null;
  if (referencia == null) return null;
  return { valor: chance.valor, referencia };
}

function normalizarItem(item) {
  return {
    posicao: item.posicao,
    ticker: item.ticker,
    chance: normalizarChance(item.chance),
    motivos: (item.motivos ?? []).map(normalizarMotivo),
    noticiasUsadas: [],
  };
}

/** Normaliza o top do experimento. Devolve null quando não há pacote gerado. */
export function normalizarTop(resp) {
  const r = extrairRegistro(resp);
  if (!r) return null;

  const lista = r.ranking ?? r.top3 ?? r.top5 ?? [];
  return {
    titulo: r.titulo ?? TITULO_PADRAO,
    selo: normalizarSelo(r.selo),
    avisoFixo: r.aviso_fixo ?? AVISO_PADRAO,
    avisos: r.avisos ?? [],
    dataReferencia: r.data_referencia ?? null,
    itens: [...lista].sort((a, b) => a.posicao - b.posicao).map(normalizarItem),
  };
}

/** Número puro, ou campo {valor, status} com status ok; o resto é null (ausência nunca vira 0). */
function numeroOuNulo(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v && typeof v === 'object') return valorOuNulo(v);
  return null;
}

/** Faixa do acaso: par de números, puro ou dentro de {valor, status}; senão null. */
function faixaOuNula(v) {
  const par = v && typeof v === 'object' && !Array.isArray(v) ? valorOuNulo(v) : v;
  return Array.isArray(par) && par.length === 2 && par.every((n) => typeof n === 'number') ? par : null;
}

/** Normaliza o histórico de acertos do experimento. Devolve null quando não há pacote. */
export function normalizarHistorico(resp) {
  const r = extrairRegistro(resp);
  if (!r) return null;

  const resumo = r.resumo ?? {};
  // o pacote manda `dia` (um dia, ou null) em vez da lista `dias`
  const dias = Array.isArray(r.dias) ? r.dias : r.dia && typeof r.dia === 'object' ? [r.dia] : [];
  return {
    resumo: {
      nDias: numeroOuNulo(resumo.n_dias),
      taxaAcerto: numeroOuNulo(resumo.taxa_acerto),
      acasoMedia: numeroOuNulo(resumo.acaso_media),
      acasoFaixa: faixaOuNula(resumo.acaso_faixa),
      nota: resumo.nota ?? null,
    },
    dias,
  };
}
