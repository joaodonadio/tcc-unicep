/**
 * Metadados de publicação para o cabeçalho e o rodapé: data do pregão, hora de geração e status da atualização.
 *
 * Lê só os dois pacotes de que esses campos precisam, em vez do agregado completo de useAnaliseDoDia,
 * que baixa os cinco pacotes em toda rota. A regra é a mesma de lib/analiseDoDia.js:
 * data_referencia e gerado_em vêm do primeiro resumo de ação; gerado_em prefere o fim da execução;
 * status_execucao vem da execução.
 */

import { useMemo } from 'react';
import { useExecucao, useResumos } from './useDados.js';

/** Devolve { data } com gerado_em, data_referencia e status_execucao; undefined até as duas consultas chegarem. */
export function useMetaPublicacao() {
  const resumos = useResumos();
  const execucao = useExecucao();
  const prontos = resumos.data !== undefined && execucao.data !== undefined;

  const data = useMemo(() => {
    if (!prontos) return undefined;
    return {
      gerado_em: execucao.data?.fim ?? resumos.data[0]?.gerado_em ?? null,
      data_referencia: resumos.data[0]?.data_referencia ?? null,
      status_execucao: execucao.data?.status ?? null,
    };
  }, [prontos, resumos.data, execucao.data]);

  return { data };
}
