/**
 * Hooks de leitura dos 8 pacotes de dados (React Query v5).
 *
 * Cada hook devolve só o que a tela precisa: a lista de registros nas rotas de
 * lista e de histórico por ticker (proventos, fundamentos), e um registro
 * único (ou null) nas rotas de um registro por ticker, mercado e execução.
 * O histórico de um campo do resumo (useHistoricoCampo) devolve {datas, valores, motivos}.
 */

import { useQueries, useQuery } from '@tanstack/react-query';
import { obter } from '../services/cliente.js';
import { repetirSeTransitorio } from '../services/erros.js';
import { normalizarHistorico, normalizarTop } from '../services/experimento.js';
import { normalizarHistoricoCampo } from '../lib/historicoAcao.js';

const TEMPO_FRESCO_MS = 10 * 60_000;

const listaDe = (resp) => resp?.registros ?? [];
const primeiroDe = (resp) => resp?.registros?.[0] ?? null;

function opcoesConsulta({ caminho, params, select, enabled = true }) {
  return {
    queryKey: ['dados', caminho, params],
    queryFn: ({ signal }) => obter(caminho, { params, signal }),
    staleTime: TEMPO_FRESCO_MS,
    retry: repetirSeTransitorio,
    select,
    enabled,
  };
}

function useConsultaDados(opcoes) {
  return useQuery(opcoesConsulta(opcoes));
}

/** Codifica o ticker para a rota (ex.: 'SETOR_SEM:PETR4' -> 'SETOR_SEM%3APETR4'). */
const codificar = encodeURIComponent;

export function useAcoes() {
  return useConsultaDados({ caminho: 'acoes', select: listaDe });
}

export function useResumos() {
  return useConsultaDados({ caminho: 'resumo_acao', select: listaDe });
}

export function useResumo(ticker) {
  return useConsultaDados({
    caminho: `resumo_acao/${codificar(ticker ?? '')}`,
    select: primeiroDe,
    enabled: Boolean(ticker),
  });
}

/** Um campo do resumo publicação a publicação (ex.: 'pl', 'cotacao.fechamento'): {datas, valores, motivos} ou null. */
export function useHistoricoCampo(ticker, campo) {
  return useConsultaDados({
    caminho: `resumo_acao/${codificar(ticker ?? '')}/historico`,
    params: { campo },
    select: normalizarHistoricoCampo,
    enabled: Boolean(ticker) && Boolean(campo),
  });
}

export function useSerie(ticker, janela = '1a', { enabled = true } = {}) {
  return useConsultaDados({
    caminho: `series_diarias/${codificar(ticker ?? '')}`,
    params: { janela },
    select: primeiroDe,
    enabled: Boolean(ticker) && enabled,
  });
}

// fora do hook: referência estável, para o combine não refazer o array a cada render
const dadosDe = (resultados) => resultados.map((r) => r.data);

/** Várias séries de uma vez, no mesmo cache de useSerie; devolve os dados na ordem dos tickers. */
export function useSeries(tickers, janela = '1a') {
  return useQueries({
    queries: tickers.map((ticker) =>
      opcoesConsulta({
        caminho: `series_diarias/${codificar(ticker)}`,
        params: { janela },
        select: primeiroDe,
        enabled: Boolean(ticker),
      }),
    ),
    combine: dadosDe,
  });
}

export function useFundamentos(ticker) {
  return useConsultaDados({
    caminho: `fundamentos_trimestrais/${codificar(ticker ?? '')}`,
    select: listaDe,
    enabled: Boolean(ticker),
  });
}

export function useProventos(ticker) {
  return useConsultaDados({
    caminho: `proventos/${codificar(ticker ?? '')}`,
    select: listaDe,
    enabled: Boolean(ticker),
  });
}

export function useNoticias() {
  return useConsultaDados({ caminho: 'noticias_dia', select: listaDe });
}

export function useNoticiasAcao(ticker) {
  return useConsultaDados({
    caminho: `noticias_dia/${codificar(ticker ?? '')}`,
    select: primeiroDe,
    enabled: Boolean(ticker),
  });
}

export function useMercado() {
  return useConsultaDados({ caminho: 'mercado_dia', select: primeiroDe });
}

export function useExecucao() {
  return useConsultaDados({ caminho: 'execucao/ultima', select: primeiroDe });
}

export function useExperimentoTop() {
  return useConsultaDados({ caminho: 'experimento/top', select: normalizarTop });
}

export function useExperimentoHistorico() {
  return useConsultaDados({ caminho: 'experimento/historico', select: normalizarHistorico });
}
