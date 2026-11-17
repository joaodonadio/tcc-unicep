/**
 * Hooks de leitura dos 8 pacotes de dados (React Query v5).
 *
 * Cada hook devolve só o que a tela precisa: a lista de registros nas rotas de
 * lista e de histórico por ticker (proventos, fundamentos), e um registro
 * único (ou null) nas rotas de um registro por ticker, mercado e execução.
 * O histórico de um campo do resumo (useHistoricoCampo) devolve {datas, valores, motivos}.
 */

import { useMemo } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { obter } from '../services/cliente.js';
import { repetirSeTransitorio } from '../services/erros.js';
import { normalizarHistorico, normalizarTop } from '../services/experimento.js';
import { normalizarHistoricoCampo } from '../lib/historicoAcao.js';
import { serieDoCampo } from '../lib/mercadoTela.js';
import { buscarSeriesDaSemana } from '../services/seriesSemana.js';
import { buscarVelasSetores } from '../services/velasSetores.js';

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

/** Série de 1 ano de um ticker pelo cache de useSerie; falha vira null. */
const serieDoAno = (queryClient) => (ticker) =>
  queryClient
    .fetchQuery(opcoesConsulta({ caminho: `series_diarias/${codificar(ticker)}`, params: { janela: '1a' } }))
    .then(primeiroDe)
    .catch(() => null);

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

/** Registro do dia de mercado_dia; `dados_ate` cai para o da raiz do pacote quando o registro não traz o campo. */
const registroDoMercado = (resp) => {
  const registro = primeiroDe(resp);
  if (!registro || registro.dados_ate !== undefined) return registro;
  return { ...registro, dados_ate: resp?.dados_ate ?? null };
};

export function useMercado() {
  return useConsultaDados({ caminho: 'mercado_dia', select: registroDoMercado });
}

/** Série diária do dólar {datas, valores, gerado_em} montada pela rota local da API; null no modo arquivos. */
export function useHistoricoDolar({ enabled = true } = {}) {
  return useConsultaDados({ caminho: 'dolar-historico', select: (resp) => resp ?? null, enabled });
}

/**
 * Dólar dia a dia {datas, valores, origem}: series_diarias/USDBRL ('serie'); sem ela (404 vira null) ou com
 * erro, o histórico da rota local montado pelas publicações ('publicacoes'). Forma de consulta: data, isPending, isError, error, refetch.
 */
export function useSerieDoDolar() {
  const serie = useSerie('USDBRL', '1a');
  const doPacote = useMemo(() => (serie.isSuccess ? serieDoCampo(serie.data, 'fechamento') : null), [serie.isSuccess, serie.data]);
  const dadosPacote = useMemo(() => (doPacote ? { ...doPacote, origem: 'serie' } : null), [doPacote]);
  const precisaHistorico = serie.isError || (serie.isSuccess && !doPacote);
  const historico = useHistoricoDolar({ enabled: precisaHistorico });
  const dadosHistorico = useMemo(() => {
    if (historico.data === undefined) return undefined;
    return historico.data?.datas?.length ? { datas: historico.data.datas, valores: historico.data.valores, origem: 'publicacoes' } : null;
  }, [historico.data]);
  if (dadosPacote) return { data: dadosPacote, isPending: false, isError: false, error: null, refetch: serie.refetch };
  if (!precisaHistorico) return { data: undefined, isPending: true, isError: false, error: null, refetch: serie.refetch };
  return { data: dadosHistorico, isPending: historico.isPending, isError: historico.isError, error: historico.error, refetch: historico.refetch };
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

/**
 * Séries diárias (janela 1a) das ações dadas, para o período de 1 semana dos setores. Em api,
 * uma rota local só (services/seriesSemana.js); sem ela, cada série por ticker, no mesmo cache
 * de useSerie. Devolve um Map ticker -> série (null quando a série de um ticker falhou).
 */
export function useSeriesDaSemana(tickers = []) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['setores-semana', tickers],
    enabled: tickers.length > 0,
    staleTime: TEMPO_FRESCO_MS,
    queryFn: ({ signal }) =>
      buscarSeriesDaSemana(tickers, { signal, porTicker: serieDoAno(queryClient) }),
  });
}

/** Velas por setor de cada período (lib/velasSetores.js), pela rota local ou pelas séries de 1 ano. */
export function useVelasSetores(acoes = [], { enabled = true } = {}) {
  const queryClient = useQueryClient();
  const tickers = (acoes ?? []).map((a) => a.ticker);
  return useQuery({
    queryKey: ['setores-velas', tickers],
    enabled: enabled && tickers.length > 0,
    staleTime: TEMPO_FRESCO_MS,
    queryFn: ({ signal }) => buscarVelasSetores(acoes ?? [], { signal, porTicker: serieDoAno(queryClient) }),
  });
}
