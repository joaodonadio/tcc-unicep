import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnaliseDoDia } from '../../hooks/useAnalise.js';

// cada consulta devolve um estado; o teste escolhe quais falham
const estado = vi.hoisted(() => {
  const falhas = new Set();
  const consulta = (nome, data) => () =>
    falhas.has(nome)
      ? { data: undefined, isPending: false, isError: true, error: new Error(nome) }
      : { data, isPending: false, isError: false, error: null };
  return {
    falhas,
    consulta,
  };
});

vi.mock('../../hooks/useDados.js', () => ({
  useAcoes: estado.consulta('acoes', []),
  useResumos: estado.consulta('resumos', []),
  useNoticias: estado.consulta('noticias', []),
  useMercado: estado.consulta('mercado', {}),
  useExecucao: estado.consulta('execucao', null),
  useSerie: () => ({ data: undefined, isPending: false, isError: false, error: null }),
}));

describe('useAnaliseDoDia com falhas nos metadados', () => {
  it('falha em execução e em notícias não é erro: a análise sai, com notícias vazias', () => {
    estado.falhas.clear();
    ['execucao', 'noticias'].forEach((n) => estado.falhas.add(n));
    const { result } = renderHook(() => useAnaliseDoDia());
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeDefined();
    expect(result.current.data.manchetes_por_tom.positivo).toEqual([]);
    expect(result.current.data.status_execucao).toBeNull();
  });

  it('falha nas ações continua sendo erro', () => {
    estado.falhas.clear();
    estado.falhas.add('acoes');
    const { result } = renderHook(() => useAnaliseDoDia());
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
