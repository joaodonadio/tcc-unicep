/**
 * Séries do Banco Central (SGS) usadas no bloco "O dia": meta da Selic e
 * dólar PTAX. Funções puras; quem busca a série é src/hooks/useBancoCentral.js.
 *
 * Resposta da API: [{"data":"dd/mm/aaaa","valor":"15.00"}], em ordem crescente
 * de data (o último item é o mais recente).
 *
 * Regra central: valor ausente ou inválido vira null, nunca 0.
 */

export const SERIE_SELIC = 432;
export const SERIE_DOLAR_PTAX = 1;

/** Caminho pelo proxy /bcb do Vite (vite.config.js) para as últimas `ultimos` publicações. */
export function caminhoSerie(serie, ultimos = 1) {
  return `/bcb/dados/serie/bcdata.sgs.${serie}/dados/ultimos/${ultimos}?formato=json`;
}

/** "2026-10-29" -> "29/10/2026", o formato de data que a API do SGS pede. */
function dataSgs(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * Caminho pelo proxy /bcb para o último ano de uma série (de `hoje` menos 1 ano até `hoje`).
 * Séries diárias recusam /ultimos/N acima de 20, por isso o histórico pede um intervalo de datas.
 */
export function caminhoUltimoAno(serie, hoje = new Date()) {
  const inicio = new Date(hoje);
  inicio.setFullYear(hoje.getFullYear() - 1);
  return `/bcb/dados/serie/bcdata.sgs.${serie}/dados?formato=json&dataInicial=${dataSgs(inicio)}&dataFinal=${dataSgs(hoje)}`;
}

/** "15.00" -> 15; vazio, ausente, zero ou não finito -> null. */
export function lerNumero(bruto) {
  let n = null;
  if (typeof bruto === 'number') n = bruto;
  else if (typeof bruto === 'string' && bruto.trim() !== '') n = Number(bruto.trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** "dd/mm/aaaa" -> "aaaa-mm-dd"; formato inválido -> null. */
export function dataIso(texto) {
  const casa = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(typeof texto === 'string' ? texto.trim() : '');
  return casa ? `${casa[3]}-${casa[2]}-${casa[1]}` : null;
}

/** "aaaa-mm-dd" -> "dd/mm" (para a nota de fonte); formato inválido -> null. */
export function diaMesIso(iso) {
  const casa = /^\d{4}-(\d{2})-(\d{2})$/.exec(typeof iso === 'string' ? iso : '');
  return casa ? `${casa[2]}/${casa[1]}` : null;
}

const ultimoDe = (lista) => (Array.isArray(lista) && lista.length ? lista[lista.length - 1] : null);
const penultimoDe = (lista) => (Array.isArray(lista) && lista.length > 1 ? lista[lista.length - 2] : null);

/**
 * Meta da Selic (% ao ano) do último registro, em fração: 15.00 -> 0.15.
 * @returns {{valor: number, data: string} | null}
 */
export function lerSelic(lista) {
  const ultimo = ultimoDe(lista);
  const valor = lerNumero(ultimo?.valor);
  const data = dataIso(ultimo?.data);
  if (valor == null || data == null) return null;
  return { valor: valor / 100, data };
}

/**
 * Dólar PTAX (venda, R$/US$) do último registro. A variação é o último sobre o
 * penúltimo menos 1; sem penúltimo válido, a variação fica null e o valor fica.
 * @returns {{valor: number, data: string, variacao: number | null} | null}
 */
export function lerDolarPtax(lista) {
  const ultimo = ultimoDe(lista);
  const valor = lerNumero(ultimo?.valor);
  const data = dataIso(ultimo?.data);
  if (valor == null || data == null) return null;
  const anterior = lerNumero(penultimoDe(lista)?.valor);
  const variacao = anterior != null ? valor / anterior - 1 : null;
  return { valor, data, variacao };
}

/**
 * Série histórica da SGS para o gráfico: {datas: ['AAAA-MM-DD'], valores: [número | null]}.
 * Registro com data inválida sai da lista (não há onde marcá-lo); valor inválido
 * vira null na mesma posição, para o gráfico interromper a linha.
 */
export function lerSerieHistorica(lista) {
  const datas = [];
  const valores = [];
  if (!Array.isArray(lista)) return { datas, valores };
  for (const item of lista) {
    const data = dataIso(item?.data);
    if (data == null) continue;
    datas.push(data);
    valores.push(lerNumero(item?.valor));
  }
  return { datas, valores };
}
