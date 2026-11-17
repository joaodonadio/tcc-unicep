// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { montarProventosTodos } from '../../../scripts/proventosAgregados.mjs';
import { montarCorpoDolar } from '../../../scripts/dolarHistorico.mjs';
import { montarSeriesSemana } from '../../../scripts/seriesSemana.mjs';
import handler, { montarDestino, validarCaminho } from '../../../api/proxy.js';
import handlerProventos from '../../../api/v1/proventos-todos.js';

function respostaFalsa() {
  const res = { cabecalhos: {}, statusCode: 200, corpo: '' };
  res.setHeader = (k, v) => {
    res.cabecalhos[k.toLowerCase()] = v;
  };
  res.end = (c) => {
    res.corpo = c;
  };
  return res;
}

describe('montarProventosTodos', () => {
  it('junta só pagamentos com data e anota falhas', async () => {
    const pedir = vi.fn(async (c) => {
      if (c === 'acoes') return { registros: [{ ticker: 'A1' }, { ticker: 'B2' }] };
      if (c === 'proventos/A1') return { registros: [{ data_pagamento: { valor: '2026-01-01' } }, { data_pagamento: {} }] };
      throw new Error('falhou');
    });
    const corpo = await montarProventosTodos(pedir);
    expect(corpo.registros).toHaveLength(1);
    expect(corpo.falhas).toEqual(['B2']);
  });

  it('tudo falhando sobe erro', async () => {
    const pedir = async (c) => {
      if (c === 'acoes') return { registros: [{ ticker: 'A1' }] };
      throw new Error('x');
    };
    await expect(montarProventosTodos(pedir)).rejects.toThrow();
  });
});

describe('montarCorpoDolar', () => {
  it('monta a série a partir das publicações', async () => {
    const pedirDia = async (data) => ({ registros: [{ data_referencia: data, USDBRL: { fechamento: { status: 'ok', valor: 5 } } }] });
    const corpo = await montarCorpoDolar(pedirDia, new Date(2026, 10, 13));
    expect(corpo.datas.at(-1)).toBe('2026-11-13');
    expect(corpo.valores.every((v) => v === 5)).toBe(true);
  });
});

describe('montarSeriesSemana', () => {
  it('devolve semana e velas com a mesma geração', async () => {
    const pedir = async (c) => {
      if (c === 'acoes') return { registros: [{ ticker: 'A1', setor: 'S' }] };
      return { registros: [{ datas: ['2026-01-01', '2026-01-02'], valores: { fechamento: [1, 2] } }] };
    };
    const { semana, velas } = await montarSeriesSemana(pedir);
    expect(semana.series.A1.datas).toHaveLength(2);
    expect(velas.velas).toBeTypeOf('object');
    expect(velas.gerado_em).toBe(semana.gerado_em);
  });
});

describe('validarCaminho', () => {
  it('aceita caminhos normais e %3A', () => {
    expect(validarCaminho('acoes')).toBe('acoes');
    expect(validarCaminho('series_diarias/SETOR_SEM%3APETR4')).toBe('series_diarias/SETOR_SEM%3APETR4');
    expect(validarCaminho('series_diarias/SETOR_SEM:PETR4')).toBe('series_diarias/SETOR_SEM:PETR4');
  });
  it('recusa .., vazio, barra inicial e caracteres estranhos', () => {
    for (const ruim of ['../x', 'a/../b', 'a/%2e%2e/b', '', '/acoes', 'a//b', 'a?b=1', 'a b', undefined]) {
      expect(validarCaminho(ruim)).toBeNull();
    }
  });
});

describe('montarDestino', () => {
  it('preserva a query exceto caminho', () => {
    expect(montarDestino('https://api.x/', 'mercado_dia', '/api/proxy?caminho=mercado_dia&data=2026-01-02')).toBe(
      'https://api.x/v1/mercado_dia?data=2026-01-02',
    );
    expect(montarDestino('https://api.x', 'acoes', '/api/proxy?caminho=acoes')).toBe('https://api.x/v1/acoes');
  });
});

describe('api/proxy handler', () => {
  beforeEach(() => {
    process.env.API_BASE_URL = 'https://api.x';
    process.env.API_KEY = 'segredo';
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.API_BASE_URL;
    delete process.env.API_KEY;
  });

  it('repassa GET com a chave e devolve status, tipo e corpo', async () => {
    const fetchFalso = vi.fn(async () => new Response('{"ok":1}', { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchFalso);
    const res = respostaFalsa();
    await handler({ method: 'GET', url: '/api/proxy?caminho=acoes&janela=1a' }, res);
    expect(fetchFalso).toHaveBeenCalledWith('https://api.x/v1/acoes?janela=1a', { headers: { 'X-API-Key': 'segredo' } });
    expect(res.statusCode).toBe(200);
    expect(res.cabecalhos['content-type']).toBe('application/json');
    expect(String(res.corpo)).toBe('{"ok":1}');
    vi.unstubAllGlobals();
  });

  it('repassa 404 da API', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"detail":"nada"}', { status: 404 })));
    const res = respostaFalsa();
    await handler({ method: 'GET', url: '/api/proxy?caminho=acoes%2FX' }, res);
    expect(res.statusCode).toBe(404);
    vi.unstubAllGlobals();
  });

  it('caminho inválido: 400 sem chamar a API', async () => {
    const fetchFalso = vi.fn();
    vi.stubGlobal('fetch', fetchFalso);
    const res = respostaFalsa();
    await handler({ method: 'GET', url: '/api/proxy?caminho=..%2Fsegredo' }, res);
    expect(res.statusCode).toBe(400);
    expect(fetchFalso).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('outros métodos: 405', async () => {
    const res = respostaFalsa();
    await handler({ method: 'POST', url: '/api/proxy?caminho=acoes' }, res);
    expect(res.statusCode).toBe(405);
  });

  it('sem API_BASE_URL: 503', async () => {
    delete process.env.API_BASE_URL;
    const res = respostaFalsa();
    await handler({ method: 'GET', url: '/api/proxy?caminho=acoes' }, res);
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.corpo)).toEqual({ erro: 'API não configurada' });
  });

  it('falha de rede: 502 sem vazar a chave', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('segredo caiu'); }));
    const res = respostaFalsa();
    await handler({ method: 'GET', url: '/api/proxy?caminho=acoes' }, res);
    expect(res.statusCode).toBe(502);
    expect(res.corpo).not.toContain('segredo');
    vi.unstubAllGlobals();
  });
});

describe('rota montada (proventos-todos)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.API_BASE_URL;
  });

  it('responde JSON com cache só na CDN', async () => {
    process.env.API_BASE_URL = 'https://api.x';
    vi.stubGlobal('fetch', vi.fn(async (url) => new Response(JSON.stringify(url.endsWith('/acoes') ? { registros: [] } : {}), { status: 200 })));
    const res = respostaFalsa();
    await handlerProventos({ method: 'GET' }, res);
    expect(res.statusCode).toBe(200);
    expect(res.cabecalhos['cache-control']).toBe('s-maxage=21600, stale-while-revalidate=86400');
    expect(JSON.parse(res.corpo).registros).toEqual([]);
  });

  it('erro da API: 502 curto', async () => {
    process.env.API_BASE_URL = 'https://api.x';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 500 })));
    const res = respostaFalsa();
    await handlerProventos({ method: 'GET' }, res);
    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.corpo)).toEqual({ erro: 'proventos indisponíveis' });
  });
});
