/**
 * Agenda de pagamentos de proventos das 85 ações (React Query).
 *
 * Na fonte "api" a busca é por ticker, 4 por vez (services/proventosTodos.js).
 * Na fonte "arquivos" é um pacote só. A montagem é pura (lib/agenda.js).
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FONTE } from '../services/cliente.js';
import { buscarProventosDeTodas } from '../services/proventosTodos.js';
import { montarAgenda } from '../lib/agenda.js';
import { hojeISO } from '../lib/datas.js';
import { useAcoes } from './useDados.js';

// Nada fica guardado no navegador: a agenda chega rápido pela rota /proventos-todos, que o servidor mantém pronta.
// Apaga a cópia que versões antigas do site deixavam no localStorage.
try {
  localStorage.removeItem('agenda_proventos_v1');
} catch {
  // navegador sem armazenamento: nada a apagar
}

export function useAgendaProventos() {
  const acoes = useAcoes();
  const tickers = useMemo(() => (acoes.data ?? []).map((a) => a.ticker).sort(), [acoes.data]);
  const porTicker = FONTE === 'api';
  const consulta = useQuery({
    queryKey: ['dados', 'agenda_proventos', porTicker ? tickers : 'pacote'],
    queryFn: ({ signal }) => buscarProventosDeTodas(tickers, { signal }),
    enabled: !porTicker || tickers.length > 0,
    staleTime: 10 * 60_000, gcTime: 10 * 60_000,
    retry: false, // a repetição é por ticker, dentro da busca
  });
  const hoje = hojeISO();
  const semAcoes = porTicker && acoes.isSuccess && tickers.length === 0;
  const data = useMemo(() => {
    if (semAcoes) return montarAgenda({ proventos: [], hoje });
    return consulta.data ? montarAgenda({ proventos: consulta.data.registros, acoes: acoes.data ?? [], hoje }) : undefined;
  }, [semAcoes, consulta.data, acoes.data, hoje]);
  const erro = acoes.error ?? consulta.error ?? null;
  return {
    data,
    hoje,
    falhas: consulta.data?.falhas ?? [],
    isPending: !erro && data === undefined,
    isError: Boolean(erro),
    error: erro,
    refetch: () => (acoes.isError ? acoes.refetch() : consulta.refetch()),
  };
}
