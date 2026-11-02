/**
 * Conferência do contrato dos pacotes de dados (versao_contrato "1.x").
 *
 * Não bloqueia a tela: uma versão fora do esperado só gera aviso no console,
 * para o desenvolvedor perceber a divergência com o processamento.
 */

/** Avisa no console se a versão do envelope não for 1.x. Devolve o próprio envelope. */
export function verificarContrato(env) {
  const versao = String(env?.versao_contrato ?? '');
  if (!versao.startsWith('1.')) {
    console.warn(
      `[dados] versao_contrato "${versao || '(ausente)'}" fora do esperado (1.x). A tela pode não refletir o pacote.`,
    );
  }
  return env;
}

/**
 * Normaliza a resposta em lista de registros. Aceita: array puro, envelope
 * com `registros`, ou um registro único (vira lista de um item).
 */
export function extrairRegistros(resp) {
  if (resp == null) return [];
  if (Array.isArray(resp)) return resp;
  if (typeof resp === 'object') {
    if ('registros' in resp) return Array.isArray(resp.registros) ? resp.registros : [];
    return [resp];
  }
  return [];
}
