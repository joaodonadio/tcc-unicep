/**
 * Fachada de dados — o "1 ponto de troca" da estratégia mock-first (§3).
 *
 * Com VITE_USE_MOCKS=true o adapter local responde; com false, o Axios chama
 * a API REST do projeto maior. Os hooks e componentes consomem sempre daqui e
 * nunca sabem qual das duas está ativa.
 */

import { http, httpChat } from './http.js';
import { mockAdapter } from './mockAdapter.js';
import { responderPorRegra } from '../mocks/respostasFallback.js';
import { validarAnaliseDoDia, validarHistorico, validarRespostaChat } from './validacao.js';

export const USANDO_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

/**
 * A API de análises e o serviço `agente-chat` são back-ends distintos e sobem
 * em momentos diferentes: dá para ter o agente no ar antes do pipeline de
 * predição. Por isso o chat tem o seu próprio interruptor — com
 * VITE_USE_CHAT_SERVICE=true os dados continuam vindo do mock e só o chat vai
 * para o serviço real.
 */
const USANDO_CHAT_REAL = import.meta.env.VITE_USE_CHAT_SERVICE === 'true' || !USANDO_MOCKS;

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

/**
 * POST /chat — agente conversacional (AGENTE-CHAT-IA.md §7).
 *
 * RA-9: se o serviço não responder, degradamos para o modo regra em vez de
 * mostrar erro — o chat nunca fica mudo, só avisa que está resumido.
 */
export async function perguntarAoSistema({ mensagem, nivel, historico = [], contextoUi = null }) {
  if (!USANDO_CHAT_REAL) return mockAdapter.perguntar({ mensagem });

  try {
    const { data } = await httpChat.post('/chat', {
      mensagem,
      nivel,
      historico: historico.map((m) => ({ papel: m.papel, texto: m.texto })),
      contexto_ui: contextoUi,
    });
    return validarRespostaChat(data);
  } catch {
    return responderPorRegra(mensagem);
  }
}
