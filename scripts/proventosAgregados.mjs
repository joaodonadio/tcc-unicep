/**
 * Rota local GET /api/v1/proventos-todos, servida pelo próprio Vite (dev e preview).
 *
 * A API só tem /v1/proventos/{ticker}: sem esta rota, cada navegador faz 85
 * pedidos para montar a agenda, o que demora muito para quem abre o site pelo
 * túnel. Aqui o servidor busca tudo uma vez, guarda em memória por 6 horas e
 * entrega numa resposta só para todos os visitantes. A chave fica no servidor.
 */

const VALIDADE_MS = 6 * 60 * 60_000;
const SIMULTANEOS = 6;
const ROTA = '/api/v1/proventos-todos';

export function proventosAgregados(env) {
  const base = String(env.API_BASE_URL ?? '').replace(/\/+$/, '');
  const cabecalhos = { 'X-API-Key': env.API_KEY ?? '' };
  let cache = null; // { em, corpo }
  let emAndamento = null;

  async function pedirJson(caminho) {
    const resp = await fetch(`${base}/v1/${caminho}`, { headers: cabecalhos });
    if (!resp.ok) throw new Error(`${caminho}: HTTP ${resp.status}`);
    return resp.json();
  }

  async function montar() {
    const acoes = await pedirJson('acoes');
    const tickers = (acoes.registros ?? []).map((a) => a.ticker).filter(Boolean);
    const registros = [];
    const falhas = [];
    let proximo = 0;
    async function trabalhar() {
      while (proximo < tickers.length) {
        const ticker = tickers[proximo++];
        try {
          const resp = await pedirJson(`proventos/${encodeURIComponent(ticker)}`);
          // a agenda só usa pagamentos com data; o resto não precisa trafegar
          registros.push(...(resp.registros ?? []).filter((r) => r.data_pagamento?.valor));
        } catch {
          falhas.push(ticker);
        }
      }
    }
    await Promise.all(Array.from({ length: SIMULTANEOS }, trabalhar));
    if (tickers.length > 0 && falhas.length === tickers.length) throw new Error('nenhum provento obtido');
    return JSON.stringify({ registros, falhas, gerado_em: new Date().toISOString() });
  }

  function obterCorpo() {
    if (cache && Date.now() - cache.em < VALIDADE_MS) return Promise.resolve(cache.corpo);
    emAndamento ??= montar()
      .then((corpo) => {
        cache = { em: Date.now(), corpo };
        return corpo;
      })
      .finally(() => {
        emAndamento = null;
      });
    return emAndamento;
  }

  function middleware(req, res, next) {
    if (req.method !== 'GET' || req.url?.split('?')[0] !== ROTA) return next();
    obterCorpo().then(
      (corpo) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(corpo);
      },
      () => {
        res.statusCode = 502;
        res.end('{"detail":"proventos indisponíveis"}');
      },
    );
  }

  function instalar(server) {
    if (!base) return; // sem API configurada (modo arquivos): rota não existe
    server.middlewares.use(middleware);
    obterCorpo().catch(() => {}); // já começa a buscar ao subir o servidor
  }

  return {
    name: 'proventos-agregados',
    configureServer: instalar,
    configurePreviewServer: instalar,
  };
}
