/**
 * Regras puras dos modelos 3D da ficha (balança, moedas, cofrinho, pêndulo):
 * quantas peças desenhar, inclinação, amplitude e a frase-resposta em linguagem de leigo.
 * Sem número, nada de pilha zerada: a frase de ausência assume o lugar do desenho.
 */

import { numero } from './formato.js';
import { TEXTOS } from './textos.js';
import { valorOuNulo } from './valor.js';

const T = TEXTOS.modelos3d;

export const TIPOS_MODELO = ['balanca', 'moedas', 'cofrinho', 'pendulo'];
/** Pergunta da ficha -> modelo que a explica. */
export const MODELO_DA_PERGUNTA = { divida: 'balanca', cara: 'moedas', proventos: 'cofrinho', oscila: 'pendulo' };

export const LIMITE_MOEDAS_PL = 40;
export const LIMITE_MOEDAS_PROVENTO = 20;
export const LIMITE_BLOCOS = 9;
export const AMPLITUDE_BOLSA = 0.32;
const INCLINACAO_MAXIMA = 0.36;

const finito = (v) => typeof v === 'number' && Number.isFinite(v);
const num = (v) => (finito(v) ? v : null);
const limitar = (v, min, max) => Math.max(min, Math.min(max, v));

/** Moedas da pilha do P/L (1 moeda = 1 ano de lucro); sem número, 0 (nada é desenhado). */
export function contarMoedasPl(pl) {
  return finito(pl) && pl > 0 ? Math.min(LIMITE_MOEDAS_PL, Math.max(1, Math.round(pl))) : 0;
}

/** true se o P/L passou do tamanho da pilha e ela foi cortada. */
export const pilhaCortada = (pl) => finito(pl) && pl > LIMITE_MOEDAS_PL;

/** Moedas do cofrinho: 1 moeda = R$ 1 de provento por ano a cada R$ 100. */
export function contarMoedasProvento(dy) {
  return finito(dy) && dy > 0 ? Math.min(LIMITE_MOEDAS_PROVENTO, Math.round(dy * 100)) : 0;
}

/** Inclinação da viga em radianos: positiva quando a dívida pesa mais; sem número, 0. */
export function inclinacaoBalanca(dlEbitda) {
  return finito(dlEbitda) ? limitar(dlEbitda / 4, -1, 1) * INCLINACAO_MAXIMA : 0;
}

/** Blocos de cada prato da balança: { caixa, divida }; sem número, nenhum. */
export function blocosBalanca(dlEbitda) {
  if (!finito(dlEbitda)) return { caixa: 0, divida: 0 };
  if (dlEbitda < 0) return { caixa: limitar(Math.round(-dlEbitda * 6) + 3, 3, LIMITE_BLOCOS), divida: 0 };
  const divida = dlEbitda === 0 ? 0 : limitar(Math.round(dlEbitda * 1.5), 1, LIMITE_BLOCOS);
  return { caixa: 1, divida };
}

/** Amplitude (radianos) do pêndulo da ação: beta vezes a da bolsa, entre 0,06 e 1,0; sem beta, null. */
export function amplitudePendulo(beta) {
  return finito(beta) ? limitar(AMPLITUDE_BOLSA * beta, 0.06, 1) : null;
}

/** Altura visível do palco (unidades do mundo): cabe o objeto na altura e na largura do quadro. Proximidade > 1 aproxima. */
export function alturaVisivel({ altura, largura, proximidade = 1 }, asp) {
  // a proximidade só aproxima pela altura: a largura do objeto sempre cabe no quadro
  return Math.max(altura / (proximidade || 1), (largura || 0) / asp);
}

/** 'menos' | 'igual' | 'mais' do valor contra o setor (5% de folga); sem setor, null. */
export function compararComSetor(valor, setor) {
  if (!finito(valor) || !finito(setor)) return null;
  const folga = Math.abs(setor) * 0.05;
  if (Math.abs(valor - setor) <= folga) return 'igual';
  return valor < setor ? 'menos' : 'mais';
}

/** Os números que o modelo precisa, tirados do resumo da ação. Ausência vira null. */
export function dadosDoResumo(tipo, R) {
  if (!R) return {};
  switch (tipo) {
    case 'balanca':
      return {
        dlEbitda: valorOuNulo(R.endividamento?.dl_ebitda),
        dlEbitdaSetor: valorOuNulo(R.endividamento?.setor_dl_ebitda),
      };
    case 'moedas':
      return { pl: valorOuNulo(R.pl), plSetor: valorOuNulo(R.pl?.setor) };
    case 'cofrinho':
      return { dy: valorOuNulo(R.dividend_yield), dySetor: valorOuNulo(R.dividend_yield?.setor) };
    case 'pendulo':
      return { beta: valorOuNulo(R.beta) };
    default:
      return {};
  }
}

/** true se há número para desenhar o modelo. */
export function temDado(tipo, dados) {
  const d = dados ?? {};
  switch (tipo) {
    case 'balanca':
      return finito(d.dlEbitda);
    case 'moedas':
      return finito(d.pl) && d.pl > 0;
    case 'cofrinho':
      return finito(d.dy);
    case 'pendulo':
      return finito(d.beta);
    default:
      return false;
  }
}

const n1 = (v) => numero(v, { casas: 1 });
const n2 = (v) => numero(v, { casas: 2 });
const reais = (frac) => `R$ ${n2(frac * 100)}`;

/** { pergunta, resposta } em linguagem de leigo; ausência vira a frase de ausência, nunca zero. */
export function fraseResposta(tipo, dados) {
  const d = dados ?? {};
  const { pergunta, ausencia } = T.frases[tipo] ?? { pergunta: '', ausencia: T.semNumero };
  if (!temDado(tipo, d)) {
    return { pergunta, resposta: ausencia };
  }
  const F = T.frases[tipo];
  switch (tipo) {
    case 'balanca': {
      if (d.dlEbitda < 0) return { pergunta, resposta: F.caixaLiquido };
      const cmp = compararComSetor(d.dlEbitda, num(d.dlEbitdaSetor));
      return {
        pergunta,
        resposta: cmp ? F.comSetor(F.comparacao[cmp], n1(d.dlEbitda), n1(d.dlEbitdaSetor)) : F.semSetor(n1(d.dlEbitda)),
      };
    }
    case 'moedas': {
      const cmp = compararComSetor(d.pl, num(d.plSetor));
      return {
        pergunta,
        resposta: cmp ? F.comSetor(F.comparacao[cmp], n1(d.pl), n1(d.plSetor)) : F.semSetor(n1(d.pl)),
      };
    }
    case 'cofrinho':
      return {
        pergunta,
        resposta: finito(d.dySetor) ? F.comSetor(reais(d.dy), reais(d.dySetor)) : F.semSetor(reais(d.dy)),
      };
    default: {
      const ref = d.beta < 0.8 ? 'menos' : d.beta > 1.2 ? 'mais' : 'igual';
      return { pergunta, resposta: F.resposta(F.comparacao[ref], n2(d.beta)) };
    }
  }
}
