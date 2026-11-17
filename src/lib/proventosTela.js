/**
 * Montagens puras da seção de proventos: sem React nem rede.
 *
 * Ausência nunca vira 0. Dividend yield nulo fica fora do ranking; sem lista
 * de pagamentos, a série de meses sai toda nula (gráfico sem dados).
 */

import { valorOuNulo } from './valor.js';
import { DATA_A_DEFINIR, diasEntre } from './agenda.js';

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Próximos `meses` meses a partir do mês de `hoje`, como "AAAA-MM-01". */
function proximosMeses(hoje, meses) {
  const ano = Number(hoje.slice(0, 4));
  const mes = Number(hoje.slice(5, 7));
  const datas = [];
  for (let i = 0; i < meses; i += 1) {
    const total = mes - 1 + i;
    const a = ano + Math.floor(total / 12);
    const m = (total % 12) + 1;
    datas.push(`${a}-${String(m).padStart(2, '0')}-01`);
  }
  return datas;
}

/**
 * Quantidade de pagamentos por mês, nos próximos `meses` meses a partir do mês de `hoje`.
 * É contagem de eventos: mês sem pagamento vale 0.
 *
 * @param {object[] | undefined} futuros lista de eventos com data_pagamento "AAAA-MM-DD"
 * @param {string} hoje "AAAA-MM-DD"
 * @returns {{ datas: string[], valores: (number | null)[] }}
 */
export function pagamentosPorMes(futuros, hoje, meses = 6) {
  if (typeof hoje !== 'string' || !DATA_ISO.test(hoje)) return { datas: [], valores: [] };

  const datas = proximosMeses(hoje, meses);
  if (!Array.isArray(futuros)) return { datas, valores: datas.map(() => null) };

  const contagem = new Map(datas.map((d) => [d.slice(0, 7), 0]));
  for (const evento of futuros) {
    const mes = typeof evento?.data_pagamento === 'string' ? evento.data_pagamento.slice(0, 7) : '';
    if (contagem.has(mes)) contagem.set(mes, contagem.get(mes) + 1);
  }
  return { datas, valores: datas.map((d) => contagem.get(d.slice(0, 7))) };
}

/**
 * As `n` ações com maior dividend yield (fração), do maior para o menor.
 * Quem não tem dividend yield informado fica de fora. `proporcao` é relativa
 * ao maior, para a barra da tabela.
 *
 * @param {object[] | undefined} resumos registros de resumo_acao ({ticker, dividend_yield})
 * @param {object[] | undefined} acoes registros de acoes ({ticker, empresa})
 * @returns {{ posicao: number, ticker: string, empresa: string | null, dy: number, proporcao: number }[]}
 */
export function maioresPagadoras(resumos, acoes, n = 10) {
  if (!Array.isArray(resumos)) return [];

  const empresaDe = new Map((Array.isArray(acoes) ? acoes : []).map((a) => [a.ticker, a.empresa ?? null]));
  const ordenadas = resumos
    .map((r) => ({ ticker: r?.ticker, dy: valorOuNulo(r?.dividend_yield) }))
    .filter((r) => Boolean(r.ticker) && r.dy !== null)
    .sort((a, b) => b.dy - a.dy || (a.ticker < b.ticker ? -1 : a.ticker > b.ticker ? 1 : 0))
    .slice(0, n);

  const maior = ordenadas.length > 0 ? ordenadas[0].dy : 0;
  return ordenadas.map((r, i) => ({
    posicao: i + 1,
    ticker: r.ticker,
    empresa: empresaDe.get(r.ticker) ?? null,
    dy: r.dy,
    proporcao: maior > 0 ? r.dy / maior : 0,
  }));
}

/**
 * Números da faixa de resumo. Cada bloco vem null quando falta o dado (nunca 0 inventado).
 * Próximo pagamento: o primeiro evento com data igual ou posterior a `hoje`.
 * Mês de pico: o mês com mais pagamentos entre os próximos; empate vale o mais cedo.
 *
 * @param {object[] | undefined} futuros eventos da agenda ({ticker, data_pagamento, valor_texto})
 * @param {object[] | undefined} aDefinir eventos sem data de pagamento
 * @param {string} hoje "AAAA-MM-DD"
 * @param {{ ticker: string, dy: number }[]} ranking saída de maioresPagadoras
 * @returns {{
 *   proximo: { ticker: string, valor: string | null, data: string, dias: number | null } | null,
 *   marcados: { total: number, aDefinir: number | null } | null,
 *   mesPico: { mes: string, qtd: number } | null,
 *   topo: { ticker: string, dy: number } | null,
 * }}
 */
export function resumoProventos(futuros, aDefinir, hoje, ranking) {
  const agenda = Array.isArray(futuros) ? futuros : null;
  const valido = typeof hoje === 'string' && DATA_ISO.test(hoje);

  const proximos = agenda && valido
    ? agenda
        .filter((ev) => typeof ev?.data_pagamento === 'string' && DATA_ISO.test(ev.data_pagamento))
        .filter((ev) => ev.data_pagamento >= hoje && ev.data_pagamento !== DATA_A_DEFINIR)
        .sort((a, b) => a.data_pagamento.localeCompare(b.data_pagamento) || String(a.ticker).localeCompare(String(b.ticker)))
    : [];

  const primeiro = proximos[0];
  const proximo = primeiro
    ? {
        ticker: primeiro.ticker,
        valor: primeiro.valor_texto || null,
        data: primeiro.data_pagamento,
        dias: diasEntre(hoje, primeiro.data_pagamento),
      }
    : null;

  const marcados = agenda
    ? { total: agenda.length, aDefinir: Array.isArray(aDefinir) ? aDefinir.length : null }
    : null;

  const contagem = new Map();
  for (const ev of proximos) {
    const mes = ev.data_pagamento.slice(0, 7);
    contagem.set(mes, (contagem.get(mes) ?? 0) + 1);
  }
  let mesPico = null;
  for (const [mes, qtd] of contagem) {
    if (!mesPico || qtd > mesPico.qtd) mesPico = { mes, qtd };
  }

  const maiorDy = Array.isArray(ranking) ? ranking[0] : undefined;
  const topo = maiorDy && typeof maiorDy.dy === 'number' ? { ticker: maiorDy.ticker, dy: maiorDy.dy } : null;

  return { proximo, marcados, mesPico, topo };
}
