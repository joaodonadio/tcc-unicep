import { obter, FONTE } from './cliente.js';
import { extrairRegistros } from './contrato.js';
import { repetirSeTransitorio } from './erros.js';
import { comRepeticao, mapearComLimite } from '../lib/concorrencia.js';

// O navegador abre até 6 conexões por servidor; a API responde em ~2 s por ação.
export const LIMITE_SIMULTANEO = 6;

/**
 * API: primeiro a rota local /proventos-todos (o servidor do Vite junta as 85 ações
 * numa resposta só; scripts/proventosAgregados.mjs). Se ela faltar ou falhar,
 * /proventos/{ticker} das ações, 6 por vez. Arquivos: a rota geral emulada.
 * Falha parcial não derruba a agenda.
 */
export async function buscarProventosDeTodas(
  tickers,
  { signal, pedir = obter, fonte = FONTE, esperaMs, agregado = pedir === obter } = {},
) {
  if (fonte !== 'api') {
    return { registros: extrairRegistros(await pedir('proventos', { signal })), falhas: [] };
  }
  if (agregado) {
    try {
      const resp = await pedir('proventos-todos', { signal });
      if (resp && Array.isArray(resp.registros)) {
        return { registros: resp.registros, falhas: Array.isArray(resp.falhas) ? resp.falhas : [] };
      }
    } catch (erro) {
      if (signal?.aborted) throw erro;
      // sem a rota local (ex.: outro servidor): segue com a busca por ticker
    }
  }
  const resultados = await mapearComLimite(
    tickers, LIMITE_SIMULTANEO,
    (t) => comRepeticao(() => pedir(`proventos/${encodeURIComponent(t)}`, { signal }), repetirSeTransitorio, { signal, esperaMs }),
    { signal },
  );
  const falhas = tickers.filter((_, i) => !resultados[i].ok);
  if (tickers.length > 0 && falhas.length === tickers.length) throw resultados[0].erro;
  return { registros: resultados.flatMap((r) => (r.ok ? extrairRegistros(r.valor) : [])), falhas };
}
