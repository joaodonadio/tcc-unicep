// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PONTOS_DA_SEMANA, recortarSerie, seriesSemana } from '../../../scripts/seriesSemana.mjs';

const datas = (n) => Array.from({ length: n }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
const valores = (n) => Array.from({ length: n }, (_, i) => i + 1);

describe('recortarSerie', () => {
  it('guarda só os últimos pontos de datas e de cada campo', () => {
    const serie = { ticker: 'PETR4', inicio_janela: '2025-01-02', datas: datas(253), valores: { fechamento: valores(253) } };
    const corte = recortarSerie(serie);
    expect(corte.datas).toHaveLength(PONTOS_DA_SEMANA);
    expect(corte.datas.at(-1)).toBe(serie.datas.at(-1));
    expect(corte.valores.fechamento).toEqual(serie.valores.fechamento.slice(-PONTOS_DA_SEMANA));
    expect(corte.ticker).toBe('PETR4');
    expect(corte.inicio_janela).toBe('2025-01-02');
  });

  it('série mais curta que o corte volta inteira', () => {
    const corte = recortarSerie({ datas: datas(3), valores: { fechamento: [1, null, 3] } });
    expect(corte.datas).toHaveLength(3);
    expect(corte.valores.fechamento).toEqual([1, null, 3]);
  });

  it('ausente vira null, nunca 0', () => {
    expect(recortarSerie(null)).toBeNull();
    expect(recortarSerie(undefined)).toBeNull();
  });
});

describe('rotas /api/v1/series-semana e /api/v1/velas-setores', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Sobe o plugin com um fetch falso; `pedir(url)` chama a rota e devolve status e corpo. */
  function subirPlugin(respostas) {
    const fetchFalso = vi.fn(async (url) => {
      const caminho = String(url).replace('http://api.teste', '');
      const r = respostas[caminho] ?? { status: 500 };
      return {
        ok: r.status >= 200 && r.status < 300,
        status: r.status,
        json: async () => r.corpo,
      };
    });
    vi.stubGlobal('fetch', fetchFalso);
    let middleware;
    const server = { middlewares: { use: (m) => (middleware = m) } };
    const plugin = seriesSemana({ API_BASE_URL: 'http://api.teste', API_KEY: 'segredo' });
    plugin.configureServer(server);

    const pedir = (url) =>
      new Promise((resolver) => {
        const res = {
          statusCode: 200,
          setHeader() {},
          end(texto) {
            resolver({ status: this.statusCode, texto });
          },
        };
        middleware({ method: 'GET', url }, res, () => resolver({ status: 404 }));
      });
    return { pedir, fetchFalso };
  }

  it('devolve as séries cortadas, null para ausente e a lista de falhas', async () => {
    const serieLonga = { ticker: 'PETR4', datas: datas(253), valores: { fechamento: valores(253) } };
    const { pedir } = subirPlugin({
      '/v1/acoes': { status: 200, corpo: { registros: [{ ticker: 'PETR4' }, { ticker: 'VALE3' }, { ticker: 'ITUB4' }] } },
      '/v1/series_diarias/PETR4?janela=1a': { status: 200, corpo: { registros: [serieLonga] } },
      '/v1/series_diarias/VALE3?janela=1a': { status: 404 },
      '/v1/series_diarias/ITUB4?janela=1a': { status: 500 },
    });
    const { status, texto } = await pedir('/api/v1/series-semana');
    expect(status).toBe(200);
    const resp = JSON.parse(texto);
    expect(resp.series.PETR4.datas).toHaveLength(PONTOS_DA_SEMANA);
    expect(resp.series.PETR4.valores.fechamento.at(-1)).toBe(253);
    expect(resp.series.VALE3).toBeNull();
    expect(resp.series.ITUB4).toBeNull();
    expect(resp.falhas).toEqual(['ITUB4']);
    expect(texto).not.toContain('segredo');
  });

  it('sem nenhuma série obtida responde 502', async () => {
    const { pedir } = subirPlugin({
      '/v1/acoes': { status: 200, corpo: { registros: [{ ticker: 'PETR4' }] } },
      '/v1/series_diarias/PETR4?janela=1a': { status: 500 },
    });
    const { status } = await pedir('/api/v1/series-semana');
    expect(status).toBe(502);
  });

  it('velas-setores devolve as velas dos 4 períodos, com setor, vela, n e total', async () => {
    const { pedir } = subirPlugin({
      '/v1/acoes': {
        status: 200,
        corpo: {
          registros: [
            { ticker: 'AAA3', setor: 'Financeiro' },
            { ticker: 'BBB3', setor: 'Financeiro' },
            { ticker: 'CCC3', setor: 'Saúde' },
          ],
        },
      },
      '/v1/series_diarias/AAA3?janela=1a': { status: 200, corpo: { registros: [{ ticker: 'AAA3', datas: datas(30), valores: { fechamento: valores(30).map((v) => 100 + v) } }] } },
      '/v1/series_diarias/BBB3?janela=1a': { status: 200, corpo: { registros: [{ ticker: 'BBB3', datas: datas(30), valores: { fechamento: valores(30).map((v) => 100 + 2 * v) } }] } },
      '/v1/series_diarias/CCC3?janela=1a': { status: 200, corpo: { registros: [{ ticker: 'CCC3', datas: datas(30), valores: { fechamento: valores(30).map((v) => 200 - v) } }] } },
    });
    const { status, texto } = await pedir('/api/v1/velas-setores');
    expect(status).toBe(200);
    const { velas } = JSON.parse(texto);
    expect(Object.keys(velas).sort()).toEqual(['a1', 'm1', 'm6', 's1']);
    for (const periodo of Object.keys(velas)) {
      for (const item of velas[periodo]) {
        expect(Object.keys(item)).toEqual(expect.arrayContaining(['setor', 'vela', 'n', 'total']));
      }
    }
    const financeiro = velas.a1.find((v) => v.setor === 'Financeiro');
    expect(financeiro.n).toBe(2);
    expect(financeiro.total).toBe(2);
  });

  it('as duas rotas partilham uma busca: uma chamada de série por ticker', async () => {
    const { pedir, fetchFalso } = subirPlugin({
      '/v1/acoes': { status: 200, corpo: { registros: [{ ticker: 'AAA3', setor: 'Financeiro' }] } },
      '/v1/series_diarias/AAA3?janela=1a': { status: 200, corpo: { registros: [{ ticker: 'AAA3', datas: datas(30), valores: { fechamento: valores(30) } }] } },
    });
    await pedir('/api/v1/series-semana');
    await pedir('/api/v1/velas-setores');
    const chamadasDaSerie = fetchFalso.mock.calls.filter(([url]) => String(url).includes('series_diarias/AAA3'));
    expect(chamadasDaSerie).toHaveLength(1);
  });

  it('series-semana segue com no máximo PONTOS_DA_SEMANA datas por ação', async () => {
    const { pedir } = subirPlugin({
      '/v1/acoes': { status: 200, corpo: { registros: [{ ticker: 'AAA3', setor: 'Financeiro' }] } },
      '/v1/series_diarias/AAA3?janela=1a': { status: 200, corpo: { registros: [{ ticker: 'AAA3', datas: datas(253), valores: { fechamento: valores(253) } }] } },
    });
    const { texto } = await pedir('/api/v1/series-semana');
    const resp = JSON.parse(texto);
    expect(resp.series.AAA3.datas.length).toBeLessThanOrEqual(PONTOS_DA_SEMANA);
  });
});
