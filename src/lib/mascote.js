/**
 * Lógica do mascote Cotinha (um candle com olhos). Só dados e regras; o desenho fica em
 * src/components/ui/Mascote.jsx.
 */

/** Humores: cada um tem um olhar. O padrão é o neutro, que é também o logo. */
export const HUMORES = [
  'neutro',
  'contente',
  'atento',
  'pensativo',
  'dormindo',
  'animado',
  'preocupado',
  'surpreso',
  'curioso',
];

/**
 * Ações: animações em loop, independentes do humor. `vivo` é a do Top 5, ao lado da frase.
 * `moeda` guarda uma moeda com brilho ao lado do corpo (elementos só existem com essa ação).
 */
export const ACOES = ['ocioso', 'acenando', 'vivo', 'moeda'];

const numero = (valor) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : 0);

/**
 * Humor do Cotinha pelo resumo de motivos de um ativo: atenção vence, depois o motivo forte.
 * Sem contagem, ou com campos que não são números, fica neutro.
 */
export function humorDoResumo(contagem) {
  if (numero(contagem?.atencao) > 0) return 'atento';
  if (numero(contagem?.forte) > 0) return 'contente';
  return 'neutro';
}

/** Variação do dia até este módulo (fração: 0,002 = 0,2%) é tratada como estável. */
const LIMITE_LEVE = 0.002;
/** Variação a partir deste módulo (fração: 0,02 = 2%) chama a atenção, para cima ou para baixo. */
const LIMITE_FORTE = 0.02;

/**
 * Humor do Cotinha pela variação do dia (fração, como em `pct`: 0,0123 = 1,23%).
 * Ausente (null, undefined, NaN) fica pensativo; |v| ≥ 2% surpreso; acima de 0,2% contente;
 * abaixo de −0,2% preocupado; o resto neutro.
 */
export function humorDaVariacao(variacao) {
  if (typeof variacao !== 'number' || !Number.isFinite(variacao)) return 'pensativo';
  if (Math.abs(variacao) >= LIMITE_FORTE) return 'surpreso';
  if (variacao > LIMITE_LEVE) return 'contente';
  if (variacao < -LIMITE_LEVE) return 'preocupado';
  return 'neutro';
}

/**
 * Humor do Cotinha pelo tom das notícias (contagens de positivas, neutras e negativas).
 * Mais positivas: contente; mais negativas: preocupado; empate: curioso.
 * Sem as três contagens, ou com soma zero: pensativo.
 */
export function humorDoTom(tom) {
  const { positivas, negativas, neutras } = tom ?? {};
  const contagens = [positivas, neutras, negativas];
  if (!contagens.every((v) => typeof v === 'number' && Number.isFinite(v))) return 'pensativo';
  if (positivas + neutras + negativas <= 0) return 'pensativo';
  if (positivas > negativas) return 'contente';
  if (negativas > positivas) return 'preocupado';
  return 'curioso';
}

/**
 * Humor do Cotinha pelos sinais das variações do dia de um grupo ('up', 'down' ou 'flat').
 * Mais altas: contente; mais quedas: preocupado; empate ou só estáveis: neutro.
 * Nenhum sinal conhecido (lista vazia ou só outros valores): pensativo.
 */
export function humorDaMaioriaDeSinais(sinais = []) {
  const conhecidos = sinais.filter((s) => s === 'up' || s === 'down' || s === 'flat');
  if (conhecidos.length === 0) return 'pensativo';
  const altas = conhecidos.filter((s) => s === 'up').length;
  const quedas = conhecidos.filter((s) => s === 'down').length;
  if (altas > quedas) return 'contente';
  if (quedas > altas) return 'preocupado';
  return 'neutro';
}
