/**
 * Instância única de Axios (ARQUITETURA-INTERFACE.md §1).
 *
 * Cliente para a API de análises do projeto maior. Os interceptors normalizam
 * o erro para uma mensagem em português que os estados de erro dos cards
 * exibem direto ao usuário.
 */

import axios from 'axios';

const TIMEOUT_PADRAO = 12000;

function normalizaErro(erro) {
  if (erro.response) {
    const { status } = erro.response;
    if (status === 429) return 'Muitas perguntas em pouco tempo. Aguarde alguns segundos.';
    if (status >= 500) return 'O sistema de análise está indisponível no momento.';
    if (status === 404) return 'Esta análise não foi encontrada.';
    return `A requisição falhou (HTTP ${status}).`;
  }
  if (erro.code === 'ECONNABORTED') return 'A análise demorou mais que o esperado para responder.';
  return 'Não foi possível conectar ao sistema de análise.';
}

function comInterceptors(instancia) {
  instancia.interceptors.response.use(
    (resposta) => resposta,
    (erro) => {
      erro.mensagemUsuario = normalizaErro(erro);
      return Promise.reject(erro);
    },
  );
  return instancia;
}

export const http = comInterceptors(
  axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    timeout: TIMEOUT_PADRAO,
    headers: { 'Content-Type': 'application/json' },
  }),
);

export { normalizaErro };
