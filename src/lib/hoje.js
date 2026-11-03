/**
 * Apoio puro do painel "Hoje": texto do resumo e partes da barra de tom das notícias.
 * Ausência nunca vira 0: tom sem contagem completa devolve null.
 */
import { diasEntre } from './agenda.js';

/** Na tela, a primeira frase ("Resumo do pregão ...") repete o título; a leitura em voz alta mantém. */
export function semAbertura(texto) {
  return texto?.replace(/^Resumo do pregão[^.]*\.\s*/, '') ?? texto;
}

const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Fração de cada tom (positivas, neutras, negativas) sobre o total, para a barra empilhada.
 * Sem as três contagens, ou com total zero: null.
 */
export function partesDoTom(tom) {
  const positivas = tom?.positivas;
  const neutras = tom?.neutras;
  const negativas = tom?.negativas;
  if (![positivas, neutras, negativas].every(finito)) return null;
  const total = positivas + neutras + negativas;
  if (total <= 0) return null;
  return { positivas: positivas / total, neutras: neutras / total, negativas: negativas / total };
}

/**
 * Centésimos inteiros de cada tom (positivas, neutras, negativas) que somam 100, pelo maior resto:
 * um ponto da matriz por 1% das manchetes. Sem partes: null.
 */
export function centesimosDoTom(tom) {
  const partes = partesDoTom(tom);
  if (!partes) return null;
  const brutos = [partes.positivas, partes.neutras, partes.negativas].map((f) => f * 100);
  const inteiros = brutos.map(Math.floor);
  const sobra = 100 - inteiros.reduce((s, n) => s + n, 0);
  brutos
    .map((v, i) => ({ i, resto: v - inteiros[i] }))
    .sort((a, b) => b.resto - a.resto)
    .slice(0, sobra)
    .forEach(({ i }) => {
      inteiros[i] += 1;
    });
  return inteiros;
}

/** Fechamento do pregão anterior pela variação do dia: valor / (1 + variação). Sem os dois números, null. */
export function fechamentoAnterior(valor, variacao) {
  if (!finito(valor) || !finito(variacao) || 1 + variacao <= 0) return null;
  return valor / (1 + variacao);
}

/** Fração de |valor| sobre o teto (0 a 1), para barras proporcionais. Sem número ou sem teto, null. */
export function fracaoDe(valor, teto) {
  if (!finito(valor) || !finito(teto) || teto <= 0) return null;
  return Math.min(1, Math.abs(valor) / teto);
}

/** Teto da barra de volume: o maior múltiplo da lista, nunca menos de 2 (o normal, 1×, fica no máximo na metade). */
export function tetoVezes(lista) {
  const finitos = (lista ?? []).filter(finito);
  if (finitos.length === 0) return null;
  return Math.max(2, ...finitos);
}

/**
 * Linha do tempo dos próximos pagamentos: um ponto por data, na posição (0 a 1) entre hoje e o
 * último dia (no mínimo 7 dias). Datas iguais viram um ponto só. Sem itens com data futura, null.
 */
export function linhaDoTempo(itens, hoje) {
  const porData = new Map();
  for (const item of itens ?? []) {
    const dias = item?.data_pagamento ? diasEntre(hoje, item.data_pagamento) : null;
    if (dias == null || dias < 0) continue;
    const grupo = porData.get(item.data_pagamento) ?? { data: item.data_pagamento, dias, tickers: [] };
    grupo.tickers.push(item.ticker);
    porData.set(item.data_pagamento, grupo);
  }
  const pontos = [...porData.values()].sort((a, b) => a.dias - b.dias);
  if (pontos.length === 0) return null;
  const ate = Math.max(7, pontos[pontos.length - 1].dias);
  return { ate, pontos: pontos.map((p) => ({ ...p, posicao: Number((p.dias / ate).toFixed(4)) })) };
}
