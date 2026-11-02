/**
 * Lista "As ações" da página inicial: filtros por tipo de sinal, busca por
 * ticker ou empresa (sem acento) e ordenação. Funções puras, sem texto de tela.
 */

export const FILTROS = ['todas', 'forte', 'atencao', 'contexto', 'minha'];

/** Quantas ações aparecem por vez antes de "ver mais". */
export const PASSO = 15;

/** Texto sem acentos e em minúsculas, para comparar buscas. */
export const semAcento = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Rótulo e classe de chip de cada tipo de sugestão. */
export const TIPO_SUGESTAO = {
  forte: { rotulo: 'Ponto forte', classe: 'chip--forte' },
  atencao: { rotulo: 'Atenção', classe: 'chip--atencao' },
  contexto: { rotulo: 'Contexto', classe: 'chip--contexto' },
};

/** Chaves de EXPLICACOES que explicam os indicadores de cada regra. */
export const TERMOS_DO_SINAL = {
  volume_incomum: ['volume_relativo'],
  queda_forte_dia: ['variacao'],
  alta_forte_dia: ['variacao'],
  desempenho_6m: ['rentabilidade'],
  pl_baixo_roe_ok: ['pl', 'roe'],
  dy_alto: ['dividend_yield'],
  divida_alta: ['dl_ebitda'],
  prejuizo_12m: ['pl'],
  queda_forte_mes: ['rentabilidade'],
  oscila_pouco: ['volatilidade', 'beta'],
  noticias_positivas: ['noticias_tom'],
  noticias_negativas: ['noticias_tom'],
  caixa_liquido: ['caixa_liquido'],
  payout_acima_lucro: ['payout'],
};

/** Quantidade de sinais do tipo na ação; campo ausente não conta como sinal. */
const sinais = (a, tipo) => Number(a?.contagem?.[tipo]);

const temSinal = (a, tipo) => sinais(a, tipo) > 0;

/** Força do ponto forte para ordenar; sem contagem fica abaixo de qualquer valor real. */
const forteDe = (a) => (Number.isFinite(sinais(a, 'forte')) ? sinais(a, 'forte') : -1);

/** Variação do dia como número, ou null quando não informada. */
const variacaoDe = (a) => (Number.isFinite(a?.variacao_dia) ? a.variacao_dia : null);

/** Variação decrescente; nulo vai para o fim. */
function compararVariacao(a, b) {
  const va = variacaoDe(a);
  const vb = variacaoDe(b);
  if (va == null && vb == null) return 0;
  if (va == null) return 1;
  if (vb == null) return -1;
  return vb - va;
}

/** Casa o filtro de tipo (ou de "minha lista") com a ação. */
function casaFiltro(a, filtro, tickersDaLista) {
  switch (filtro) {
    case 'forte':
      return temSinal(a, 'forte');
    case 'atencao':
      return temSinal(a, 'atencao');
    case 'contexto':
      return !temSinal(a, 'forte') && !temSinal(a, 'atencao') && temSinal(a, 'contexto');
    case 'minha':
      return tickersDaLista.has(String(a?.ticker ?? '').toUpperCase());
    default:
      return true;
  }
}

/**
 * Ações que passam pelo filtro e pela busca.
 * @param {object[]} acoes entradas de montarAnaliseDoDia (ticker, nome, contagem, variacao_dia)
 * @param {{filtro?: string, busca?: string, lista?: string[]}} [opcoes]
 */
export function filtrarAcoes(acoes, { filtro = 'todas', busca = '', lista = [] } = {}) {
  const tickersDaLista = new Set((lista ?? []).map((t) => String(t).toUpperCase()));
  const termo = semAcento(String(busca ?? '').trim());
  return (acoes ?? []).filter(
    (a) =>
      casaFiltro(a, filtro, tickersDaLista) &&
      (!termo || semAcento(`${a?.ticker ?? ''} ${a?.nome ?? ''}`).includes(termo)),
  );
}

/** Mais pontos fortes primeiro, depois maior variação do dia; nova lista, a entrada não muda. */
export function ordenarAcoes(acoes) {
  return [...(acoes ?? [])].sort((a, b) => forteDe(b) - forteDe(a) || compararVariacao(a, b));
}

/** Quantas ações cabem em cada filtro, com a mesma regra de filtrarAcoes. */
export function contarPorFiltro(acoes, lista = []) {
  return Object.fromEntries(
    FILTROS.map((filtro) => [filtro, filtrarAcoes(acoes, { filtro, lista }).length]),
  );
}

/** Quantidade de sinais do tipo, ou null quando a contagem não existe. */
const contagemOuNull = (a, tipo) => (Number.isFinite(sinais(a, tipo)) ? sinais(a, tipo) : null);

/** Volume relativo da ação nos cartões de sugestão, ou null quando ausente. */
function volumeRelativoDe(sugestao) {
  const v = sugestao?.resumo_acao?.volume?.relativo;
  const n = v != null && typeof v === 'object' ? (v.status === 'ok' ? v.valor : null) : v;
  return Number.isFinite(n) ? n : null;
}

/**
 * Destaque de cada setor: uma ação por setor. Vence quem tem mais regras a favor
 * (contagem.forte), depois menos atenção, depois maior volume relativo (ausente perde),
 * depois o ticker em ordem alfabética. Ações sem setor ficam de fora.
 * Devolve nova lista com `{ ...acao, sugestao }`, ordenada por setor.
 * @param {object[]} acoesPregao entradas de data.acoes_pregao
 * @param {object[]} [sugestoes] cartões de data.sugestoes (trazem resumo_acao e sinais)
 */
export function destaquePorSetor(acoesPregao, sugestoes = []) {
  const cartaoDe = new Map((sugestoes ?? []).map((s) => [s?.ticker, s]));
  const melhores = new Map();

  const vence = (a, b) => {
    const dif =
      (contagemOuNull(a, 'forte') ?? -1) - (contagemOuNull(b, 'forte') ?? -1) ||
      (contagemOuNull(b, 'atencao') ?? Infinity) - (contagemOuNull(a, 'atencao') ?? Infinity);
    if (dif) return dif > 0;
    const va = volumeRelativoDe(cartaoDe.get(a.ticker));
    const vb = volumeRelativoDe(cartaoDe.get(b.ticker));
    if (va !== vb) return va != null && (vb == null || va > vb);
    return String(a.ticker) < String(b.ticker);
  };

  for (const a of acoesPregao ?? []) {
    const setor = a?.setor_nome;
    if (!setor) continue;
    const atual = melhores.get(setor);
    if (!atual || vence(a, atual)) melhores.set(setor, a);
  }

  return [...melhores.entries()]
    .sort(([x], [y]) => x.localeCompare(y, 'pt-BR'))
    .map(([, a]) => ({ ...a, sugestao: cartaoDe.get(a.ticker) ?? null }));
}

/** Texto simples do primeiro sinal a favor da ação, ou null quando não há. */
export function motivoDoDestaque(sugestao) {
  const sinal = (sugestao?.sinais ?? []).find((s) => s?.tipo === 'forte');
  return sinal?.simples ?? null;
}
