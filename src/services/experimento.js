/**
 * Normalização do experimento "maior chance de superar o Ibovespa".
 *
 * O experimento está em avaliação: a chance só aparece quando o pacote marca
 * `exibir: true`. Nada aqui é sugestão de compra.
 */

const TITULO_PADRAO = 'Maior chance de superar o Ibovespa no próximo pregão (experimento)';
import { AVISO_FIXO as AVISO_PADRAO } from '../lib/textos.js';
const SELO_PADRAO = 'em avaliação';
const SELOS_EM_AVALIACAO = new Set(['em_avaliacao', 'em avaliação']);
const EFEITOS = new Set(['ajudou', 'atrapalhou', 'neutro']);
const REFERENCIA_PADRAO = 0.5;

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
  return {
    valor: chance.valor,
    referencia: chance.media ?? chance.referencia_acaso ?? REFERENCIA_PADRAO,
  };
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

/** Normaliza o histórico de acertos do experimento. Devolve null quando não há pacote. */
export function normalizarHistorico(resp) {
  const r = extrairRegistro(resp);
  if (!r) return null;

  const resumo = r.resumo ?? {};
  return {
    resumo: {
      nDias: resumo.n_dias ?? null,
      taxaAcerto: resumo.taxa_acerto ?? null,
      acasoMedia: resumo.acaso_media ?? null,
      acasoFaixa: resumo.acaso_faixa ?? null,
      nota: resumo.nota ?? null,
    },
    dias: r.dias ?? [],
  };
}
