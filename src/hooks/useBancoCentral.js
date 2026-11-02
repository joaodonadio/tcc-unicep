/**
 * Séries do Banco Central para as telas (React Query v5): meta da Selic, dólar
 * PTAX e histórico de uma série. Lê pelo proxy /bcb do Vite. Falha vira erro do
 * hook; a tela então mostra o que o pacote de mercado trouxer.
 */

import { useQuery } from '@tanstack/react-query';
import {
  caminhoSerie,
  caminhoUltimoAno,
  lerDolarPtax,
  lerSelic,
  lerSerieHistorica,
  SERIE_DOLAR_PTAX,
  SERIE_SELIC,
} from '../lib/bancoCentral.js';

/** A meta da Selic muda só nas reuniões do Copom; o PTAX sai uma vez por dia útil. */
const TEMPO_FRESCO_MS = 3 * 60 * 60_000;

/** Histórico de um ano muda devagar: o gráfico não precisa buscar de novo por horas. */
const TEMPO_FRESCO_HISTORICO_MS = 6 * 60 * 60_000;

async function buscarSerie(serie, ultimos, ler, signal) {
  const resp = await fetch(caminhoSerie(serie, ultimos), { signal });
  if (!resp.ok) throw new Error(`Banco Central, série ${serie}: HTTP ${resp.status}`);
  return ler(await resp.json());
}

function useSerieBcb(serie, ultimos, ler) {
  return useQuery({
    queryKey: ['dados', 'bcb', serie],
    queryFn: ({ signal }) => buscarSerie(serie, ultimos, ler, signal),
    staleTime: TEMPO_FRESCO_MS,
    retry: 1,
  });
}

/** Meta da Selic: {valor (fração), data (ISO)} ou null. */
export function useSelic() {
  return useSerieBcb(SERIE_SELIC, 1, lerSelic);
}

/** Dólar PTAX: {valor, data (ISO), variacao} ou null. */
export function useDolarPtax() {
  return useSerieBcb(SERIE_DOLAR_PTAX, 2, lerDolarPtax);
}

/** Histórico do último ano de uma série: {datas, valores} (valores em número ou null). */
export function useHistoricoBcb(serie) {
  return useQuery({
    queryKey: ['dados', 'bcb', serie, 'historico'],
    queryFn: async ({ signal }) => {
      const resp = await fetch(caminhoUltimoAno(serie), { signal });
      if (!resp.ok) throw new Error(`Banco Central, série ${serie}: HTTP ${resp.status}`);
      return lerSerieHistorica(await resp.json());
    },
    staleTime: TEMPO_FRESCO_HISTORICO_MS,
    retry: 1,
  });
}
