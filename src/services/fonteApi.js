/**
 * Fonte "api": chama a API de leitura pelo prefixo do proxy (padrão /api).
 * A chave da API é injetada pelo proxy do Vite; nunca aparece aqui.
 *
 * `caminho` é a rota sem /v1 e com os tickers já codificados
 * (ex.: 'series_diarias/SETOR_SEM%3APETR4').
 */

import { erroDeRede, erroDeStatus } from './erros.js';

const TEMPO_LIMITE_MS = 12000;

/**
 * Rotas montadas no servidor (juntam as 85 ações): com o cache da CDN frio levam ~10-20 s.
 * Esperar por elas evita cair na busca ação por ação, que demoraria muito mais.
 */
const ROTAS_MONTADAS = new Set(['proventos-todos', 'velas-setores', 'series-semana', 'dolar-historico']);
const TEMPO_LIMITE_MONTADA_MS = 60000;

export const tempoLimite = (caminho) =>
  ROTAS_MONTADAS.has(String(caminho).replace(/^\/+/, '').split(/[/?]/)[0]) ? TEMPO_LIMITE_MONTADA_MS : TEMPO_LIMITE_MS;

/** Combina o sinal do chamador com o tempo limite. */
function sinalCombinado(signal, limiteMs = TEMPO_LIMITE_MS) {
  const sinais = [AbortSignal.timeout(limiteMs)];
  if (signal) sinais.unshift(signal);

  if (typeof AbortSignal.any === 'function') return AbortSignal.any(sinais);

  // Fallback para navegadores sem AbortSignal.any: um controlador que aborta junto com qualquer um.
  const controle = new AbortController();
  for (const sinal of sinais) {
    if (sinal.aborted) {
      controle.abort(sinal.reason);
      break;
    }
    sinal.addEventListener('abort', () => controle.abort(sinal.reason), { once: true });
  }
  return controle.signal;
}

function montarUrl(caminho, params) {
  const prefixo = import.meta.env.VITE_API_PREFIXO ?? '/api';
  const url = `${prefixo}/v1/${caminho.replace(/^\/+/, '')}`;
  const query = new URLSearchParams();
  for (const [nome, valor] of Object.entries(params ?? {})) {
    if (valor !== undefined && valor !== null) query.set(nome, String(valor));
  }
  const texto = query.toString();
  return texto ? `${url}?${texto}` : url;
}

/**
 * Faz o GET e devolve o envelope JSON. 404 vira null (registro inexistente).
 * Erros: ErroDados com status HTTP, ou status null para rede/tempo esgotado.
 */
export async function pedirApi(caminho, { params, signal } = {}) {
  let resp;
  try {
    resp = await fetch(montarUrl(caminho, params), {
      headers: { Accept: 'application/json' },
      signal: sinalCombinado(signal, tempoLimite(caminho)),
    });
  } catch (erro) {
    // Cancelamento feito pelo chamador (ex.: React Query) não é erro de dados.
    if (signal?.aborted) throw erro;
    throw erroDeRede(erro);
  }

  if (resp.status === 404) return null;
  if (!resp.ok) throw erroDeStatus(resp.status);
  return resp.json();
}
