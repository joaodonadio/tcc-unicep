/**
 * Agenda de pagamentos de proventos: função pura, sem React nem rede.
 *
 * Datas são texto "AAAA-MM-DD" (comparadas como texto). Valor ausente vira
 * null e nunca 0. "9999-12-31" é a data "a definir" usada pela fonte.
 */

import { brl } from './formato.js';
import { dataBR, dataExtenso, diaMes, mesAno, mesExtenso } from './datas.js';
import { valorOuNulo } from './valor.js';

export const DATA_A_DEFINIR = '9999-12-31';

/** "2026-10-22" -> { dia: "22", mes: "out" }; vazio se a data não existir. */
export function partesDaData(iso) {
  if (!iso) return { dia: '', mes: '' };
  return { dia: iso.slice(8, 10), mes: mesAno(iso.slice(0, 7)).split('/')[0] };
}
export const MAX_PROXIMOS = 6;

/** Rótulo e explicação curta do tipo de provento (DIVIDENDO, JCP, …). */
export function tipoDoProvento(tipo) {
  if (!tipo) return { rotulo: 'Provento', explica: null };
  if (tipo === 'DIVIDENDO') return { rotulo: 'Dividendo', explica: null };
  if (tipo === 'JCP') return { rotulo: 'JCP', explica: 'juros sobre capital próprio' };
  const texto = String(tipo).replace(/_/g, ' ').toLowerCase();
  return { rotulo: texto.charAt(0).toUpperCase() + texto.slice(1), explica: null };
}

/** Campo que pode vir como {valor, status} (pacote) ou já como valor puro. */
const lerValor = (x) => (x !== null && typeof x === 'object' ? valorOuNulo(x) : (x ?? null));

const comparar = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function montarItem(p, empresaDe, pagamento, aDefinir) {
  const dataCom = p.data_com ?? null;
  const valor = lerValor(p.valor_por_acao);
  const tipo = tipoDoProvento(p.tipo);
  const data = aDefinir ? null : pagamento;
  return {
    id: [p.ticker, p.tipo, dataCom, pagamento, valor].join('|'),
    ticker: p.ticker,
    empresa: empresaDe.get(p.ticker) ?? p.ticker,
    tipo: p.tipo ?? null,
    tipo_rotulo: tipo.rotulo,
    tipo_explica: tipo.explica,
    data_pagamento: data,
    dia: data ? diaMes(data) : '',
    data_extenso: data ? dataExtenso(data) : '',
    data_com: dataCom,
    data_com_texto: dataBR(dataCom),
    valor,
    valor_texto: valor == null ? '' : brl(valor, { casas: valor >= 1 ? 2 : 4 }),
  };
}

/**
 * Próximos pagamentos a partir de `hoje` ("AAAA-MM-DD"), mais os pagamentos
 * "a definir" com data-com de até um ano atrás.
 *
 * @returns {{ proximos: object[], futuros: object[], a_definir: object[], total_futuros: number }}
 */
export function montarAgenda({ proventos = [], acoes = [], hoje, max = MAX_PROXIMOS }) {
  if (!hoje) return { proximos: [], futuros: [], a_definir: [], total_futuros: 0 };

  const empresaDe = new Map(acoes.map((a) => [a.ticker, a.empresa]));
  const corte = `${Number(hoje.slice(0, 4)) - 1}${hoje.slice(4)}`;
  const vistos = new Set();
  const futuros = [];
  const aDefinirLista = [];

  for (const p of proventos) {
    const pagamento = lerValor(p?.data_pagamento);
    if (typeof pagamento !== 'string') continue;

    const aDefinir = pagamento === DATA_A_DEFINIR;
    const dataCom = p.data_com ?? '';
    // Antes de comparar com hoje: '9999-12-31' é maior que qualquer data real.
    const incluir = aDefinir ? dataCom >= corte : pagamento >= hoje;
    if (!incluir) continue;

    const item = montarItem(p, empresaDe, pagamento, aDefinir);
    if (vistos.has(item.id)) continue;
    vistos.add(item.id);
    (aDefinir ? aDefinirLista : futuros).push(item);
  }

  futuros.sort((a, b) => comparar(a.data_pagamento, b.data_pagamento) || comparar(a.ticker, b.ticker));
  aDefinirLista.sort((a, b) => comparar(b.data_com ?? '', a.data_com ?? ''));

  return {
    proximos: futuros.slice(0, max),
    futuros,
    a_definir: aDefinirLista,
    total_futuros: futuros.length,
  };
}

/**
 * Agrupa eventos (já ordenados) por mês de pagamento, na ordem em que o mês aparece.
 * Data inválida ou ausente vai para o grupo '' (rótulo null), sem quebrar.
 *
 * @returns {{ chave: string, rotulo: string | null, itens: object[] }[]}
 */
export function mesesDosPagamentos(eventos) {
  const grupos = new Map();
  for (const ev of Array.isArray(eventos) ? eventos : []) {
    const m = /^(\d{4}-\d{2})-\d{2}/.exec(String(ev?.data_pagamento ?? ''));
    const chave = m ? m[1] : '';
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(ev);
  }
  return [...grupos].map(([chave, itens]) => ({ chave, rotulo: mesExtenso(chave) || null, itens }));
}

/** Dias corridos de `de` até `ate` ("AAAA-MM-DD"), sem fuso; null se alguma data for inválida. */
export function diasEntre(de, ate) {
  const ler = (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''));
    return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  };
  const a = ler(de);
  const b = ler(ate);
  return a === null || b === null ? null : Math.round((b - a) / 86_400_000);
}

export const JANELA_ALERTA_DIAS = 7;

const porDataCom = (a, b) => comparar(a.data_com, b.data_com) || comparar(a.ticker, b.ticker);
const porPagamento = (a, b) => comparar(a.data_pagamento ?? DATA_A_DEFINIR, b.data_pagamento ?? DATA_A_DEFINIR) || comparar(a.ticker, b.ticker);

/**
 * Alertas de proventos a partir dos eventos da agenda (montarAgenda: futuros + a_definir).
 * Cada alerta traz `itens` com `dias` (dias corridos até a data do alerta). Alerta sem itens não sai.
 *
 *  - data_com: data-com hoje ou nos próximos 7 dias;
 *  - pagamento: pagamento hoje ou nos próximos 7 dias.
 *
 * @returns {{ chave: 'data_com' | 'pagamento', itens: object[] }[]}
 */
export function alertasDeProventos(eventos, hoje) {
  if (!Array.isArray(eventos) || !hoje) return [];
  const dentro = (d) => d !== null && d >= 0 && d <= JANELA_ALERTA_DIAS;

  const dataCom = [];
  const pagamento = [];
  for (const ev of eventos) {
    if (!ev?.ticker) continue;
    const diasCom = diasEntre(hoje, ev.data_com);
    if (dentro(diasCom)) dataCom.push({ ...ev, dias: diasCom });
    const diasPag = ev.data_pagamento ? diasEntre(hoje, ev.data_pagamento) : null;
    if (dentro(diasPag)) pagamento.push({ ...ev, dias: diasPag });
  }

  const alertas = [
    { chave: 'data_com', itens: dataCom.sort(porDataCom) },
    { chave: 'pagamento', itens: pagamento.sort(porPagamento) },
  ];
  return alertas.filter((a) => a.itens.length > 0);
}

/** Dia "AAAA-MM-DD" de um mês "AAAA-MM". */
const diaDoMes = (mes, d) => `${mes}-${String(d).padStart(2, '0')}`;

/** Soma `n` meses (pode ser negativo) a "AAAA-MM". */
export function somarMeses(mes, n) {
  const ano = Number(mes.slice(0, 4));
  const m = Number(mes.slice(5, 7)) - 1 + n;
  const a = ano + Math.floor(m / 12);
  return `${a}-${String(((m % 12) + 12) % 12 + 1).padStart(2, '0')}`;
}

/**
 * Grade do mês (domingo a sábado): sempre 6 semanas de 7 células (42), fora do mês é null.
 * Cada célula: { iso, dia, qtd, com }: `qtd` = pagamentos no dia, `com` = datas-com no dia (0 sem evento).
 *
 * @param {object[]} eventos itens com data_pagamento e/ou data_com
 * @param {string} mes "AAAA-MM"
 */
export function calendarioDoMes(eventos, mes) {
  if (!/^\d{4}-\d{2}$/.test(String(mes ?? ''))) return [];
  const [a, m] = mes.split('-').map(Number);
  const total = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const primeiro = new Date(Date.UTC(a, m - 1, 1)).getUTCDay();
  const pagos = new Map();
  const coms = new Map();
  for (const ev of Array.isArray(eventos) ? eventos : []) {
    const pag = ev?.data_pagamento;
    if (typeof pag === 'string' && pag.startsWith(mes)) pagos.set(pag, (pagos.get(pag) ?? 0) + 1);
    const com = ev?.data_com;
    if (typeof com === 'string' && com.startsWith(mes)) coms.set(com, (coms.get(com) ?? 0) + 1);
  }
  const celulas = Array(primeiro).fill(null);
  for (let d = 1; d <= total; d += 1) {
    const iso = diaDoMes(mes, d);
    celulas.push({ iso, dia: d, qtd: pagos.get(iso) ?? 0, com: coms.get(iso) ?? 0 });
  }
  while (celulas.length < 42) celulas.push(null);
  const semanas = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));
  return semanas;
}
