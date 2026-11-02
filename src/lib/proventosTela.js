/**
 * Montagens puras da seção de proventos: sem React nem rede.
 *
 * Ausência nunca vira 0. Dividend yield nulo fica fora do ranking; sem lista
 * de pagamentos, a série de meses sai toda nula (gráfico sem dados).
 */

import { valorOuNulo } from './valor.js';

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
