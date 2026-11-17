/**
 * Perguntas da ficha da ação: em vez de abas, cada pergunta reúne os
 * indicadores que a responde. Funções puras; os textos ficam nas telas.
 *
 * As chaves `simples` e `tecnico` são as `chave` de montarIndicadoresFicha
 * (fichaIndicadores.js); `extraTecnico` nomeia uma seção extra da ficha.
 */

/** Ordem das perguntas na ficha. */
export const PERGUNTAS = [
  { id: 'regras' },
  { id: 'divida', simples: ['dl_ebitda', 'dl_pl'], tecnico: ['ebitda', 'roe'], extraTecnico: 'balancos' },
  { id: 'cara', simples: ['pl', 'pvp', 'roe'], tecnico: ['margem_bruta', 'margem_liquida', 'ebitda', 'dividend_yield'], extraTecnico: 'historico' },
  { id: 'proventos', simples: ['dividend_yield', 'payout'], tecnico: ['pl', 'roe'] },
  { id: 'oscila', simples: ['volatilidade', 'beta'], tecnico: ['volume_relativo', 'dividend_yield'] },
  { id: 'preco', extraTecnico: 'retornos' },
  { id: 'noticias' },
];

/**
 * Mancha de cor de cada pergunta da ficha, pelo assunto (cores em componentes.css).
 * "oscila" fica sem mancha: é comparação de faixas, não tema.
 */
export const BRILHO_DA_PERGUNTA = {
  regras: 'acento',
  divida: 'aco',
  cara: 'dado',
  proventos: 'alta',
  preco: 'dado',
  noticias: 'lavanda',
};

/** Nomes antigos das abas, para links que ainda usam ?aba=. */
const ABAS_ANTIGAS = {
  visao: 'regras',
  graficos: 'preco',
  balancos: 'divida',
  proventos: 'proventos',
  historico: 'cara',
};

const IDS = new Set(PERGUNTAS.map((p) => p.id));

/** Pergunta da URL: ?pergunta= tem prioridade; sem ele, converte ?aba= antigo; o resto cai em 'regras'. */
export function perguntaDaUrl(searchParams) {
  const pergunta = searchParams?.get('pergunta');
  if (pergunta != null) return IDS.has(pergunta) ? pergunta : 'regras';
  const aba = searchParams?.get('aba');
  const convertida = aba == null ? undefined : ABAS_ANTIGAS[aba];
  return convertida ?? 'regras';
}

/** Chaves de indicadores da pergunta; no nível técnico soma as chaves `tecnico`. */
export function chavesDaPergunta(id, nivel) {
  const pergunta = PERGUNTAS.find((p) => p.id === id);
  if (!pergunta) return [];
  return [...(pergunta.simples ?? []), ...(nivel === 'tecnico' ? (pergunta.tecnico ?? []) : [])];
}
