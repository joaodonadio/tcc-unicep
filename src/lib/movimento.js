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
