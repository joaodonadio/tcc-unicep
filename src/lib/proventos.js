/**
 * Proventos de uma ação para a ficha: soma por ano (pela data-com) separando
 * dividendo e JCP, e a lista de pagamentos. Valor ausente nunca vira 0.
 */

import { DATA_A_DEFINIR, tipoDoProvento } from './agenda.js';
import { dataBR, hojeISO } from './datas.js';
import { brl } from './formato.js';
import { valorOuNulo } from './valor.js';

const lerValor = (x) => (x !== null && typeof x === 'object' ? valorOuNulo(x) : (x ?? null));
const chaveDoTipo = (tipo) => (tipo === 'DIVIDENDO' ? 'dividendo' : tipo === 'JCP' ? 'jcp' : 'outros');

/**
 * [{ ano, dividendo, jcp, outros, total, total_resumo }] do ano mais antigo para o mais novo.
 * Anos: os de `porAnoResumo` (resumo.proventos_por_ano) ou, sem ele, os da lista; no máximo `anos`.
 * Ano sem nenhum registro na lista: dividendo, jcp, outros e total = null.
 */
export function proventosPorAno(proventos = [], { anos = 5, porAnoResumo = [] } = {}) {
  const somas = new Map();
  for (const p of proventos ?? []) {
    const ano = Number(String(p?.data_com ?? '').slice(0, 4));
    const v = lerValor(p?.valor_por_acao);
    if (!ano || v == null) continue;
    const s = somas.get(ano) ?? { dividendo: 0, jcp: 0, outros: 0 };
    s[chaveDoTipo(p.tipo)] += v;
    somas.set(ano, s);
  }
  const doResumo = new Map(
    (porAnoResumo ?? [])
      .filter((x) => x?.ano)
      .map((x) => [Number(x.ano), x.status === 'ok' && Number.isFinite(x.valor) ? x.valor : null]),
  );
  const listaAnos = (doResumo.size ? [...doResumo.keys()] : [...somas.keys()]).sort((a, b) => a - b).slice(-anos);
  return listaAnos.map((ano) => {
    const s = somas.get(ano);
    return {
      ano,
      dividendo: s ? s.dividendo : null,
      jcp: s ? s.jcp : null,
      outros: s ? s.outros : null,
      total: s ? s.dividendo + s.jcp + s.outros : null,
      total_resumo: doResumo.get(ano) ?? null,
    };
  });
}

/**
 * Junta o payout do resumo (fração: 0,68 = 68%) a cada linha de proventosPorAno pelo ano.
 * Ano sem payout com status ok fica com payout = null, nunca 0.
 */
export function juntarPayout(linhas = [], payoutPorAno = []) {
  const payoutDoAno = new Map(
    (payoutPorAno ?? []).filter((x) => x?.ano).map((x) => [Number(x.ano), valorOuNulo(x)]),
  );
  return (linhas ?? []).map((l) => ({ ...l, payout: payoutDoAno.get(l.ano) ?? null }));
}

/** Pagamentos do mais recente (data-com) para o mais antigo, prontos para a tela. */
export function listaPagamentos(proventos = []) {
  return [...(proventos ?? [])]
    .filter((p) => p?.data_com)
    .sort((a, b) => b.data_com.localeCompare(a.data_com) || String(a.tipo).localeCompare(String(b.tipo)))
    .map((p, i) => {
      const pagamento = lerValor(p.data_pagamento);
      const valor = lerValor(p.valor_por_acao);
      const tipo = tipoDoProvento(p.tipo);
      return {
        id: `${p.tipo}|${p.data_com}|${i}`,
        tipo: p.tipo ?? null,
        tipo_rotulo: tipo.rotulo,
        data_com_texto: dataBR(p.data_com),
        pagamento_texto:
          pagamento === DATA_A_DEFINIR ? 'a definir' : typeof pagamento === 'string' ? dataBR(pagamento) : 'não informada',
        valor,
        valor_texto: valor == null ? '—' : brl(valor, { casas: valor >= 1 ? 2 : 4 }),
      };
    });
}

/**
 * Próximo pagamento com data igual ou posterior a `hoje` (AAAA-MM-DD), o mais próximo.
 * Pagamento "a definir" (9999-12-31) fica de fora. Sem nenhum, null.
 * { tipo_rotulo, valor_texto (ou null sem valor), data_texto }
 */
export function proximoPagamento(proventos = [], hoje = hojeISO()) {
  const futuros = (proventos ?? [])
    .map((p) => ({ p, pagamento: lerValor(p?.data_pagamento) }))
    .filter(
      ({ pagamento }) =>
        typeof pagamento === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(pagamento) &&
        pagamento !== DATA_A_DEFINIR &&
        pagamento >= hoje,
    )
    .sort((a, b) => a.pagamento.localeCompare(b.pagamento) || String(a.p.tipo).localeCompare(String(b.p.tipo)));
  if (futuros.length === 0) return null;

  const { p, pagamento } = futuros[0];
  const valor = lerValor(p.valor_por_acao);
  return {
    tipo_rotulo: tipoDoProvento(p.tipo).rotulo,
    valor_texto: valor == null ? null : brl(valor, { casas: valor >= 1 ? 2 : 4 }),
    data_texto: dataBR(pagamento),
  };
}
