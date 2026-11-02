// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { buscarProventosDeTodas } from '../../services/proventosTodos.js';

const erroComStatus = (status) => Object.assign(new Error(`HTTP ${status}`), { status });

/** Resposta falsa de /proventos/{ticker}: um registro com o próprio ticker no caminho. */
const respostaPorTicker = (caminho) => ({ registros: [{ ticker: caminho.replace('proventos/', '') }] });

describe('buscarProventosDeTodas (fonte api)', () => {
  it('chama /proventos/{ticker} uma vez por ticker', async () => {
    const pedir = vi.fn(async (caminho) => respostaPorTicker(caminho));
    const { registros, falhas } = await buscarProventosDeTodas(['PETR4', 'VALE3'], {
      pedir,
      fonte: 'api',
      esperaMs: 0,
    });
    expect(pedir).toHaveBeenCalledTimes(2);
    expect(pedir).toHaveBeenCalledWith('proventos/PETR4', expect.any(Object));
    expect(pedir).toHaveBeenCalledWith('proventos/VALE3', expect.any(Object));
    expect(registros.map((r) => r.ticker).sort()).toEqual(['PETR4', 'VALE3']);
    expect(falhas).toEqual([]);
  });

  it('um 503 seguido de sucesso entra no resultado', async () => {
    let tentativasPetr = 0;
    const pedir = vi.fn(async (caminho) => {
      if (caminho === 'proventos/PETR4' && tentativasPetr++ === 0) throw erroComStatus(503);
      return respostaPorTicker(caminho);
    });
    const { registros, falhas } = await buscarProventosDeTodas(['PETR4', 'VALE3'], {
      pedir,
      fonte: 'api',
      esperaMs: 0,
    });
    expect(registros.map((r) => r.ticker).sort()).toEqual(['PETR4', 'VALE3']);
    expect(falhas).toEqual([]);
    expect(pedir.mock.calls.filter(([c]) => c === 'proventos/PETR4')).toHaveLength(2);
  });

  it('um ticker que sempre falha vai para falhas e o resto volta', async () => {
    const pedir = vi.fn(async (caminho) => {
      if (caminho === 'proventos/VALE3') throw erroComStatus(401);
      return respostaPorTicker(caminho);
    });
    const { registros, falhas } = await buscarProventosDeTodas(['PETR4', 'VALE3'], {
      pedir,
      fonte: 'api',
      esperaMs: 0,
    });
    expect(falhas).toEqual(['VALE3']);
    expect(registros.map((r) => r.ticker)).toEqual(['PETR4']);
  });

  it('rejeita quando todos os tickers falham', async () => {
    const pedir = vi.fn(async () => {
      throw erroComStatus(401);
    });
    await expect(
      buscarProventosDeTodas(['PETR4', 'VALE3'], { pedir, fonte: 'api', esperaMs: 0 }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('lista vazia de tickers devolve vazio sem chamar a API', async () => {
    const pedir = vi.fn();
    expect(await buscarProventosDeTodas([], { pedir, fonte: 'api', esperaMs: 0 })).toEqual({
      registros: [],
      falhas: [],
    });
    expect(pedir).not.toHaveBeenCalled();
  });
});

describe('buscarProventosDeTodas (fonte arquivos)', () => {
  it('chama o pacote geral uma vez só', async () => {
    const pedir = vi.fn(async () => ({ registros: [{ ticker: 'PETR4' }, { ticker: 'VALE3' }] }));
    const { registros, falhas } = await buscarProventosDeTodas(['PETR4', 'VALE3'], {
      pedir,
      fonte: 'arquivos',
    });
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(pedir).toHaveBeenCalledWith('proventos', expect.any(Object));
    expect(registros).toHaveLength(2);
    expect(falhas).toEqual([]);
  });
});
