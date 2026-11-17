/**
 * Formatação pt-BR usada em toda a interface.
 *
 * Regras:
 * - valor nulo, indefinido ou não numérico vira '' (nunca 0);
 * - sinal negativo é o menos tipográfico U+2212 ("−"), não o hífen;
 * - zero não recebe sinal (evita "−0,0%" quando o arredondamento dá zero).
 */

const MENOS = '−';

const finito = (v) => v != null && v !== '' && Number.isFinite(Number(v));

/** Módulo do número com casas decimais em pt-BR (sem sinal). */
const fmt = (n, casas) =>
  Math.abs(n).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

/** Sinal exibido: '−' para negativo, '+' para positivo (se pedido), '' para zero arredondado. */
const sinalDe = (n, { casas, sinal }) => {
  if (Math.round(Math.abs(n) * 10 ** casas) === 0) return '';
  if (n < 0) return MENOS;
  return sinal ? '+' : '';
};

/** 0.051 -> "+5,1%" · -0.0115 -> "−1,2%" (entrada é fração, não porcentagem). */
export function pct(frac, { casas = 1, sinal = true } = {}) {
  if (!finito(frac)) return '';
  const x = Number(frac) * 100;
  return `${sinalDe(x, { casas, sinal })}${fmt(x, casas)}%`;
}

/** 0.052 -> "+5,2 p.p." (diferença em pontos percentuais). */
export function pp(frac) {
  if (!finito(frac)) return '';
  const x = Number(frac) * 100;
  return `${sinalDe(x, { casas: 1, sinal: true })}${fmt(x, 1)} p.p.`;
}

/** 57.83 -> "R$ 57,83" · -1 -> "−R$ 1,00". */
export function brl(v, { casas = 2 } = {}) {
  if (!finito(v)) return '';
  const n = Number(v);
  return `${sinalDe(n, { casas, sinal: false })}R$ ${fmt(n, casas)}`;
}

const ESCALAS_BRL = [
  { escala: 1e9, sufixo: 'bi' },
  { escala: 1e6, sufixo: 'mi' },
  { escala: 1e3, sufixo: 'mil' },
];

/** 15397436000 -> "R$ 15,4 bi" · 980000000 -> "R$ 980,0 mi" · abaixo de mil -> brl. */
export function brlCompacto(v) {
  if (!finito(v)) return '';
  const n = Number(v);
  const grupo = ESCALAS_BRL.find(({ escala }) => Math.abs(n) >= escala);
  if (!grupo) return brl(n);
  const sinal = sinalDe(n, { casas: 1, sinal: false });
  return `${sinal}R$ ${fmt(n / grupo.escala, 1)} ${grupo.sufixo}`;
}

/** Número com casas decimais: 1234.5 -> "1.234,50". */
export function numero(v, { casas = 2 } = {}) {
  if (!finito(v)) return '';
  const n = Number(v);
  return `${sinalDe(n, { casas, sinal: false })}${fmt(n, casas)}`;
}

const COMPACTO = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

/** Número inteiro abreviado: 21700000 -> "21,7 mi" · 1200 -> "1,2 mil" · 850 -> "850". */
export function numeroCompacto(v) {
  if (!finito(v)) return '';
  const n = Number(v);
  return COMPACTO.format(n).replace(/\s/g, ' ').replace('-', MENOS);
}

/** 0.9394 -> "0,9×" (múltiplo, uma casa). */
export function vezes(x) {
  if (!finito(x)) return '';
  const n = Number(x);
  return `${sinalDe(n, { casas: 1, sinal: false })}${fmt(n, 1)}×`;
}

/** Inteiro sem escala, com separador de milhar: 204120 -> "204.120". */
const inteiro = (n) => `${sinalDe(n, { casas: 0, sinal: false })}${fmt(n, 0)}`;

/** 204120 -> "204.120 pts". */
export function pontos(v) {
  if (!finito(v)) return '';
  return `${inteiro(Number(v))} pts`;
}

const ESCALAS_QUANTIDADE = [
  { escala: 1e9, singular: 'bilhão', plural: 'bilhões' },
  { escala: 1e6, singular: 'milhão', plural: 'milhões' },
  { escala: 1e3, singular: 'mil', plural: 'mil' },
];

/** Contagem compacta: 39860200 -> "39,9 milhões" · 1200 -> "1,2 mil" · 850 -> "850". */
export function quantidade(v) {
  if (!finito(v)) return '';
  const n = Number(v);
  const grupo = ESCALAS_QUANTIDADE.find(({ escala }) => Math.abs(n) >= escala);
  if (!grupo) return inteiro(n);
  const x = fmt(n / grupo.escala, 1);
  const rotulo = x === '1,0' ? grupo.singular : grupo.plural;
  return `${sinalDe(n, { casas: 1, sinal: false })}${x} ${rotulo}`;
}

/** Contagem por extenso com separador de milhar: 39860200 -> "39.860.200". */
export function quantidadeCheia(v) {
  if (!finito(v)) return '';
  return inteiro(Number(v));
}

/** Contagem com a palavra no singular ou no plural: contar(1, 'notícia', 'notícias') -> "1 notícia". */
export function contar(n, um, varios) {
  return `${quantidadeCheia(n)} ${Number(n) === 1 ? um : varios}`;
}

/** Tons do FinBERT por extenso: "1 positiva, 6 neutras e 0 negativas". */
export function tons(positivas, neutras, negativas) {
  return `${contar(positivas, 'positiva', 'positivas')}, ${contar(neutras, 'neutra', 'neutras')} e ${contar(negativas, 'negativa', 'negativas')}`;
}
