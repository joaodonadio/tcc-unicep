/**
 * Rota local GET /api/v1/proventos-todos, servida pelo próprio Vite (dev e preview).
 *
 * A API só tem /v1/proventos/{ticker}: sem esta rota, cada navegador faz 85
 * pedidos para montar a agenda, o que demora muito para quem abre o site pelo
 * túnel. Aqui o servidor busca tudo ao subir, guarda só na memória dele (nada no
 * navegador de quem visita) e entrega numa resposta só para todos. A cada 6 horas
 * renova por trás, sem ninguém esperar: a versão anterior segue sendo servida até
 * a nova ficar pronta. A chave fica no servidor.
 */

import { criarPedirJson } from './pedirApi.mjs';

const VALIDADE_MS = 6 * 60 * 60_000;
const SIMULTANEOS = 20;
const ROTA = '/api/v1/proventos-todos';

/**
 * Junta os proventos com data de pagamento de todas as ações. `pedirJson(caminho)` devolve o JSON
 * de /v1/{caminho}. Sem nenhum provento obtido, sobe erro. Devolve o objeto da resposta.
 */
export async function montarProventosTodos(pedirJson) {
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
  return { registros, falhas, gerado_em: new Date().toISOString() };
}

export function proventosAgregados(env) {
  const base = String(env.API_BASE_URL ?? '').replace(/\/+$/, '');
  let cache = null; // { em, corpo }
  let emAndamento = null;

  const pedirJson = criarPedirJson(env);
  async function montar() {
    return JSON.stringify(await montarProventosTodos(pedirJson));
  }

  function renovar() {
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

  // Com uma versão em mãos, responde na hora (e renova por trás se venceu); só espera na 1ª montagem.
  function obterCorpo() {
    if (!cache) return renovar();
    if (Date.now() - cache.em >= VALIDADE_MS) renovar().catch(() => {});
    return Promise.resolve(cache.corpo);
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
    renovar().catch(() => {}); // já começa a buscar ao subir o servidor
    // renova sozinho a cada 6 horas, mesmo sem visita; unref não segura o processo aberto
    setInterval(() => renovar().catch(() => {}), VALIDADE_MS).unref?.();
  }

  return {
    name: 'proventos-agregados',
    configureServer: instalar,
    configurePreviewServer: instalar,
  };
}
