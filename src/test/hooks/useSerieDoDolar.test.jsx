import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { obter } from '../../services/cliente.js';
import { useSerieDoDolar } from '../../hooks/useDados.js';

vi.mock('../../services/cliente.js', () => ({ obter: vi.fn(), FONTE: 'api' }));

// cada teste define as respostas de series_diarias/USDBRL e de dolar-historico
let respostas = {};

function envolver() {
  const clienteQuery = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => <QueryClientProvider client={clienteQuery}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  respostas = {};
  obter.mockReset();
  obter.mockImplementation(async (caminho) => {
    if (caminho in respostas) return respostas[caminho];
    return null;
  });
});

describe('useSerieDoDolar', () => {
  it('usa a série diária do pacote quando ela existe', async () => {
    respostas['series_diarias/USDBRL'] = {
      registros: [{ datas: ['2026-11-10', '2026-11-11', '2026-11-12'], valores: { fechamento: [5, null, 5.1] } }],
    };
    const { result } = renderHook(() => useSerieDoDolar(), { wrapper: envolver() });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data.origem).toBe('serie');
    expect(result.current.data.valores).toEqual([5, null, 5.1]);
    expect(result.current.isError).toBe(false);
    const chamadas = obter.mock.calls.map((c) => c[0]);
    expect(chamadas).not.toContain('dolar-historico');
  });

  it('sem a série do pacote, cai no histórico das publicações', async () => {
    respostas['series_diarias/USDBRL'] = { registros: [] };
    respostas['dolar-historico'] = { datas: ['2026-11-10', '2026-11-11'], valores: [5, 5.1], gerado_em: 'x' };
    const { result } = renderHook(() => useSerieDoDolar(), { wrapper: envolver() });
    await waitFor(() => expect(result.current.data?.origem).toBe('publicacoes'));
    expect(result.current.data.valores).toEqual([5, 5.1]);
    expect(result.current.isError).toBe(false);
  });

  it('sem nenhuma das duas fontes, devolve data null sem erro', async () => {
    const { result } = renderHook(() => useSerieDoDolar(), { wrapper: envolver() });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });
});
