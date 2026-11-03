import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { pedirArquivos } from '../../services/fonteArquivos.js';
import { criarFonteSimulada } from '../../services/fonteSimulada.js';
import { obter } from '../../services/cliente.js';
import { ErroDados } from '../../services/erros.js';
import { diasEntre, montarAgenda } from '../../lib/agenda.js';
import { DIAS_PAGAMENTO } from '../../lib/simulacao.js';

const HOJE = '2026-10-22';
const fonte = () => criarFonteSimulada({ hoje: () => HOJE });
const valorDe = (x) => (x !== null && typeof x === 'object' ? x.valor : x);

describe('fonte simulada', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it.each([
    ['acoes', {}],
    ['mercado_dia', {}],
    ['resumo_acao', {}],
    ['resumo_acao/PETR4', {}],
    ['noticias_dia', {}],
    ['proventos', {}],
    ['series_diarias/IBOV', { janela: '6m' }],
    ['execucao/ultima', {}],
  ])('%s: mesmo contrato da fonte arquivos', async (caminho, params) => {
    const real = await pedirArquivos(caminho, { params });
    const simulado = await fonte()(caminho, { params });
    expect(Object.keys(simulado).sort()).toEqual(Object.keys(real).sort());
    expect(simulado.registros).toHaveLength(real.registros.length);
    expect(Object.keys(simulado.registros[0]).sort()).toEqual(Object.keys(real.registros[0]).sort());
  });

  it('series_diarias/USDBRL: série nas datas do Ibovespa, terminando no fechamento do pacote', async () => {
    const params = { janela: '1a' };
    expect(await pedirArquivos('series_diarias/USDBRL', { params })).toBeNull();
    const ibov = await pedirArquivos('series_diarias/IBOV', { params });
    const usd = (await pedirArquivos('mercado_dia')).registros[0].USDBRL;
    const serie = (await fonte()('series_diarias/USDBRL', { params })).registros[0];
    expect(serie.ticker).toBe('USDBRL');
    expect(serie.datas).toEqual(ibov.registros[0].datas);
    const f = serie.valores.fechamento;
    expect(f.at(-1)).toBeCloseTo(usd.fechamento.valor, 4);
    expect(f.at(-1) / f.at(-2) - 1).toBeCloseTo(usd.variacao_dia.valor, 3);
    const seis = (await fonte()('series_diarias/USDBRL', { params: { janela: '6m' } })).registros[0].valores.fechamento;
    expect(seis).toEqual(f.slice(-seis.length));
  });

  it('determinística: duas fontes devolvem o mesmo', async () => {
    for (const [c, params] of [['noticias_dia', {}], ['proventos', {}], ['resumo_acao', {}], ['series_diarias/USDBRL', { janela: '1a' }]]) {
      expect(await fonte()(c, { params })).toEqual(await fonte()(c, { params }));
    }
  });

  it('resumo com alta, queda e estável', async () => {
    const v = (await fonte()('resumo_acao')).registros.map((r) => valorDe(r.cotacao?.variacao_dia)).filter(Number.isFinite);
    expect(v.some((x) => x === 0)).toBe(true);
    expect(v.some((x) => x > 0)).toBe(true);
    expect(v.some((x) => x < 0)).toBe(true);
  });

  it('notícias com contagens desiguais', async () => {
    const soma = { p: 0, n: 0, g: 0 };
    for (const r of (await fonte()('noticias_dia')).registros) {
      soma.p += valorDe(r.resumo?.positivas) ?? 0;
      soma.n += valorDe(r.resumo?.neutras) ?? 0;
      soma.g += valorDe(r.resumo?.negativas) ?? 0;
    }
    const total = soma.p + soma.n + soma.g;
    expect(Math.max(soma.p, soma.n, soma.g) - Math.min(soma.p, soma.n, soma.g)).toBeGreaterThan(total * 0.15);
  });

  it('proventos nos próximos dias a partir de hoje', async () => {
    const { futuros } = montarAgenda({ proventos: (await fonte()('proventos')).registros, hoje: HOJE });
    expect(futuros.filter((f) => diasEntre(HOJE, f.data_pagamento) <= 21).length).toBeGreaterThanOrEqual(DIAS_PAGAMENTO.length);
  });

  it('taxa de erro 1: rejeita com ErroDados 503', async () => {
    const falha = criarFonteSimulada({ taxaErro: 1, sortear: () => 0 });
    await expect(falha('acoes')).rejects.toBeInstanceOf(ErroDados);
    await expect(falha('acoes')).rejects.toMatchObject({ status: 503 });
  });

  it('respeita o atraso', async () => {
    const lenta = criarFonteSimulada({ latenciaMin: 30, latenciaMax: 30 });
    const t0 = Date.now();
    await lenta('saude');
    expect(Date.now() - t0).toBeGreaterThanOrEqual(25);
  });
});

describe('cliente com VITE_FONTE_DADOS=simulado', () => {
  beforeEach(() => {
    instalarFetchDados();
    vi.stubEnv('VITE_FONTE_DADOS', 'simulado');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('obter usa a fonte simulada', async () => {
    const resp = await obter('series_diarias/USDBRL', { params: { janela: '1a' } });
    expect(resp.registros[0].ticker).toBe('USDBRL');
  });
});
