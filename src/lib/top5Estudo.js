/**
 * Top 5 para estudar hoje: puro, sem rede. Usa o Top 5 do modelo quando ele existe;
 * senão escolhe pelas regras (mais pontos a favor, menos de atenção, maior volume relativo).
 * Ausência nunca vira 0: campo sem valor fica null. Não é indicação de compra.
 */

import { cortarJanela, JANELAS } from './series.js';
import { TEXTOS, porNivel } from './textos.js';
import { valorOuNulo } from './valor.js';

export const TAMANHO_TOP = 5;

const sinaisDe = (cartao, tipo) =>
  (cartao?.sinais ?? [])
    .filter((s) => s.tipo === tipo)
    .map((s) => ({ id: s.id, titulo: s.titulo, simples: s.simples, tecnico: s.tecnico ?? null }));

const contagemDe = (cartao) => ({
  forte: cartao?.contagem?.forte ?? 0,
  atencao: cartao?.contagem?.atencao ?? 0,
  contexto: cartao?.contagem?.contexto ?? 0,
});

const volumeRelativo = (cartao) => valorOuNulo(cartao?.resumo_acao?.volume?.relativo);

/** Compara por favor (mais primeiro), atenção (menos primeiro), volume relativo (maior primeiro; ausente por último), ticker. */
function compararCartoes(a, b) {
  const ca = contagemDe(a);
  const cb = contagemDe(b);
  if (ca.forte !== cb.forte) return cb.forte - ca.forte;
  if (ca.atencao !== cb.atencao) return ca.atencao - cb.atencao;
  const va = volumeRelativo(a);
  const vb = volumeRelativo(b);
  if (va != null && vb != null && va !== vb) return vb - va;
  if (va != null && vb == null) return -1;
  if (va == null && vb != null) return 1;
  return a.ticker < b.ticker ? -1 : a.ticker > b.ticker ? 1 : 0;
}

function montarItem(posicao, ticker, cartao, chance = null) {
  const R = cartao?.resumo_acao ?? null;
  const favor = sinaisDe(cartao, 'forte');
  return {
    posicao,
    ticker,
    empresa: cartao?.nome ?? cartao?.empresa ?? null,
    setor: cartao?.setor_nome ?? cartao?.setor ?? null,
    preco: valorOuNulo(R?.cotacao?.fechamento),
    variacao: cartao?.variacao_dia ?? valorOuNulo(R?.cotacao?.variacao_dia),
    chance,
    favor,
    atencao: sinaisDe(cartao, 'atencao'),
    contexto: sinaisDe(cartao, 'contexto'),
    contagem: cartao?.contagem ?? null,
    resumo: R,
  };
}

/**
 * @param {{ experimento?: object|null, sugestoes?: object[] }} args
 * @returns {{ origem: 'modelo'|'regras', itens: object[] }}
 */
export function top5ParaEstudar({ experimento = null, sugestoes = [] } = {}) {
  const cartoes = Array.isArray(sugestoes) ? sugestoes : [];
  const porTicker = new Map(cartoes.map((c) => [c.ticker, c]));

  const doModelo = (experimento?.itens ?? []).filter((i) => i?.ticker);
  if (doModelo.some((i) => i.chance != null)) {
    const itens = doModelo
      .slice(0, TAMANHO_TOP)
      .map((i, n) => montarItem(i.posicao ?? n + 1, i.ticker, porTicker.get(i.ticker), i.chance ?? null));
    return { origem: 'modelo', itens };
  }

  const itens = [...cartoes]
    .sort(compararCartoes)
    .slice(0, TAMANHO_TOP)
    .map((c, n) => montarItem(n + 1, c.ticker, c));
  return { origem: 'regras', itens };
}

/** Números-chave do resumo da ação (frações); campo ausente fica null. */
export function numerosChave(resumo) {
  return {
    pl: valorOuNulo(resumo?.pl),
    dy: valorOuNulo(resumo?.dividend_yield),
    alta6m: valorOuNulo(resumo?.variacao_preco?.m6),
  };
}

/** Dados de cada objeto 3D, tirados do resumo e das medianas do setor; ausente fica null. */
export function dadosDosModelos(resumo) {
  return {
    balanca: {
      dlEbitda: valorOuNulo(resumo?.endividamento?.dl_ebitda),
      dlEbitdaSetor: valorOuNulo(resumo?.endividamento?.setor_dl_ebitda),
    },
    moedas: { pl: valorOuNulo(resumo?.pl), plSetor: valorOuNulo(resumo?.pl?.setor) },
    cofrinho: {
      dy: valorOuNulo(resumo?.dividend_yield),
      dySetor: valorOuNulo(resumo?.dividend_yield?.setor),
    },
    pendulo: { beta: valorOuNulo(resumo?.beta) },
  };
}

const contagemValida = (v) => (Number.isInteger(v) && v >= 0 ? v : null);

/** Fechamento dos últimos 6 meses (127 pregões) e as pontas com valor; com menos de 2 valores, null. */
export function fechamentoSeisMeses(serie) {
  if (!serie) return null;
  const valores = cortarJanela(serie, JANELAS['6m']).valores.fechamento ?? [];
  const finitos = valores.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (finitos.length < 2) return null;
  return { valores, primeiro: finitos[0], ultimo: finitos[finitos.length - 1] };
}

const ORDEM_DOS_TONS = ['forte', 'atencao', 'contexto'];
const CAMPO_DO_TOM = { forte: 'favor', atencao: 'atencao', contexto: 'contexto' };

/** Sinais do item na ordem de leitura (a favor, atenção, contexto), cada um com o `tom`. */
export function motivosDoItem(item) {
  return ORDEM_DOS_TONS.flatMap((tom) => (item?.[CAMPO_DO_TOM[tom]] ?? []).map((s) => ({ ...s, tom })));
}

/** Motivo do cartão da lista: o 1º a favor; sem nenhum, o 1º de atenção; senão null. */
export function motivoPrincipal(item) {
  if (item?.favor?.length) return { ...item.favor[0], tom: 'forte' };
  if (item?.atencao?.length) return { ...item.atencao[0], tom: 'atencao' };
  return null;
}

/** Título do sinal no nível de leitura; regra sem título próprio no mapa usa o do sinal. */
export function tituloDoSinal(sinal, nivel) {
  const titulo = TEXTOS.top5Hoje.tituloSinal[sinal?.id];
  if (titulo) return porNivel(titulo, nivel);
  return sinal?.titulo ?? sinal?.simples ?? null;
}

/**
 * Frase-resumo dos pontos: "2 pontos a favor e nenhum ponto de atenção." O contexto entra só se houver.
 * Sem os números de favor e de atenção, null: ausência não vira zero.
 */
export function resumoDosMotivos(contagem) {
  const forte = contagemValida(contagem?.forte);
  const atencao = contagemValida(contagem?.atencao);
  if (forte == null || atencao == null) return null;
  const R = TEXTOS.top5Hoje.resumoMotivos;
  const partes = [R.forte(forte), R.atencao(atencao)];
  const contexto = contagemValida(contagem?.contexto);
  if (contexto) partes.push(R.contexto(contexto));
  const ultima = partes.pop();
  const frase = `${partes.join(', ')} e ${ultima}.`;
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}
