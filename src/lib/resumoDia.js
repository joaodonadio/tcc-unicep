/**
 * Resumo em frases do pregão: índice, amplitude do mercado, maior alta e
 * queda, câmbio, petróleo e volume de notícias.
 *
 * Só entram números ok: valor ausente não vira 0 nem some das contas.
 */

import { valorOuNulo } from './valor.js';
import { dataExtenso } from './datas.js';
import { pct, pontos, quantidadeCheia } from './formato.js';

/** Abaixo deste módulo (em fração) a variação conta como estável. */
const LIMITE_ESTAVEL = 0.0005;

/** Variação do dólar acima deste módulo (5%) não é crível num dia: a origem já errou antes. */
const LIMITE_DOLAR_CRIVEL = 0.05;

/**
 * @param {object} args
 * @param {object} args.mercado registro de mercado_dia (IBOV, USDBRL, BRENT)
 * @param {object[]} args.resumos registros de resumo_acao
 * @param {object[]} args.noticias registros de noticias_dia
 * @param {object[]} [args.acoes] registros de acoes, só para citar o nome da empresa
 * @returns {{frases: string[], texto: string, fatos: object}}
 */
export function montarResumoDoPregao({ mercado = {}, resumos = [], noticias = [], acoes = [] } = {}) {
  const frases = [];

  const data = resumos[0]?.data_referencia ?? mercado.data_referencia;
  const extenso = dataExtenso(data);
  if (extenso) frases.push(`Resumo do pregão de ${extenso}.`);

  const pts = valorOuNulo(mercado.IBOV?.fechamento);
  const varIbov = valorOuNulo(mercado.IBOV?.variacao_dia);
  if (pts != null || varIbov != null) {
    const partes = [];
    if (pts != null) partes.push(`fechou em ${pontos(pts)}`);
    if (varIbov != null) partes.push(`${pct(varIbov)} no dia`);
    frases.push(`O Ibovespa ${partes.join(', ')}.`);
  }

  const variacoes = resumos
    .map((r) => ({ r, v: valorOuNulo(r.cotacao?.variacao_dia) }))
    .filter(({ v }) => v != null);

  let amplitude = null;
  let maiorAlta = null;
  let maiorQueda = null;

  if (variacoes.length) {
    const estavel = (v) => Math.abs(v) < LIMITE_ESTAVEL;
    const subiram = variacoes.filter(({ v }) => !estavel(v) && v > 0).length;
    const cairam = variacoes.filter(({ v }) => !estavel(v) && v < 0).length;
    const estaveis = variacoes.filter(({ v }) => estavel(v)).length;
    const conta = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
    frases.push(
      `${conta(subiram, 'subiu', 'subiram')}, ${conta(cairam, 'caiu', 'caíram')} e ${conta(estaveis, 'ficou estável', 'ficaram estáveis')}.`,
    );
    amplitude = { subiram, cairam, estaveis, total: variacoes.length };

    const nomeDe = (ticker) => {
      const empresa = acoes.find((a) => a.ticker === ticker)?.empresa;
      return empresa ? `${ticker} (${empresa})` : ticker;
    };
    const empresaDe = (ticker) => acoes.find((a) => a.ticker === ticker)?.empresa ?? null;
    const maior = variacoes.reduce((a, b) => (b.v > a.v ? b : a));
    const menor = variacoes.reduce((a, b) => (b.v < a.v ? b : a));
    frases.push(`Maior alta: ${nomeDe(maior.r.ticker)}, ${pct(maior.v)}.`);
    frases.push(`Maior queda: ${nomeDe(menor.r.ticker)}, ${pct(menor.v)}.`);
    if (maior.v > 0) maiorAlta = { ticker: maior.r.ticker, empresa: empresaDe(maior.r.ticker), variacao: maior.v };
    if (menor.v < 0) maiorQueda = { ticker: menor.r.ticker, empresa: empresaDe(menor.r.ticker), variacao: menor.v };
  }

  const dolarRecebido = valorOuNulo(mercado.USDBRL?.variacao_dia);
  const dolarSuspeito = dolarRecebido != null && Math.abs(dolarRecebido) > LIMITE_DOLAR_CRIVEL;
  const dolar = dolarSuspeito ? null : dolarRecebido;
  const brent = valorOuNulo(mercado.BRENT?.variacao_dia);
  const cambioPetroleo = [];
  if (dolar != null) cambioPetroleo.push(`dólar ${pct(dolar)}`);
  if (brent != null) cambioPetroleo.push(`Brent ${pct(brent)}`);
  if (cambioPetroleo.length) frases.push(`Câmbio e petróleo: ${cambioPetroleo.join(', ')}.`);

  let total = 0;
  let positivas = 0;
  let negativas = 0;
  let algumaNoticia = false;
  for (const n of noticias) {
    const quantidade = valorOuNulo(n.resumo?.quantidade);
    if (quantidade == null) continue;
    algumaNoticia = true;
    total += quantidade;
    const pos = valorOuNulo(n.resumo.positivas);
    const neg = valorOuNulo(n.resumo.negativas);
    if (pos != null) positivas += pos;
    if (neg != null) negativas += neg;
  }
  if (algumaNoticia) {
    frases.push(
      `Foram ${quantidadeCheia(total)} notícias: ${quantidadeCheia(positivas)} ${positivas === 1 ? 'positiva' : 'positivas'} e ${quantidadeCheia(negativas)} ${negativas === 1 ? 'negativa' : 'negativas'}.`,
    );
  }

  return {
    frases,
    texto: frases.join(' '),
    fatos: {
      ibov: { pontos: pts, variacao: varIbov },
      amplitude,
      maior_alta: maiorAlta,
      maior_queda: maiorQueda,
      dolar: { valor: valorOuNulo(mercado.USDBRL?.fechamento), variacao: dolar, suspeito: dolarSuspeito },
      brent: { valor: valorOuNulo(mercado.BRENT?.fechamento), variacao: brent },
      juros: {
        cdi_12m: valorOuNulo(mercado.indices?.CDI?.a1),
        ipca_12m: valorOuNulo(mercado.ipca_12m),
        ipca_ate: valorOuNulo(mercado.ipca_ate),
      },
      seis_meses: {
        renda_fixa: valorOuNulo(mercado.indices?.CDI?.m6),
        bolsa: valorOuNulo(resumos[0]?.rentabilidade?.ibov?.m6),
      },
    },
  };
}
