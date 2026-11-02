/**
 * Apoio puro do painel "Hoje": texto do resumo e partes da barra de tom das notícias.
 * Ausência nunca vira 0: tom sem contagem completa devolve null.
 */

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
