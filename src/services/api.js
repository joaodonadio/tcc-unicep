/**
 * Fachada de dados — o "1 ponto de troca" da estratégia mock-first (§3).
 *
 * Com VITE_USE_MOCKS=true o adapter local responde; com false, o Axios chama
 * a API REST do projeto maior. Os hooks e componentes consomem sempre daqui e
 * nunca sabem qual das duas está ativa.
 */

import { http } from './http.js';
import { mockAdapter } from './mockAdapter.js';
import { validarAnaliseDoDia, validarHistorico } from './validacao.js';

export const USANDO_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

/** GET /api/analise-do-dia — agregado principal (telas Hoje + Recomendações). */
export async function buscarAnaliseDoDia() {
  const dados = USANDO_MOCKS
    ? await mockAdapter.getAnaliseDoDia()
    : (await http.get('/api/analise-do-dia')).data;
  return validarAnaliseDoDia(dados);
}

/** GET /api/historico/{ticker}?periodo=1M|6M|1A — gráfico interativo (RF-3.2). */
export async function buscarHistorico(ticker, periodo) {
  const dados = USANDO_MOCKS
    ? await mockAdapter.getHistorico(ticker, periodo)
    : (await http.get(`/api/historico/${ticker}`, { params: { periodo } })).data;
  return validarHistorico(dados);
}

/** POST /api/decisoes — registro de decisão com snapshot (RF-2.6). */
export async function registrarDecisao(payload) {
  if (USANDO_MOCKS) return mockAdapter.registrarDecisao(payload);
  return (await http.post('/api/decisoes', payload)).data;
}

/** POST /api/feedback — "esta análise foi útil?" (RF-2.5). */
export async function registrarFeedback(payload) {
  if (USANDO_MOCKS) return mockAdapter.registrarFeedback(payload);
  return (await http.post('/api/feedback', payload)).data;
}
