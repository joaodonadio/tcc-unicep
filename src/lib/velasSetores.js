import { janelaComSalto } from './crivel.js';
import { JANELAS } from './series.js';

/**
 * Vela de cada setor num período, feita com os fechamentos diários (a API não tem abertura,
 * máxima nem mínima do pregão). Índice do setor = média simples do retorno acumulado das ações
 * desde o 1º pregão do período (base 0). Abertura 0; fechamento no último pregão; máxima e
 * mínima = maior e menor valor do índice pelos fechamentos. Valores em fração.
 */
export const PERIODOS_VELA = ['s1', 'm1', 'm6', 'a1'];
const PONTOS = { s1: JANELAS['1s'], m1: JANELAS['1m'], m6: JANELAS['6m'], a1: JANELAS['1a'] };
const valido = (v) => Number.isFinite(v) && v > 0;

/** Últimos n pregões presentes em alguma das séries, em ordem. */
export function eixoDoPeriodo(series = [], n = 0) {
  const todas = new Set();
  for (const s of series) for (const d of s?.datas ?? []) todas.add(d);
  return [...todas].sort().slice(-n);
}

/**
 * Retorno acumulado da ação em cada data do eixo; dia sem negócio repete o último fechamento.
 * Sem fechamento no 1º ou no último dia: caminho null. Salto de escala (crivel.js): revisao true.
 */
export function caminhoDaAcao(serie, eixo = []) {
  if (!serie || eixo.length < 2) return { caminho: null, revisao: false };
  const fechamentoDe = new Map();
  (serie.datas ?? []).forEach((d, i) => {
    const v = serie.valores?.fechamento?.[i];
    if (valido(v)) fechamentoDe.set(d, v);
  });
  const fechamentos = eixo.map((d) => fechamentoDe.get(d) ?? null);
  if (janelaComSalto(fechamentos)) return { caminho: null, revisao: true };
  if (fechamentos[0] == null || fechamentos.at(-1) == null) return { caminho: null, revisao: false };
  const base = fechamentos[0];
  let ultimo = base;
  const caminho = fechamentos.map((v) => {
    if (v != null) ultimo = v;
    return ultimo / base - 1;
  });
  return { caminho, revisao: false };
}

/** Vela do índice de média simples; null sem nenhum caminho. */
export function velaDoIndice(caminhos = []) {
  if (caminhos.length === 0) return null;
  const indice = caminhos[0].map((_, t) => caminhos.reduce((s, c) => s + c[t], 0) / caminhos.length);
  return { abertura: 0, fechamento: indice.at(-1), maxima: Math.max(...indice), minima: Math.min(...indice) };
}

/** Fechamento desc; vela null por último; empate por nome (pt-BR). */
const ordenar = (a, b) => {
  if (a.vela && b.vela) return b.vela.fechamento - a.vela.fechamento || a.setor.localeCompare(b.setor, 'pt-BR');
  if (a.vela) return -1;
  if (b.vela) return 1;
  return a.setor.localeCompare(b.setor, 'pt-BR');
};

/**
 * Velas de todos os setores num período de PERIODOS_VELA. `series`: Map ticker -> série diária.
 * Agrupa pelo `acao.setor` bruto (o nome curto é dado na tela). Devolve
 * [{ setor, vela, n, total, emRevisao, inicio, fim }], com vela null quando nenhuma ação tem dado.
 */
export function velasPorSetor(acoes = [], series = new Map(), periodo = 'a1') {
  const pontos = PONTOS[periodo];
  if (!pontos) return [];
  const comSerie = acoes.filter((a) => a?.ticker && series.get(a.ticker)).map((a) => series.get(a.ticker));
  const eixo = eixoDoPeriodo(comSerie, pontos);
  const grupos = new Map();
  for (const acao of acoes) {
    if (!acao?.setor) continue;
    if (!grupos.has(acao.setor)) grupos.set(acao.setor, { caminhos: [], emRevisao: [], total: 0 });
    const grupo = grupos.get(acao.setor);
    grupo.total += 1;
    const { caminho, revisao } = caminhoDaAcao(series.get(acao.ticker), eixo);
    if (revisao) grupo.emRevisao.push(acao.ticker);
    else if (caminho) grupo.caminhos.push(caminho);
  }
  return [...grupos]
    .map(([setor, g]) => ({
      setor,
      vela: velaDoIndice(g.caminhos),
      n: g.caminhos.length,
      total: g.total,
      emRevisao: g.emRevisao,
      inicio: eixo[0] ?? null,
      fim: eixo.at(-1) ?? null,
    }))
    .sort(ordenar);
}

/** Período d1: a vela sai da média do dia de setoresPorPeriodo (só abertura e fechamento). */
export function velasDoDia(setores = []) {
  return setores.map((s) => ({
    setor: s.setor,
    vela: s.media == null ? null : { abertura: 0, fechamento: s.media, maxima: Math.max(0, s.media), minima: Math.min(0, s.media) },
    n: s.n,
    total: s.total,
    emRevisao: s.emRevisao ?? [],
    inicio: null,
    fim: null,
  }));
}
