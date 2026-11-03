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

/** "2026-09" -> "2026-10" (mês seguinte); formato inválido -> null. */
export function mesSeguinte(mes) {
  const m = /^(\d{4})-(\d{2})$/.exec(typeof mes === 'string' ? mes : '');
  if (!m) return null;
  const ano = Number(m[1]);
  const n = Number(m[2]);
  return n === 12 ? `${ano + 1}-01` : `${m[1]}-${String(n + 1).padStart(2, '0')}`;
}

/** "2026-01" -> "2025-12". */
function mesAnterior(mes) {
  const [ano, n] = mes.split('-').map(Number);
  return n === 1 ? `${ano - 1}-12` : `${ano}-${String(n - 1).padStart(2, '0')}`;
}

/**
 * Variação de cada mês de uma série diária: último valor do mês / último valor do mês anterior − 1.
 * O primeiro mês só serve de base. `semUltimoMes` tira o mês da última data (pode estar em andamento);
 * `ateMes` ('AAAA-MM') tira os meses depois dele. Mês anterior ausente: null, nunca 0.
 * Devolve os `meses` mais recentes: {meses: ['AAAA-MM'], valores: [fração | null]}.
 */
export function variacoesMensais(serie, campo, { meses = 12, semUltimoMes = false, ateMes = null } = {}) {
  const datas = serie?.datas ?? [];
  const arr = serie?.valores?.[campo] ?? [];
  const ultimoDoMes = new Map();
  datas.forEach((d, i) => {
    const v = arr[i];
    if (typeof d === 'string' && typeof v === 'number' && Number.isFinite(v) && v !== 0) ultimoDoMes.set(d.slice(0, 7), v);
  });
  let chaves = [...ultimoDoMes.keys()].sort();
  if (semUltimoMes) chaves = chaves.slice(0, -1);
  if (ateMes) chaves = chaves.filter((c) => c <= ateMes);
  const saidaMeses = [];
  const valores = [];
  for (let i = 1; i < chaves.length; i += 1) {
    const atual = chaves[i];
    const antes = chaves[i - 1];
    saidaMeses.push(atual);
    valores.push(antes === mesAnterior(atual) ? ultimoDoMes.get(atual) / ultimoDoMes.get(antes) - 1 : null);
  }
  return { meses: saidaMeses.slice(-meses), valores: valores.slice(-meses) };
}
