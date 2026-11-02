/**
 * Análise do dia e histórico de ticker, lidos dos pacotes via React Query.
 *
 * A montagem do agregado é pura (lib/analiseDoDia.js); aqui só se busca e se
 * memoriza. A API é somente leitura: feedback e decisão ficam como mutations
 * locais sem efeito no back.
 */

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { montarAnaliseDoDia } from '../lib/analiseDoDia.js';
import { cortarJanela, JANELAS } from '../lib/series.js';
import {
  useAcoes,
  useExecucao,
  useMercado,
  useNoticias,
  useResumos,
  useSerie,
} from './useDados.js';

const PERIODOS = {
  '1M': { pontos: JANELAS['1m'], dias: 30 },
  '6M': { pontos: JANELAS['6m'], dias: 180 },
  '1A': { pontos: JANELAS['1a'], dias: 365 },
};

// Cache de módulo: a análise é montada uma vez por conjunto de pacotes e reaproveitada
// pelos componentes que chamam useAnaliseDoDia, desde que as referências sejam as mesmas.
let cacheAnalise = null;

const mesmasEntradas = (a, b) =>
  a.acoes === b.acoes &&
  a.resumos === b.resumos &&
  a.noticias === b.noticias &&
  a.mercado === b.mercado &&
  a.execucao === b.execucao;

function analiseDoDiaCacheada(entradas) {
  if (cacheAnalise && mesmasEntradas(cacheAnalise.entradas, entradas)) {
    return cacheAnalise.resultado;
  }
  const resultado = montarAnaliseDoDia(entradas);
  cacheAnalise = { entradas, resultado };
  return resultado;
}

/** Agregado da análise do dia, montado a partir dos cinco pacotes. */
export function useAnaliseDoDia() {
  const acoes = useAcoes();
  const resumos = useResumos();
  const noticias = useNoticias();
  const mercado = useMercado();
  const execucao = useExecucao();
  const consultas = [acoes, resumos, noticias, mercado, execucao];

  const prontos = consultas.every((c) => c.data !== undefined);

  const data = useMemo(() => {
    if (!prontos) return undefined;
    return analiseDoDiaCacheada({
      acoes: acoes.data,
      resumos: resumos.data,
      noticias: noticias.data,
      mercado: mercado.data,
      execucao: execucao.data,
    });
  }, [prontos, acoes.data, resumos.data, noticias.data, mercado.data, execucao.data]);

  const isError = consultas.some((c) => c.isError);
  return {
    data,
    isPending: !isError && consultas.some((c) => c.isPending),
    isError,
    error: consultas.find((c) => c.isError)?.error ?? null,
  };
}

/** Botão "tentar de novo" dos estados de erro: refaz as consultas ativas. */
export function useRecarregarAnalise() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === 'dados' &&
        ['acoes', 'resumo_acao', 'noticias_dia', 'mercado_dia', 'execucao/ultima'].includes(q.queryKey[1]),
    });
}

/**
 * Série de fechamento de um ticker recortada ao período (1M, 6M ou 1A).
 * Pregões sem fechamento saem da série; datas e valores seguem alinhados.
 */
export function useHistorico(ticker, periodo) {
  const consulta = useSerie(ticker, '1a');
  const { pontos, dias } = PERIODOS[periodo] ?? {};

  const data = useMemo(() => {
    if (!consulta.data || !pontos) return undefined;
    const { datas, valores } = cortarJanela(consulta.data, pontos);
    const fechamento = valores.fechamento ?? [];
    const pares = datas
      .map((data, i) => ({ data, valor: fechamento[i] }))
      .filter(({ valor }) => valor != null);
    return { serie: pares.map((p) => p.valor), datas: pares.map((p) => p.data), dias };
  }, [consulta.data, pontos, dias]);

  return { ...consulta, data };
}
