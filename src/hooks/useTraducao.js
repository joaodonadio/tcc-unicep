/**
 * Tradução automática de uma manchete (React Query, guardada para a sessão inteira).
 * data: {pt, idioma} ou null quando não há tradução.
 */

import { useQuery } from '@tanstack/react-query';
import { traduzir } from '../services/traducao.js';

export function useTraducao(texto) {
  return useQuery({
    queryKey: ['traducao', texto],
    queryFn: () => traduzir(texto),
    enabled: Boolean(texto),
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: false,
  });
}
