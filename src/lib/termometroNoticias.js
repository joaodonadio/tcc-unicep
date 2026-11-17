/** Funções puras da tela Notícias: cor dos cartões e proporção dos tons. Ausência fica null, nunca 0. */

const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/** Cor do termômetro (data-brilho) pelo sentimento geral. Sem sentimento conhecido, o tom neutro. */
const BRILHO_POR_SENTIMENTO = {
  otimista: 'alta',
  otimista_moderado: 'alta',
  neutro: 'aco',
  pessimista_moderado: 'queda',
  pessimista: 'queda',
};

export function brilhoDoSentimento(sentimento) {
  return BRILHO_POR_SENTIMENTO[sentimento] ?? 'aco';
}

/** Cor de cada cartão de tom de manchete (positivo, neutro, negativo). */
export const BRILHO_POR_TOM = { positivo: 'alta', neutro: 'aco', negativo: 'queda' };

/** Parte do total em porcentagem inteira. Sem total, ou com valor ausente, devolve null. */
export function porcentagemDoTotal(parte, total) {
  if (!finito(parte) || !finito(total) || total <= 0) return null;
  return Math.round((parte / total) * 100);
}

/**
 * Tom que aparece mais vezes entre positivas, neutras e negativas.
 * Empate entre os maiores devolve 'empate'; qualquer contagem ausente, ou todas zeradas, devolve null.
 * @param {{positivas?: number|null, neutras?: number|null, negativas?: number|null}} contagens
 * @returns {'positivas'|'neutras'|'negativas'|'empate'|null}
 */
export function tomPredominante({ positivas, neutras, negativas } = {}) {
  const contagens = { positivas, neutras, negativas };
  if (!Object.values(contagens).every(finito)) return null;
  const maior = Math.max(...Object.values(contagens));
  if (maior <= 0) return null;
  const topos = Object.keys(contagens).filter((chave) => contagens[chave] === maior);
  return topos.length === 1 ? topos[0] : 'empate';
}
