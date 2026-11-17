// Proxy da API privada na Vercel: /api/v1/<caminho> chega aqui (ver vercel.json) como ?caminho=<caminho>.
// Injeta X-API-Key no servidor; a chave nunca vai ao navegador, nem à resposta, nem ao log.
import { responderJson } from './_comum.js';

// só caracteres seguros de caminho; %3A e ":" valem (ex.: series_diarias/SETOR_SEM%3APETR4)
const CAMINHO_SEGURO = /^[A-Za-z0-9_\-./%:]+$/;

/** Caminho válido (sem "..", sem barra inicial ou dupla, só caracteres seguros) ou null. */
export function validarCaminho(caminho) {
  if (typeof caminho !== 'string' || !CAMINHO_SEGURO.test(caminho)) return null;
  if (caminho.startsWith('/') || caminho.includes('//')) return null;
  let decodificado;
  try {
    decodificado = decodeURIComponent(caminho);
  } catch {
    return null;
  }
  if (decodificado.split('/').includes('..') || decodificado.includes('//')) return null;
  return caminho;
}

/** URL de destino na API: base + /v1/ + caminho + query original sem o parâmetro `caminho`. */
export function montarDestino(base, caminho, urlOriginal) {
  const query = new URLSearchParams(String(urlOriginal ?? '').split('?')[1] ?? '');
  query.delete('caminho');
  const texto = query.toString();
  return `${String(base).replace(/\/+$/, '')}/v1/${caminho}${texto ? `?${texto}` : ''}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return responderJson(res, 405, { erro: 'método não permitido' });
  }
  const base = process.env.API_BASE_URL;
  if (!base) return responderJson(res, 503, { erro: 'API não configurada' });

  const bruto = new URLSearchParams(String(req.url ?? '').split('?')[1] ?? '').get('caminho') ?? req.query?.caminho;
  const caminho = validarCaminho(Array.isArray(bruto) ? bruto.join('/') : bruto);
  if (!caminho) return responderJson(res, 400, { erro: 'caminho inválido' });

  try {
    const resp = await fetch(montarDestino(base, caminho, req.url), {
      headers: { 'X-API-Key': process.env.API_KEY ?? '' },
    });
    const corpo = Buffer.from(await resp.arrayBuffer());
    res.statusCode = resp.status;
    res.setHeader('Content-Type', resp.headers.get('content-type') ?? 'application/json; charset=utf-8');
    // cache só na CDN da Vercel, e só de respostas boas
    if (resp.ok) res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
    res.end(corpo);
  } catch {
    responderJson(res, 502, { erro: 'API indisponível' });
  }
}
