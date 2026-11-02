import { nomeSetor } from './analiseDoDia.js';
import { direcaoDe } from './mapaPregao.js';
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

/** Períodos aceitos, na ordem do seletor. */
export const PERIODOS_SETOR = ['d1', 'm1', 'm6', 'a1'];

const media = (valores) => valores.reduce((soma, v) => soma + v, 0) / valores.length;

/**
 * Variação média de cada setor num período ('d1' | 'm1' | 'm6' | 'a1').
 *
 * Média simples das ações do setor que têm valor; ausente não entra e nunca vira 0.
 * Setor sem nenhum valor fica com `media: null`. Devolve, do que mais subiu ao que mais
 * caiu (sem valor por último): { setor, media, n (ações com valor), total (ações do setor),
 * subiram, cairam, melhor, pior, acoes } com acoes = [{ ticker, empresa, variacao }] ordenadas.
 */
export function setoresPorPeriodo(resumos = [], acoes = [], periodo = 'd1') {
  const variacaoDe = new Map(
    (resumos ?? []).map((r) => [r.ticker, valorOuNulo(r.variacao_preco?.[periodo])]),
  );
  const grupos = new Map();
  for (const acao of acoes ?? []) {
    const nome = nomeSetor(acao.setor);
    if (!nome) continue;
    if (!grupos.has(nome)) grupos.set(nome, []);
    grupos.get(nome).push({
      ticker: acao.ticker,
      empresa: acao.empresa ?? null,
      variacao: variacaoDe.get(acao.ticker) ?? null,
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
