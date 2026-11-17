/**
 * Rotas locais servidas pelo próprio Vite (dev e preview):
 *
 * - GET /api/v1/series-semana: o período de 1 semana da tela Setores usa só os últimos
 *   pregões de cada ação, mas a API só tem /v1/series_diarias/{ticker}: sem esta rota, cada
 *   navegador faz ~85 pedidos de série (janela 1a) para usar 5 pontos.
 * - GET /api/v1/velas-setores: as velas por setor (4 períodos), calculadas da mesma busca.
 *
 * O servidor busca uma vez, guarda o resultado em memória por 6 horas (só o recorte e as
 * velas, não as séries cheias) e entrega numa resposta só para todos os visitantes.
 * A chave fica no servidor.
 */
import { criarPedirJson } from './pedirApi.mjs';
import { PERIODOS_VELA, velasPorSetor } from '../src/lib/velasSetores.js';

const VALIDADE_MS = 6 * 60 * 60_000;
const SIMULTANEOS = 6;
const ROTA = '/api/v1/series-semana';
const ROTA_VELAS = '/api/v1/velas-setores';

/** Pregões guardados por ação: a semana usa 5; a folga deixa o recorte sem perder a conta. */
export const PONTOS_DA_SEMANA = 15;

/**
 * Últimos `pontos` de datas e de cada lista de valores, no formato do item de
 * series_diarias. Ausente vira null (sem série, devolve null).
 */
export function recortarSerie(serie, pontos = PONTOS_DA_SEMANA) {
  if (!serie || typeof serie !== 'object') return null;
  const cortar = (lista) => (Array.isArray(lista) ? lista.slice(-pontos) : lista);
  const valores = Object.fromEntries(
    Object.entries(serie.valores ?? {}).map(([campo, lista]) => [campo, cortar(lista)]),
  );
  return { ...serie, datas: cortar(serie.datas), valores };
}

/**
 * Busca as séries de 1 ano de cada ação e monta os dois corpos: `semana` (recorte dos últimos
 * pregões) e `velas` (velas por setor). `pedirJson(caminho)` devolve o JSON de /v1/{caminho}
 * ou null no 404. Sem nenhuma série obtida, sobe erro. Devolve objetos, não texto.
 */
export async function montarSeriesSemana(pedirJson) {
  const acoes = await pedirJson('acoes');
  if (!acoes) throw new Error('acoes indisponíveis');
  const registros = (acoes.registros ?? []).filter((a) => a?.ticker);
  const tickers = registros.map((a) => a.ticker);
  const series = {};
  const cheias = new Map(); // série completa, só para calcular as velas
  const falhas = [];
  let proximo = 0;
  async function trabalhar() {
    while (proximo < tickers.length) {
      const ticker = tickers[proximo++];
      try {
        const resp = await pedirJson(`series_diarias/${encodeURIComponent(ticker)}?janela=1a`);
        const serie = resp?.registros?.[0] ?? null;
        cheias.set(ticker, serie);
        // ação sem série fica null, nunca 0
        series[ticker] = recortarSerie(serie);
      } catch {
        cheias.set(ticker, null);
        series[ticker] = null;
        falhas.push(ticker);
      }
    }
  }
  await Promise.all(Array.from({ length: SIMULTANEOS }, trabalhar));
  if (tickers.length > 0 && falhas.length === tickers.length) throw new Error('nenhuma série obtida');
  const velas = Object.fromEntries(PERIODOS_VELA.map((p) => [p, velasPorSetor(registros, cheias, p)]));
  const gerado_em = new Date().toISOString();
  return { semana: { series, falhas, gerado_em }, velas: { velas, falhas, gerado_em } };
}

export function seriesSemana(env) {
  const base = String(env.API_BASE_URL ?? '').replace(/\/+$/, '');
  let cache = null; // { em, corpos: { semana, velas } }
  let emAndamento = null;

  const pedirJson = criarPedirJson(env, { nulo404: true });

  async function montar() {
    const { semana, velas } = await montarSeriesSemana(pedirJson);
    return { semana: JSON.stringify(semana), velas: JSON.stringify(velas) };
  }

  function atualizar() {
    emAndamento ??= montar()
      .then((corpos) => {
        cache = { em: Date.now(), corpos };
        return corpos;
      })
      .finally(() => {
        emAndamento = null;
      });
    return emAndamento;
  }

  function obterCorpos() {
    if (!cache) return atualizar();
    // cache vencido responde na hora e renova por trás: a primeira visita não volta a ser lenta
    if (Date.now() - cache.em >= VALIDADE_MS) atualizar().catch(() => {});
    return Promise.resolve(cache.corpos);
  }

  function middleware(req, res, next) {
    const caminho = req.url?.split('?')[0];
    const chave = caminho === ROTA ? 'semana' : caminho === ROTA_VELAS ? 'velas' : null;
    if (req.method !== 'GET' || !chave) return next();
    obterCorpos().then(
      (corpos) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(corpos[chave]);
      },
      () => {
        res.statusCode = 502;
        res.end(
          chave === 'semana'
            ? '{"detail":"séries da semana indisponíveis"}'
            : '{"detail":"velas dos setores indisponíveis"}',
        );
      },
    );
  }

  function instalar(server) {
    if (!base) return; // sem API configurada (modo arquivos): rota não existe
    server.middlewares.use(middleware);
    obterCorpos().catch(() => {}); // já começa a buscar ao subir o servidor
    // renova a cada 6 h, mesmo sem visitas
    setInterval(() => atualizar().catch(() => {}), VALIDADE_MS).unref?.();
  }

  return {
    name: 'series-semana',
    configureServer: instalar,
    configurePreviewServer: instalar,
  };
}
