// Ajudantes das funções da Vercel (o prefixo _ impede que vire rota).
// A chave só é lida de process.env no servidor e nunca entra em resposta nem em log.

export const CACHE_CDN = 's-maxage=21600, stale-while-revalidate=86400';

/** Ambiente da API privada, no formato que scripts/pedirApi.mjs espera. */
export const ambiente = () => ({
  API_BASE_URL: process.env.API_BASE_URL ?? '',
  API_KEY: process.env.API_KEY ?? '',
});

export function responderJson(res, status, corpo, cache = false) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  // cache só na CDN da Vercel: o navegador nunca guarda (sem max-age)
  if (cache) res.setHeader('Cache-Control', CACHE_CDN);
  res.end(JSON.stringify(corpo));
}

/**
 * Cria o handler de uma rota montada a partir da API: GET apenas, 503 sem API configurada,
 * 502 se a montagem falhar. `montar(env)` devolve o objeto da resposta.
 */
export function rotaMontada(montar, mensagemErro) {
  return async function handler(req, res) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return responderJson(res, 405, { erro: 'método não permitido' });
    }
    const env = ambiente();
    if (!env.API_BASE_URL) return responderJson(res, 503, { erro: 'API não configurada' });
    try {
      return responderJson(res, 200, await montar(env), true);
    } catch {
      return responderJson(res, 502, { erro: mensagemErro });
    }
  };
}
