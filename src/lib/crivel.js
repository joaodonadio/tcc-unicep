/**
 * Variação crível de uma ação. Uma alta acima de +100% ou queda além de −75% num só pregão
 * quase sempre é grupamento ou desdobramento que a origem não ajustou no fechamento anterior
 * (ex.: RAIZ4 foi de R$ 0,30 para R$ 27,10 em 03/11/2026). Esse número não entra em média,
 * ranking nem destaque: a ação aparece com a variação "mudou de escala".
 *
 * Variações em fração (0,05 = 5%), como no resto dos dados.
 */

export const LIMITE_ALTA_DIA = 1;
export const LIMITE_QUEDA_DIA = -0.75;

/**
 * Razão entre dois fechamentos seguidos que indica troca de escala do preço: os mesmos
 * limites da variação do dia (e da API). Queda real forte, como a de 26/10/2026
 * (circuit breaker, MGLU3 −58%), não pode virar "mudou de escala".
 */
const RAZAO_SALTO_ALTA = 1 + LIMITE_ALTA_DIA;
const RAZAO_SALTO_QUEDA = 1 + LIMITE_QUEDA_DIA;

/** true quando a variação do dia é um número possível; null/NaN não é crível nem suspeita. */
export function variacaoDiaCrivel(variacao) {
  return Number.isFinite(variacao) && variacao <= LIMITE_ALTA_DIA && variacao >= LIMITE_QUEDA_DIA;
}

/** true quando há número, mas fora do possível (provável grupamento ou desdobramento). */
export function variacaoDiaSuspeita(variacao) {
  return Number.isFinite(variacao) && !variacaoDiaCrivel(variacao);
}

/** A variação, se crível; senão null (ausente para as contas). */
export function variacaoDiaConfiavel(variacao) {
  return variacaoDiaCrivel(variacao) ? variacao : null;
}

/** Limites de um período inteiro (fração): além disso, quase sempre grupamento ou desdobramento sem ajuste. */
export const LIMITE_ALTA_PERIODO = 3;
export const LIMITE_QUEDA_PERIODO = -0.85;

/** true quando há número de período fora dos limites (provável grupamento ou desdobramento). */
export function variacaoPeriodoSuspeita(variacao) {
  return Number.isFinite(variacao) && (variacao > LIMITE_ALTA_PERIODO || variacao < LIMITE_QUEDA_PERIODO);
}

/**
 * Índice do primeiro salto de escala numa lista de fechamentos (o ponto depois do salto),
 * ou -1 se não houver. Valores ausentes são pulados.
 */
export function saltoDeEscala(fechamentos = []) {
  let anterior = null;
  for (let i = 0; i < fechamentos.length; i += 1) {
    const atual = fechamentos[i];
    if (!Number.isFinite(atual) || atual <= 0) continue;
    if (anterior != null) {
      const razao = atual / anterior;
      if (razao > RAZAO_SALTO_ALTA || razao < RAZAO_SALTO_QUEDA) return i;
    }
    anterior = atual;
  }
  return -1;
}

/**
 * Índice do último salto de escala (o ponto depois dele), ou -1. A partir daí os
 * fechamentos estão todos na escala de hoje: é o trecho que um gráfico pode mostrar.
 */
export function ultimoSalto(fechamentos = []) {
  let ultimo = -1;
  let inicio = 0;
  for (;;) {
    const i = saltoDeEscala(fechamentos.slice(inicio));
    if (i === -1) return ultimo;
    ultimo = inicio + i;
    inicio = ultimo;
  }
}

/** true quando a janela de fechamentos tem salto de escala: a variação do período não vale. */
export function janelaComSalto(fechamentos = []) {
  return saltoDeEscala(fechamentos) !== -1;
}
