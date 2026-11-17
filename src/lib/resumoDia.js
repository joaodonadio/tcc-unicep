/**
 * Resumo em frases do pregão: índice, amplitude do mercado, maior alta e
 * queda, câmbio, petróleo e volume de notícias.
 *
 * Só entram números ok: valor ausente não vira 0 nem some das contas.
 */

import { valorOuNulo } from './valor.js';
import { dataExtenso } from './datas.js';
import { pct, pontos, quantidadeCheia } from './formato.js';
import { variacaoDiaConfiavel, variacaoDiaSuspeita } from './crivel.js';
import { selicDoPacote } from './mercadoTela.js';
import { mesesDoPacote } from './series.js';

/** Abaixo deste módulo (em fração) a variação conta como estável. */
const LIMITE_ESTAVEL = 0.0005;

/** Variação do dólar acima deste módulo (5%) não é crível num dia: a origem já errou antes. */
const LIMITE_DOLAR_CRIVEL = 0.05;

/**
 * Manchetes únicas do pregão: a mesma manchete aparece em cada classe de ação da empresa
 * (ex.: BBDC3 e BBDC4), então conta cada título uma vez. Devolve {total, positivas, neutras,
 * negativas}, ou null sem nenhuma manchete.
 */
export function contarManchetesUnicas(noticias = []) {
  const rotuloDe = new Map();
  for (const n of noticias ?? []) {
    for (const item of n?.itens ?? []) {
      if (item?.titulo && !rotuloDe.has(item.titulo)) rotuloDe.set(item.titulo, item.rotulo);
    }
  }
  if (rotuloDe.size === 0) return null;
  const contagem = { total: rotuloDe.size, positivas: 0, neutras: 0, negativas: 0 };
  for (const rotulo of rotuloDe.values()) {
    if (rotulo === 'positivo') contagem.positivas += 1;
    else if (rotulo === 'neutro') contagem.neutras += 1;
    else if (rotulo === 'negativo') contagem.negativas += 1;
  }
  return contagem;
}

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

  // Variação suspeita (grupamento não ajustado) fica fora de todas as contas e vira "mudou de escala".
  const variacoes = resumos
    .map((r) => ({ r, v: variacaoDiaConfiavel(valorOuNulo(r.cotacao?.variacao_dia)) }))
    .filter(({ v }) => v != null);
  const emRevisao = resumos.filter((r) => variacaoDiaSuspeita(valorOuNulo(r.cotacao?.variacao_dia))).length;

  let amplitude = null;
  let maiorAlta = null;
  let maiorQueda = null;

  if (variacoes.length) {
    const estavel = (v) => Math.abs(v) < LIMITE_ESTAVEL;
    const subiram = variacoes.filter(({ v }) => !estavel(v) && v > 0).length;
    const cairam = variacoes.filter(({ v }) => !estavel(v) && v < 0).length;
    const estaveis = variacoes.filter(({ v }) => estavel(v)).length;
    const conta = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
    const partes = [
      conta(subiram, 'subiu', 'subiram'),
      conta(cairam, 'caiu', 'caíram'),
      conta(estaveis, 'ficou estável', 'ficaram estáveis'),
    ];
    if (emRevisao) partes.push(`${emRevisao} com o preço em outra escala`);
    const ultima = partes.pop();
    frases.push(`${partes.join(', ')} e ${ultima}.`);
    amplitude = { subiram, cairam, estaveis, emRevisao, total: variacoes.length };

    const nomeDe = (ticker) => {
      const empresa = acoes.find((a) => a.ticker === ticker)?.empresa;
      return empresa ? `${ticker} (${empresa})` : ticker;
    };
    const empresaDe = (ticker) => acoes.find((a) => a.ticker === ticker)?.empresa ?? null;
    const maior = variacoes.reduce((a, b) => (b.v > a.v ? b : a));
    const menor = variacoes.reduce((a, b) => (b.v < a.v ? b : a));
    if (maior.v > 0) frases.push(`Maior alta: ${nomeDe(maior.r.ticker)}, ${pct(maior.v)}.`);
    if (menor.v < 0) frases.push(`Maior queda: ${nomeDe(menor.r.ticker)}, ${pct(menor.v)}.`);
    if (maior.v > 0) maiorAlta = { ticker: maior.r.ticker, empresa: empresaDe(maior.r.ticker), variacao: maior.v };
    if (menor.v < 0) maiorQueda = { ticker: menor.r.ticker, empresa: empresaDe(menor.r.ticker), variacao: menor.v };
  }

  const dolarRecebido = valorOuNulo(mercado.USDBRL?.variacao_dia);
  const dolarSuspeito = dolarRecebido != null && Math.abs(dolarRecebido) > LIMITE_DOLAR_CRIVEL;
  const dolar = dolarSuspeito ? null : dolarRecebido;
  const brent = valorOuNulo(mercado.BRENT?.variacao_dia);
  const cambioPetroleo = [];
  if (dolar != null) cambioPetroleo.push(Math.abs(dolar) < 0.0005 ? 'dólar estável' : `dólar ${pct(dolar)}`);
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
  // conta títulos únicos, não a soma por ticker
  const unicas = contarManchetesUnicas(noticias);
  if (unicas) {
    total = unicas.total;
    positivas = unicas.positivas;
    negativas = unicas.negativas;
    algumaNoticia = true;
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
        selic: selicDoPacote(mercado),
        ipca_mensal: mesesDoPacote(mercado.ipca_mensal),
        cdi_mensal: mesesDoPacote(mercado.cdi_mensal),
      },
      seis_meses: {
        renda_fixa: valorOuNulo(mercado.indices?.CDI?.m6),
        bolsa: valorOuNulo(resumos[0]?.rentabilidade?.ibov?.m6),
      },
    },
  };
}
