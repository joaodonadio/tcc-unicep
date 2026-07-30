/**
 * Estado de servidor via React Query (ARQUITETURA-INTERFACE.md §4.1).
 *
 * A análise do dia é a única fonte de verdade da interface: cacheada com
 * staleTime de 60s e refetch a cada 5min, porque o back recalcula
 * periodicamente. Não há Redux — nada de estado de servidor em contexto.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  buscarAnaliseDoDia,
  buscarHistorico,
  registrarDecisao,
  registrarFeedback,
} from '../services/api.js';

export const chaves = {
  analiseDoDia: ['analise-do-dia'],
  historico: (ticker, periodo) => ['historico', ticker, periodo],
};

export function useAnaliseDoDia() {
  return useQuery({
    queryKey: chaves.analiseDoDia,
    queryFn: buscarAnaliseDoDia,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useHistorico(ticker, periodo) {
  return useQuery({
    queryKey: chaves.historico(ticker, periodo),
    queryFn: () => buscarHistorico(ticker, periodo),
    staleTime: 5 * 60_000,
    enabled: Boolean(ticker && periodo),
    placeholderData: (anterior) => anterior, // troca de período não pisca
    retry: 1,
  });
}

/**
 * RF-2.6 — a decisão aparece na tela imediatamente (optimistic update do
 * DecisionsContext) e esta mutation apenas persiste no back; um erro aqui
 * não desfaz o registro local, porque o diário é memória do usuário.
 */
export function useRegistrarDecisao() {
  return useMutation({ mutationFn: registrarDecisao });
}

/** RF-2.5 — feedback "esta análise foi útil?". */
export function useRegistrarFeedback() {
  return useMutation({ mutationFn: registrarFeedback });
}

/** Botão "tentar de novo" dos estados de erro. */
export function useRecarregarAnalise() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: chaves.analiseDoDia });
}
