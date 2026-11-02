/**
 * Séries diárias: janelas de tempo, recorte, rebase e checagem de suficiência.
 *
 * Uma série tem a forma {datas: [...], valores: {campo: [...]}, inicio_janela}.
 * Valores ausentes são null e nunca viram 0.
 */

/** Tamanho das janelas em pontos (pregões). */
export const JANELAS = { '1m': 22, '6m': 127, '1a': 253 };

/** Últimos n pontos de datas e de cada campo de valores. */
export function cortarJanela(serie, n) {
  const cortar = (arr) => (n > 0 ? (arr ?? []).slice(-n) : []);
  const valores = {};
  for (const [campo, arr] of Object.entries(serie?.valores ?? {})) {
    valores[campo] = cortar(arr);
  }
  return { datas: cortar(serie?.datas), valores };
}

/** Variação acumulada desde o primeiro ponto: v / primeiro - 1. */
export function rebase(arr) {
  const base = arr[0];
  return arr.map((v) => (v == null || base == null ? null : v / base - 1));
}

/**
 * true se a janela não tem pontos suficientes para ser desenhada:
 * poucos pregões, primeiro valor ausente ou (janela de 1 ano) histórico
 * que começa depois do início da janela.
 */
export function serieInsuficiente(serie, campo, n) {
  if ((serie?.datas?.length ?? 0) < n) return true;
  const primeiro = cortarJanela(serie, n).valores[campo]?.[0];
  if (primeiro == null) return true;
  return n === JANELAS['1a'] && serie.datas[0] > serie.inicio_janela;
}

/** Mesma variação de rebase, escrita como índice base 100. */
export const base100 = (arr) => rebase(arr).map((v) => (v == null ? null : v * 100 + 100));

/** Valores de `outra` nas datas da base: mesma data ou null. */
export function alinharPorData(datasBase = [], datasOutra = [], valoresOutra = []) {
  const valorDe = new Map(datasOutra.map((d, i) => [d, valoresOutra[i] ?? null]));
  return datasBase.map((d) => (valorDe.has(d) ? valorDe.get(d) : null));
}

/** Acumulado desde o primeiro valor presente: v / base − 1 (fração). Faltas continuam null. */
export function acumuladoDesdeInicio(arr = []) {
  const base = arr.find((v) => v != null && Number.isFinite(v) && v !== 0);
  if (base == null) return arr.map(() => null);
  return arr.map((v) => (v == null || !Number.isFinite(v) ? null : v / base - 1));
}

/**
 * Rentabilidade da ação e do Ibovespa nos últimos n pregões da ação, as duas
 * começando em 0 (índice de retorno total; Ibovespa sem esse campo usa o fechamento).
 * Sem série da ação: null. Sem série do Ibovespa: ibov = null.
 */
export function rentabilidadeComparada(serieAcao, serieIbov, n) {
  if (!serieAcao?.datas?.length) return null;
  const { datas, valores } = cortarJanela(serieAcao, n);
  const ibovValores = serieIbov?.valores?.indice_retorno_total ?? serieIbov?.valores?.fechamento;
  return {
    datas,
    acao: acumuladoDesdeInicio(valores.indice_retorno_total ?? []),
    ibov: ibovValores ? acumuladoDesdeInicio(alinharPorData(datas, serieIbov.datas, ibovValores)) : null,
  };
}

/**
 * Acumulado de outra série (índice de retorno total, ex.: setor sem a empresa)
 * nas datas da série base, nos últimos n pregões da base, partindo de 0.
 * Datas sem valor viram null. Sem série ou sem o campo: null.
 */
export function acumuladoAlinhado(serieBase, outra, n) {
  if (!serieBase?.datas?.length) return null;
  const { datas } = cortarJanela(serieBase, n);
  const valores = outra?.valores?.indice_retorno_total;
  if (!valores) return null;
  return acumuladoDesdeInicio(alinharPorData(datas, outra.datas, valores));
}
