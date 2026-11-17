/**
 * Análise do dia, lida dos pacotes via React Query.
 *
 * A montagem do agregado é pura (lib/analiseDoDia.js); aqui só se busca e se
 * memoriza.
 */

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { montarAnaliseDoDia } from '../lib/analiseDoDia.js';
import {
  useAcoes,
  useExecucao,
  useMercado,
  useNoticias,
  useResumos,
} from './useDados.js';

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

// lista vazia com referência fixa: o cache de análise compara referências
const SEM_NOTICIAS = [];

/**
 * Agregado da análise do dia, montado a partir dos cinco pacotes. Falha em execução ou em
 * notícias não derruba a tela: execução vira null e notícias, lista vazia. Ações, resumos e
 * mercado continuam sendo erro.
 */
export function useAnaliseDoDia() {
  const acoes = useAcoes();
  const resumos = useResumos();
  const noticias = useNoticias();
  const mercado = useMercado();
  const execucao = useExecucao();
  const essenciais = [acoes, resumos, mercado];
  const opcionais = [noticias, execucao];
  const consultas = [...essenciais, ...opcionais];

  const prontos =
    essenciais.every((c) => c.data !== undefined) && opcionais.every((c) => c.data !== undefined || c.isError);

  const data = useMemo(() => {
    if (!prontos) return undefined;
    return analiseDoDiaCacheada({
      acoes: acoes.data,
      resumos: resumos.data,
      noticias: noticias.data ?? SEM_NOTICIAS,
      mercado: mercado.data,
      execucao: execucao.data ?? null,
    });
  }, [prontos, acoes.data, resumos.data, noticias.data, mercado.data, execucao.data]);

  const isError = essenciais.some((c) => c.isError);
  return {
    data,
    isPending: !isError && consultas.some((c) => c.isPending),
    isError,
    error: essenciais.find((c) => c.isError)?.error ?? null,
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
