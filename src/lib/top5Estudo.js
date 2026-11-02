/**
 * Top 5 para estudar hoje: puro, sem rede. Usa o Top 5 do modelo quando ele existe;
 * senão escolhe pelas regras (mais pontos a favor, menos de atenção, maior volume relativo).
 * Ausência nunca vira 0: campo sem valor fica null. Não é indicação de compra.
 */

import { valorOuNulo } from './valor.js';

export const TAMANHO_TOP = 5;

const sinaisDe = (cartao, tipo) =>
  (cartao?.sinais ?? [])
    .filter((s) => s.tipo === tipo)
    .map((s) => ({ id: s.id, titulo: s.titulo, simples: s.simples, tecnico: s.tecnico ?? null }));

const contagemDe = (cartao) => ({
  forte: cartao?.contagem?.forte ?? 0,
  atencao: cartao?.contagem?.atencao ?? 0,
  contexto: cartao?.contagem?.contexto ?? 0,
});

const volumeRelativo = (cartao) => valorOuNulo(cartao?.resumo_acao?.volume?.relativo);

/** Compara por favor (mais primeiro), atenção (menos primeiro), volume relativo (maior primeiro; ausente por último), ticker. */
function compararCartoes(a, b) {
  const ca = contagemDe(a);
  const cb = contagemDe(b);
  if (ca.forte !== cb.forte) return cb.forte - ca.forte;
  if (ca.atencao !== cb.atencao) return ca.atencao - cb.atencao;
  const va = volumeRelativo(a);
  const vb = volumeRelativo(b);
  if (va != null && vb != null && va !== vb) return vb - va;
  if (va != null && vb == null) return -1;
  if (va == null && vb != null) return 1;
  return a.ticker < b.ticker ? -1 : a.ticker > b.ticker ? 1 : 0;
}

function montarItem(posicao, ticker, cartao, chance = null) {
  const R = cartao?.resumo_acao ?? null;
  const favor = sinaisDe(cartao, 'forte');
  return {
    posicao,
    ticker,
    empresa: cartao?.nome ?? cartao?.empresa ?? null,
    setor: cartao?.setor_nome ?? cartao?.setor ?? null,
    preco: valorOuNulo(R?.cotacao?.fechamento),
    variacao: cartao?.variacao_dia ?? valorOuNulo(R?.cotacao?.variacao_dia),
    motivoCurto: favor[0]?.titulo ?? cartao?.titulo ?? null,
    chance,
    favor,
    atencao: sinaisDe(cartao, 'atencao'),
    contagem: cartao?.contagem ?? null,
    resumo: R,
  };
}

/**
 * @param {{ experimento?: object|null, sugestoes?: object[] }} args
 * @returns {{ origem: 'modelo'|'regras', itens: object[] }}
 */
export function top5ParaEstudar({ experimento = null, sugestoes = [] } = {}) {
  const cartoes = Array.isArray(sugestoes) ? sugestoes : [];
  const porTicker = new Map(cartoes.map((c) => [c.ticker, c]));

  const doModelo = (experimento?.itens ?? []).filter((i) => i?.ticker);
  if (doModelo.some((i) => i.chance != null)) {
    const itens = doModelo
      .slice(0, TAMANHO_TOP)
      .map((i, n) => montarItem(i.posicao ?? n + 1, i.ticker, porTicker.get(i.ticker), i.chance ?? null));
    return { origem: 'modelo', itens };
  }

  const itens = [...cartoes]
    .sort(compararCartoes)
    .slice(0, TAMANHO_TOP)
    .map((c, n) => montarItem(n + 1, c.ticker, c));
  return { origem: 'regras', itens };
}

/** Números-chave do resumo da ação (frações); campo ausente fica null. */
export function numerosChave(resumo) {
  return {
    pl: valorOuNulo(resumo?.pl),
    dy: valorOuNulo(resumo?.dividend_yield),
    alta6m: valorOuNulo(resumo?.variacao_preco?.m6),
  };
}

/** Dados de cada objeto 3D, tirados do resumo e das medianas do setor; ausente fica null. */
export function dadosDosModelos(resumo) {
  return {
    balanca: {
      dlEbitda: valorOuNulo(resumo?.endividamento?.dl_ebitda),
      dlEbitdaSetor: valorOuNulo(resumo?.endividamento?.setor_dl_ebitda),
    },
    moedas: { pl: valorOuNulo(resumo?.pl), plSetor: valorOuNulo(resumo?.pl?.setor) },
    cofrinho: {
      dy: valorOuNulo(resumo?.dividend_yield),
      dySetor: valorOuNulo(resumo?.dividend_yield?.setor),
    },
    pendulo: { beta: valorOuNulo(resumo?.beta) },
  };
}
