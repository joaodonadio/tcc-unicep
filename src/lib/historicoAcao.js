/**
 * Histórico de um campo do resumo da ação, publicação a publicação.
 * Valor ausente vira null, nunca 0.
 */

import { brl, numero, pct, pp } from './formato.js';
import { exibirNumero } from './valor.js';

const numeroOuNulo = (v) => {
  if (v !== null && typeof v === 'object') return v.status === 'ok' && Number.isFinite(v.valor) ? v.valor : null;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

/**
 * Normaliza a resposta de /resumo_acao/{t}/historico?campo= (API: {datas, valores, status};
 * também aceita envelope com registros[0]) para { datas, valores, motivos }.
 * `motivos[i]` é o status quando o valor não é utilizável (ou null). Sem dados: null.
 */
export function normalizarHistoricoCampo(resp) {
  const fonte = Array.isArray(resp?.datas) ? resp : Array.isArray(resp?.registros?.[0]?.datas) ? resp.registros[0] : null;
  if (!fonte) return null;
  const datas = [...fonte.datas];
  const valores = datas.map((_, i) => numeroOuNulo(fonte.valores?.[i]));
  const motivos = datas.map(() => null);
  const status = Array.isArray(fonte.status) ? fonte.status : [];
  status.forEach((s, i) => {
    // lista alinhada às datas ("ok", "indisponivel"…) ou lista de {data, status}
    const j = typeof s === 'string' ? i : datas.indexOf(s?.data);
    const st = typeof s === 'string' ? s : s?.status;
    if (j >= 0 && j < datas.length && st && st !== 'ok') {
      valores[j] = null;
      motivos[j] = st;
    }
  });
  return { datas, valores, motivos };
}

/** Campos do "Como estava em", na ordem da tabela, com o jeito de calcular a diferença. */
export const CAMPOS_HISTORICO = [
  { campo: 'cotacao.fechamento', rotulo: 'Cotação', formatar: (v) => brl(v), diferenca: 'relativa' },
  { campo: 'pl', rotulo: 'P/L', formatar: (v) => numero(v, { casas: 1 }), diferenca: 'absoluta' },
  { campo: 'pvp', rotulo: 'P/VP', formatar: (v) => numero(v, { casas: 2 }), diferenca: 'absoluta' },
  { campo: 'dividend_yield', rotulo: 'Dividend yield', formatar: (v) => pct(v, { casas: 1, sinal: false }), diferenca: 'pontos' },
  { campo: 'roe', rotulo: 'ROE', formatar: (v) => pct(v, { casas: 1, sinal: false }), diferenca: 'pontos' },
];

const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/** Diferença entre dois valores: relativa ("+20,0%"), em pontos ("+1,0 p.p.") ou absoluta ("+0,35"). */
function textoDiferenca(antes, agora, tipo) {
  if (!finito(antes) || !finito(agora)) return '—';
  if (tipo === 'relativa') return antes === 0 ? '—' : pct(agora / antes - 1);
  if (tipo === 'pontos') return pp(agora - antes);
  const d = agora - antes;
  return `${d > 0 ? '+' : ''}${numero(d, { casas: 2 })}`;
}

/** Indicadores do histórico de 1 ano (série diária): P/L, P/VP e dividend yield, com o jeito de ler cada um. */
export const CAMPOS_SERIE_ANO = CAMPOS_HISTORICO.filter((c) => ['pl', 'pvp', 'dividend_yield'].includes(c.campo));

/** Mediana de uma lista de números finitos; sem nenhum, null. */
export function medianaDe(valores) {
  const ordenados = (valores ?? []).filter(finito).sort((a, b) => a - b);
  const n = ordenados.length;
  if (n === 0) return null;
  const meio = Math.floor(n / 2);
  return n % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

/**
 * Resumo de um ano de valores (null ignorado): valor atual (o último, se houver), mínima, máxima,
 * mediana do período e percentil do atual entre os valores do período (fração 0..1).
 * Sem nenhum valor finito, tudo null.
 */
export function resumoSerie(valores) {
  const lista = valores ?? [];
  const validos = lista.filter(finito);
  if (validos.length === 0) return { atual: null, minima: null, maxima: null, mediana: null, percentil: null };
  const ultimo = lista[lista.length - 1];
  const atual = finito(ultimo) ? ultimo : null;
  return {
    atual,
    minima: Math.min(...validos),
    maxima: Math.max(...validos),
    mediana: medianaDe(validos),
    percentil: atual == null ? null : validos.filter((v) => v <= atual).length / validos.length,
  };
}

/**
 * Trechos do `status` de um campo (ex.: pl: [{de, ate, status}]) que caem dentro do período das
 * `datas` e cujo status não é 'ok'. Datas "AAAA-MM-DD" comparam como texto.
 */
export function trechosSemValor(trechos, datas) {
  if (!Array.isArray(trechos) || !Array.isArray(datas) || datas.length === 0) return [];
  const primeira = datas[0];
  const ultima = datas[datas.length - 1];
  return trechos.filter((t) => t && t.status && t.status !== 'ok' && t.de <= ultima && t.ate >= primeira);
}

/** Datas guardadas (união das datas de todos os campos), da mais antiga para a mais nova. */
export function datasDisponiveis(historicos) {
  const todas = new Set();
  for (const h of Object.values(historicos ?? {})) for (const d of h?.datas ?? []) todas.add(d);
  return [...todas].sort();
}

/**
 * Linhas do "Como estava em": valor de cada campo na data escolhida e na mais recente.
 * `historicos` = { [campo]: {datas, valores} | null }.
 */
export function compararEm(historicos, data) {
  return CAMPOS_HISTORICO.map(({ campo, rotulo, formatar, diferenca }) => {
    const h = historicos?.[campo];
    const i = h ? h.datas.indexOf(data) : -1;
    const antes = i >= 0 ? h.valores[i] : null;
    const agora = h?.valores?.length ? h.valores[h.valores.length - 1] : null;
    return {
      campo,
      rotulo,
      antes_texto: exibirNumero(antes, formatar),
      agora_texto: exibirNumero(agora, formatar),
      diferenca_texto: textoDiferenca(antes, agora, diferenca),
    };
  });
}
