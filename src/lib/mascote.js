/**
 * Lógica do mascote Pavio (um candle com olhos). Só dados e regras; o desenho fica em
 * src/components/ui/Mascote.jsx.
 */

/** Humores: cada um tem um olhar. O padrão é o neutro, que é também o logo. */
export const HUMORES = ['neutro', 'contente', 'atento', 'pensativo', 'dormindo'];

/** Ações: animações em loop, independentes do humor. `vivo` é a do Top 5, ao lado da frase. */
export const ACOES = ['ocioso', 'acenando', 'vivo'];

const numero = (valor) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : 0);

/**
 * Humor do Pavio pelo resumo de motivos de um ativo: atenção vence, depois o motivo forte.
 * Sem contagem, ou com campos que não são números, fica neutro.
 */
export function humorDoResumo(contagem) {
  if (numero(contagem?.atencao) > 0) return 'atento';
  if (numero(contagem?.forte) > 0) return 'contente';
  return 'neutro';
}
