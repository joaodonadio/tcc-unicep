import { obter, FONTE } from './cliente.js';
import { mapearComLimite } from '../lib/concorrencia.js';
import { PERIODOS_VELA, velasPorSetor } from '../lib/velasSetores.js';

// O navegador abre até 6 conexões por servidor, como nas demais buscas em lote.
const LIMITE_SIMULTANEO = 6;

/**
 * Velas por setor de cada período ({ s1: [...], m1, m6, a1 }), com o nome bruto do setor.
 * API: primeiro a rota local /velas-setores (scripts/seriesSemana.mjs), que calcula as velas no
 * servidor. Sem ela, fora da api ou com falha: a série de 1 ano de cada ação (`porTicker`, 6 por
 * vez) e a mesma conta de lib/velasSetores.js.
 */
export async function buscarVelasSetores(acoes = [], { signal, porTicker, pedir = obter, fonte = FONTE } = {}) {
  if (fonte === 'api') {
    try {
      const resp = await pedir('velas-setores', { signal });
      if (resp?.velas && typeof resp.velas === 'object') return resp.velas;
    } catch (erro) {
      if (signal?.aborted) throw erro;
      // sem a rota local (ex.: outro servidor): segue com a busca por ticker
    }
  }
  const tickers = acoes.map((a) => a?.ticker).filter(Boolean);
  const resultados = await mapearComLimite(tickers, LIMITE_SIMULTANEO, (t) => porTicker(t), { signal });
  const series = new Map(tickers.map((t, i) => [t, resultados[i].ok ? resultados[i].valor : null]));
  if (tickers.length > 0 && [...series.values()].every((s) => s == null)) throw new Error('nenhuma série obtida');
  return Object.fromEntries(PERIODOS_VELA.map((p) => [p, velasPorSetor(acoes, series, p)]));
}
