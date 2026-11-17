import { nomeSetor } from './analiseDoDia.js';
import { direcaoDe } from './mapaPregao.js';
import { janelaComSalto, variacaoDiaConfiavel, variacaoDiaSuspeita, variacaoPeriodoSuspeita } from './crivel.js';
import { cortarJanela, JANELAS } from './series.js';
import { valorOuNulo } from './valor.js';

/**
 * Cor de linha de cada setor, como as linhas do metrô.
 * As cores moram em tokens.css; aqui só se escolhe o token pelo nome do setor.
 */

const TOKEN_DO_SETOR = {
  'Financeiro': '--linha-financeiro',
  'Consumo Cíclico': '--linha-consumo-ciclico',
  'Utilidade Pública': '--linha-utilidade-publica',
  'Consumo não Cíclico': '--linha-consumo-nao-ciclico',
  'Materiais Básicos': '--linha-materiais-basicos',
  'Petróleo, Gás e Biocombustíveis': '--linha-petroleo',
  'Bens Industriais': '--linha-bens-industriais',
  'Saúde': '--linha-saude',
  'Tecnologia da Informação': '--linha-tecnologia',
  'Comunicações': '--linha-comunicacoes',
};

/** Nomes curtos que nomeSetor (lib/analiseDoDia.js) entrega à tela. */
const TOKEN_DO_NOME_CURTO = {
  'Consumo cíclico': '--linha-consumo-ciclico',
  'Utilidade pública': '--linha-utilidade-publica',
  'Consumo não cíclico': '--linha-consumo-nao-ciclico',
  'Materiais básicos': '--linha-materiais-basicos',
  'Petróleo e gás': '--linha-petroleo',
  'Bens industriais': '--linha-bens-industriais',
  'Tecnologia': '--linha-tecnologia',
};

/** Valor CSS da cor do setor (nome bruto ou curto), para usar em style (ex.: `{ '--cor-linha': corDoSetor(s) }`). */
export function corDoSetor(setor) {
  return `var(${TOKEN_DO_SETOR[setor] ?? TOKEN_DO_NOME_CURTO[setor] ?? '--linha-outros'})`;
}

/* ---------- Setores por período ---------- */

/**
 * Períodos aceitos, na ordem do seletor. 's1' (1 semana) vem pronto do resumo quando a API publica
 * variacao_preco.s1; sem ele, sai da série diária dos últimos pregões. Os demais vêm do resumo (variacao_preco).
 */
export const PERIODOS_SETOR = ['d1', 's1', 'm1', 'm6', 'a1'];

/** true quando todas as ações do resumo já trazem variacao_preco.s1: a tela não precisa buscar as séries da semana. */
export function semanaNoResumo(resumos = []) {
  return (resumos?.length ?? 0) > 0 && resumos.every((r) => r?.variacao_preco?.s1 !== undefined);
}

const media = (valores) => valores.reduce((soma, v) => soma + v, 0) / valores.length;

/**
 * Variação de uma ação no período, e se ela é suspeita (fica fora das contas, com o selo "mudou de escala").
 * Hoje: variação do dia crível (crivel.js). 1 semana: campo pronto variacao_preco.s1 quando a API
 * traz; sem ele, fechamento do último ao primeiro dos 6 pontos (5 pregões) de JANELAS['1s'] (janela com salto
 * de escala não vale). Demais períodos: campo pronto do resumo.
 * Devolve { valor, revisao }; valor null quando não vale, nunca 0.
 */
export function variacaoDaAcao(resumo, periodo, serie) {
  if (periodo === 's1' && resumo?.variacao_preco?.s1 === undefined) {
    const fechamentos = cortarJanela(serie, JANELAS['1s']).valores?.fechamento ?? [];
    if (janelaComSalto(fechamentos)) return { valor: null, revisao: true };
    const validos = fechamentos.filter((v) => Number.isFinite(v) && v > 0);
    if (validos.length < 2) return { valor: null, revisao: false };
    return { valor: validos.at(-1) / validos[0] - 1, revisao: false };
  }
  const bruta = valorOuNulo(resumo?.variacao_preco?.[periodo]);
  if (periodo === 'd1') return { valor: variacaoDiaConfiavel(bruta), revisao: variacaoDiaSuspeita(bruta) };
  // Sem série, o campo pronto não mostra o salto. Se o dia já é suspeito, o salto está dentro de
  // qualquer janela que termina hoje; fora disso, um período além dos limites só vem de preço sem ajuste.
  const diaSuspeito = variacaoDiaSuspeita(valorOuNulo(resumo?.variacao_preco?.d1));
  if (diaSuspeito || variacaoPeriodoSuspeita(bruta)) return { valor: null, revisao: true };
  return { valor: bruta, revisao: false };
}

/**
 * Variação média de cada setor num período (PERIODOS_SETOR). `series` é um Map ticker -> série
 * diária, usado só em 's1'.
 *
 * Média simples das ações do setor que têm valor; ausente não entra e nunca vira 0.
 * Ação suspeita não entra na média nem na contagem, e aparece em `emRevisao` (tickers).
 * Setor sem nenhum valor fica com `media: null`. Devolve, do que mais subiu ao que mais
 * caiu (sem valor por último): { setor, media, n (ações com valor), total (ações do setor),
 * subiram, cairam, melhor, pior, emRevisao, acoes } com acoes = [{ ticker, empresa, variacao, revisao }] ordenadas.
 */
export function setoresPorPeriodo(resumos = [], acoes = [], periodo = 'd1', series = new Map()) {
  const resumoDe = new Map((resumos ?? []).map((r) => [r.ticker, r]));
  const grupos = new Map();
  for (const acao of acoes ?? []) {
    const nome = nomeSetor(acao.setor);
    if (!nome) continue;
    if (!grupos.has(nome)) grupos.set(nome, []);
    const { valor, revisao } = variacaoDaAcao(resumoDe.get(acao.ticker), periodo, series.get(acao.ticker));
    grupos.get(nome).push({
      ticker: acao.ticker,
      empresa: acao.empresa ?? null,
      variacao: valor,
      revisao,
    });
  }

  const lista = [...grupos].map(([setor, membros]) => {
    const comValor = membros
      .filter((m) => m.variacao != null)
      .sort((a, b) => b.variacao - a.variacao);
    const semValor = membros.filter((m) => m.variacao == null);
    return {
      setor,
      media: comValor.length ? media(comValor.map((m) => m.variacao)) : null,
      n: comValor.length,
      total: membros.length,
      subiram: comValor.filter((m) => direcaoDe(m.variacao) === 'up').length,
      cairam: comValor.filter((m) => direcaoDe(m.variacao) === 'down').length,
      melhor: comValor[0] ?? null,
      pior: comValor.at(-1) ?? null,
      emRevisao: membros.filter((m) => m.revisao).map((m) => m.ticker),
      acoes: [...comValor, ...semValor],
    };
  });

  return lista.sort((a, b) => {
    if (a.media == null && b.media == null) return a.setor.localeCompare(b.setor, 'pt-BR');
    if (a.media == null) return 1;
    if (b.media == null) return -1;
    return b.media - a.media;
  });
}

/** Maior |média| entre os setores com valor (0 se nenhum). */
export function maiorMediaAbsoluta(setores = []) {
  return setores.reduce((m, s) => (s.media == null ? m : Math.max(m, Math.abs(s.media))), 0);
}

/**
 * Divide n cartões em fileiras completas, de até `maximo` cada, sem buraco: o mínimo de fileiras e,
 * dentro delas, tamanhos iguais (a sobra fica nas últimas). 8 -> [4, 4]; 10 -> [3, 3, 4]; 5 -> [2, 3].
 */
export function distribuirFileiras(n, maximo = 4) {
  const total = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  const teto = Number.isFinite(maximo) ? Math.max(1, Math.floor(maximo)) : 4;
  if (total === 0) return [];
  const linhas = Math.ceil(total / teto);
  const base = Math.floor(total / linhas);
  const sobra = total - base * linhas;
  return Array.from({ length: linhas }, (_, i) => (i >= linhas - sobra ? base + 1 : base));
}

/** Sinal para o CSS: 'alta', 'queda' ou 'estavel' (sem valor ou abaixo do limiar de estabilidade de mapaPregao). */
export function sinalDaVariacao(v) {
  const direcao = direcaoDe(v);
  if (direcao === 'up') return 'alta';
  if (direcao === 'down') return 'queda';
  return 'estavel';
}

/** Frase do setor no dicionário de descrições; aceita o nome bruto da B3 ou o nome curto da tela. */
export function descricaoDoSetor(nome, descricoes = {}) {
  const bruto = Object.keys(descricoes).find((k) => k === nome || nomeSetor(k) === nome);
  return bruto ? descricoes[bruto] : null;
}

/** Id da âncora do cartão de um setor (ex.: 'setor-consumo-ciclico'), para os links da lista. */
export function ancoraDoSetor(nome) {
  const slug = String(nome ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `setor-${slug}`;
}

/** Velas com o nome curto do setor (nomeSetor); setor sem nome sai. */
export function nomearVelas(lista = []) {
  return (lista ?? []).map((v) => ({ ...v, setor: nomeSetor(v.setor) })).filter((v) => v.setor);
}
