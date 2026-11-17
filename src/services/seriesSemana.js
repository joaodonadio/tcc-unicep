import { obter, FONTE } from './cliente.js';
import { mapearComLimite } from '../lib/concorrencia.js';

// O navegador abre até 6 conexões por servidor, como nas demais buscas em lote.
const LIMITE_SIMULTANEO = 6;

/**
 * Séries da semana (janela 1a) das ações dadas, como Map ticker -> série ou null.
 * API: primeiro a rota local /series-semana (o servidor do Vite junta as séries numa
 * resposta só; scripts/seriesSemana.mjs). Se ela faltar ou falhar, ou fora da fonte
 * api, `porTicker` busca cada série, 6 por vez. Ausente fica null, nunca 0.
 */
export async function buscarSeriesDaSemana(
  tickers,
  { signal, porTicker, pedir = obter, fonte = FONTE } = {},
) {
  if (fonte === 'api') {
    try {
      const resp = await pedir('series-semana', { signal });
      if (resp && resp.series && typeof resp.series === 'object') {
        return new Map(tickers.map((ticker) => [ticker, resp.series[ticker] ?? null]));
      }
    } catch (erro) {
      if (signal?.aborted) throw erro;
      // sem a rota local (ex.: outro servidor): segue com a busca por ticker
    }
  }
  const resultados = await mapearComLimite(tickers, LIMITE_SIMULTANEO, (ticker) => porTicker(ticker), { signal });
  return new Map(tickers.map((ticker, i) => [ticker, resultados[i].ok ? resultados[i].valor : null]));
}
