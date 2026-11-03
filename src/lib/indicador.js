/**
 * Indicador de seleção compartilhado (lista do Top 5, abas do palco): posição e tamanho
 * tirados das medidas do item escolhido. Puro: recebe o elemento (ou um objeto com as medidas).
 */

/** Posição (relativa ao trilho) e tamanho do item; sem medida utilizável (jsdom, item oculto), null. */
export function posicaoDoIndicador(alvo) {
  if (!alvo) return null;
  const { offsetLeft: x, offsetTop: y, offsetWidth: largura, offsetHeight: altura } = alvo;
  if (![x, y, largura, altura].every(Number.isFinite) || largura <= 0 || altura <= 0) return null;
  return { x, y, largura, altura };
}

/** Estilo inline do indicador: tamanho direto e posição por transform (só o transform desliza). */
export function estiloDoIndicador(posicao) {
  if (!posicao) return null;
  return {
    width: `${posicao.largura}px`,
    height: `${posicao.altura}px`,
    transform: `translate(${posicao.x}px, ${posicao.y}px)`,
  };
}
