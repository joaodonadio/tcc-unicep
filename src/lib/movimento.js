/**
 * Movimento reduzido efetivo para o JS (palcos 3D, rolagem, contagens, gráficos).
 *
 * O PreferenciasProvider põe `data-movimento` na raiz ('reduzido' ou 'livre'), já com a
 * preferência do site e a do sistema combinadas. Sem o atributo (testes, antes do provider),
 * vale a preferência do sistema operacional.
 */
export function movimentoReduzido() {
  try {
    if (typeof document !== 'undefined' && document.documentElement.dataset.movimento) {
      return document.documentElement.dataset.movimento === 'reduzido';
    }
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  } catch {
    return false;
  }
}

/**
 * Traz o elemento para a vista dentro de uma faixa que rola na horizontal (a lista do Top 5 no celular).
 * Sem rolagem na faixa, ou sem suporte (jsdom), não faz nada. Suave só sem movimento reduzido.
 */
export function trazerParaVista(elemento, faixa) {
  if (!elemento || typeof elemento.scrollIntoView !== 'function') return false;
  if (!faixa || !(faixa.scrollWidth > faixa.clientWidth)) return false;
  elemento.scrollIntoView({ behavior: movimentoReduzido() ? 'auto' : 'smooth', block: 'nearest', inline: 'nearest' });
  return true;
}
