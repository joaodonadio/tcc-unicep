import { TEXTOS } from './textos.js';

/** Datas de fatos que mexem com o mercado e não vêm nos dados (confirmados pela equipe da API). */
export const EVENTOS_MERCADO = [{ data: '2026-10-26', chave: 'eleicao2026' }];

/** Eventos cuja data está em `datas` ('AAAA-MM-DD'), com a posição de cada um: [{ indice, data, chave }]. */
export function eventosNaJanela(datas) {
  const lista = Array.isArray(datas) ? datas : [];
  return EVENTOS_MERCADO.filter((e) => lista.includes(e.data)).map((e) => ({
    indice: lista.indexOf(e.data),
    data: e.data,
    chave: e.chave,
  }));
}

/** Marcas [{ indice, marca }] dos eventos ({ data, chave }) presentes em `datas`; as de fora somem. */
export function marcasDosEventos(eventos, datas) {
  const lista = Array.isArray(datas) ? datas : [];
  return (eventos ?? [])
    .map((e) => ({ indice: lista.indexOf(e.data), marca: TEXTOS.eventos[e.chave]?.marca }))
    .filter((m) => m.indice >= 0 && m.marca);
}

/** Texto para o aria-label dos eventos presentes em `datas`; sem eventos, vazio. */
export function ariaDosEventos(eventos, datas) {
  const lista = Array.isArray(datas) ? datas : [];
  return (eventos ?? [])
    .filter((e) => lista.includes(e.data))
    .map((e) => TEXTOS.eventos[e.chave]?.aria)
    .filter(Boolean)
    .join(' ');
}

/**
 * Linhas verticais tracejadas e discretas (itens de markLine) para cada marca [{ indice, marca }].
 * Gráfico pequeno vai sem rótulo (cortaria no topo); o aria-label e a nota explicam.
 */
export function itensMarcaEvento(marcas, cor, { rotulo = true } = {}) {
  return marcas.map((m) => ({
    xAxis: m.indice,
    label: { show: rotulo, position: 'end', formatter: m.marca, color: cor, fontSize: 11 },
    lineStyle: { color: cor, type: 'dashed', width: 1 },
  }));
}
