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

// A busca por ticker leva dezenas de segundos e os dados mudam uma vez por dia:
// a última agenda fica no navegador, aparece na hora e é atualizada em segundo plano.
const CHAVE_CACHE = 'agenda_proventos_v1';
const VALIDADE_CACHE_MS = 24 * 60 * 60_000;

function lerCache() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_CACHE));
    return salvo && Date.now() - salvo.em < VALIDADE_CACHE_MS ? salvo : null;
  } catch {
    return null;
  }
}

function gravarCache(resultado) {
  // Só os registros com data de pagamento entram na agenda; o resto não precisa ficar guardado.
  const registros = resultado.registros.filter((r) => r.data_pagamento?.valor);
  try {
    localStorage.setItem(CHAVE_CACHE, JSON.stringify({ em: Date.now(), dados: { registros, falhas: resultado.falhas } }));
  } catch {
    // navegador sem armazenamento: segue sem cache
  }
}

export function useAgendaProventos() {
  const acoes = useAcoes();
  const tickers = useMemo(() => (acoes.data ?? []).map((a) => a.ticker).sort(), [acoes.data]);
  const porTicker = FONTE === 'api';
  const consulta = useQuery({
    queryKey: ['dados', 'agenda_proventos', porTicker ? tickers : 'pacote'],
    queryFn: async ({ signal }) => {
      const resultado = await buscarProventosDeTodas(tickers, { signal });
      if (porTicker) gravarCache(resultado);
      return resultado;
    },
    initialData: porTicker ? () => lerCache()?.dados : undefined,
    initialDataUpdatedAt: porTicker ? () => lerCache()?.em : undefined,
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
