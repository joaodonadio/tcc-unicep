/**
 * Estatística descritiva pura, para o gráfico de caixas (boxplot).
 * Quartis por interpolação linear (igual ao QUARTIL.INC do Excel e ao numpy padrão).
 */

const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/** Valor no percentual `p` (0 a 1) de uma lista já ordenada e não vazia. */
function quantil(ordenados, p) {
  const posicao = (ordenados.length - 1) * p;
  const baixo = Math.floor(posicao);
  const alto = Math.ceil(posicao);
  return ordenados[baixo] + (ordenados[alto] - ordenados[baixo]) * (posicao - baixo);
}

/**
 * Cinco números de uma distribuição, com cercas de Tukey (1,5 x IQR).
 * Ignora valores que não são números finitos. Com menos de 3 valores devolve null.
 * `min` e `max` são o menor e o maior valor dentro das cercas; `atipicos` são os de fora.
 */
export function quartis(valores) {
  const ordenados = (valores ?? []).filter(finito).sort((a, b) => a - b);
  if (ordenados.length < 3) return null;

  const q1 = quantil(ordenados, 0.25);
  const mediana = quantil(ordenados, 0.5);
  const q3 = quantil(ordenados, 0.75);
  const amplitude = q3 - q1;
  const cercaInferior = q1 - 1.5 * amplitude;
  const cercaSuperior = q3 + 1.5 * amplitude;

  const dentro = ordenados.filter((v) => v >= cercaInferior && v <= cercaSuperior);
  const atipicos = ordenados.filter((v) => v < cercaInferior || v > cercaSuperior);

  return {
    min: dentro[0],
    q1,
    mediana,
    q3,
    max: dentro[dentro.length - 1],
    n: ordenados.length,
    atipicos,
  };
}
