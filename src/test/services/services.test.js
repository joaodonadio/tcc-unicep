// @vitest-environment node
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { obter, FONTE } from '../../services/cliente.js';
import { extrairRegistros } from '../../services/contrato.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/** fetch falso: lê os arquivos de public/ como se fossem servidos pelo Vite. */
function fetchDeArquivos(url) {
  const relativo = String(url).replace(/^\/+/, '');
  const arquivo = path.join(RAIZ, 'public', relativo);
  if (!existsSync(arquivo)) {
    return Promise.resolve({ ok: false, status: 404, json: async () => null });
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => JSON.parse(readFileSync(arquivo, 'utf8')),
  });
}

beforeAll(() => {
  vi.stubEnv('VITE_FONTE_DADOS', 'arquivos');
  vi.stubGlobal('fetch', vi.fn(fetchDeArquivos));
});

afterAll(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('fonte arquivos (emulação das rotas da API)', () => {
  it('usa a fonte arquivos por padrão', () => {
    expect(FONTE).toBe('arquivos');
  });

  it('resumo_acao/PETR4 devolve um único registro', async () => {
    const resp = await obter('resumo_acao/PETR4');
    expect(resp.registros).toHaveLength(1);
    expect(resp.registros[0].ticker).toBe('PETR4');
  });

  it('series_diarias/SETOR_SEM:PETR4 com janela 1m corta para 22 pregões', async () => {
    const resp = await obter(`series_diarias/${encodeURIComponent('SETOR_SEM:PETR4')}`, {
      params: { janela: '1m' },
    });
    const [serie] = resp.registros;
    expect(serie.datas).toHaveLength(22);
    for (const lista of Object.values(serie.valores)) {
      expect(lista).toHaveLength(22);
    }
  });

  it('ticker inexistente devolve null, como um 404', async () => {
    expect(await obter('resumo_acao/XPTO4')).toBeNull();
  });

  it('experimento/top devolve null enquanto o pacote não existe', async () => {
    expect(await obter('experimento/top')).toBeNull();
  });

  it('execucao/ultima devolve o último registro com status ok', async () => {
    const resp = await obter('execucao/ultima');
    expect(resp.registros).toHaveLength(1);
    expect(resp.registros[0].status).toBe('ok');
  });

  it('fundamentos_trimestrais/PETR4 devolve 8 trimestres da PETR4', async () => {
    const resp = await obter('fundamentos_trimestrais/PETR4');
    expect(resp.registros).toHaveLength(8);
    expect(resp.registros.every((r) => r.ticker === 'PETR4')).toBe(true);
  });

  it('proventos/PETR4 devolve registros com valor_por_acao', async () => {
    const resp = await obter('proventos/PETR4');
    expect(resp.registros.length).toBeGreaterThan(0);
    expect(resp.registros.every((r) => r.ticker === 'PETR4')).toBe(true);
    expect(resp.registros.every((r) => r.valor_por_acao !== undefined)).toBe(true);
  });

  it('series_diarias/IBOV com janela 6m corta para 127 pregões', async () => {
    const resp = await obter('series_diarias/IBOV', { params: { janela: '6m' } });
    expect(resp.registros[0].datas).toHaveLength(127);
    expect(resp.registros[0].valores.indice_retorno_total).toHaveLength(127);
  });

  it('resumo_acao/PETR4/historico?campo=pl devolve datas e valores alinhados, sem envelope', async () => {
    const resp = await obter('resumo_acao/PETR4/historico', { params: { campo: 'pl' } });
    expect(resp.datas.length).toBeGreaterThanOrEqual(1);
    expect(resp.valores).toHaveLength(resp.datas.length);
    expect(typeof resp.valores[0]).toBe('number');
    expect(resp.campo).toBe('pl');
    expect(resp.registros).toBeUndefined();
  });

  it('historico com campo com ponto (cotacao.fechamento) termina no valor do resumo', async () => {
    const resumo = await obter('resumo_acao/PETR4');
    const resp = await obter('resumo_acao/PETR4/historico', {
      params: { campo: 'cotacao.fechamento' },
    });
    expect(resp.valores.at(-1)).toBe(resumo.registros[0].cotacao.fechamento.valor);
  });

  it('historico com campo inexistente falha', async () => {
    await expect(
      obter('resumo_acao/PETR4/historico', { params: { campo: 'nao_existe' } }),
    ).rejects.toThrow();
  });

  it('resumo_acao/PETR4 ignora params.data e devolve 1 registro de PETR4', async () => {
    const resp = await obter('resumo_acao/PETR4', { params: { data: '2020-01-01' } });
    expect(resp.registros).toHaveLength(1);
    expect(resp.registros[0].ticker).toBe('PETR4');
  });

  it('historico de ticker inexistente devolve null', async () => {
    expect(await obter('resumo_acao/XPTO4/historico', { params: { campo: 'pl' } })).toBeNull();
  });
});

describe('extrairRegistros', () => {
  const registro = { ticker: 'PETR4' };

  it('aceita array puro', () => {
    expect(extrairRegistros([registro, registro])).toEqual([registro, registro]);
  });

  it('aceita envelope com registros', () => {
    expect(extrairRegistros({ versao_contrato: '1.0', registros: [registro] })).toEqual([registro]);
  });

  it('aceita registro único e transforma em lista de um item', () => {
    expect(extrairRegistros(registro)).toEqual([registro]);
  });
});
