import { useCallback, useId, useState } from 'react';

/**
 * Estado de um painel de detalhes que abre e fecha por um botão.
 * Devolve `aberto`, `alternar` e o `id` do painel (para o aria-controls do botão).
 */
export function useDetalhes(inicial = false) {
  const [aberto, setAberto] = useState(inicial);
  const base = useId();
  const alternar = useCallback(() => setAberto((a) => !a), []);
  return { aberto, alternar, id: `${base}-detalhes` };
}
