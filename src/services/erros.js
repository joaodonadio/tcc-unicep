/**
 * Erros da camada de dados. `mensagemUsuario` já sai em português e pode ir
 * direto para a tela; `status` é o HTTP da resposta, ou null quando a falha
 * foi de rede/tempo esgotado ou não veio resposta.
 */

export const MENSAGEM_PADRAO = 'Os dados não puderam ser carregados.';
export const MENSAGEM_REDE = 'Não foi possível conectar à fonte de dados.';

const MENSAGENS_POR_STATUS = {
  401: 'O site não tem permissão para ler os dados agora.',
  422: 'O pedido de dados saiu com erro. Recarregue a página.',
  503: 'Dados temporariamente indisponíveis. Tente de novo em alguns minutos.',
};

export class ErroDados extends Error {
  constructor(mensagemUsuario, { status = null, causa, detalhe } = {}) {
    super(detalhe ?? mensagemUsuario, causa !== undefined ? { cause: causa } : undefined);
    this.name = 'ErroDados';
    this.status = status;
    this.mensagemUsuario = mensagemUsuario;
  }
}

/** Erro para uma resposta HTTP sem sucesso (ou 404 emulado no modo arquivos). */
export function erroDeStatus(status, detalhe) {
  return new ErroDados(MENSAGENS_POR_STATUS[status] ?? MENSAGEM_PADRAO, { status, detalhe });
}

/** Erro para falha de rede ou tempo esgotado. */
export function erroDeRede(causa) {
  return new ErroDados(MENSAGEM_REDE, { causa });
}

/** Repete só falhas transitórias (503 ou sem resposta), no máximo 2 vezes. Formato do `retry` do React Query. */
export function repetirSeTransitorio(tentativas, erro) {
  return (erro?.status === 503 || erro?.status == null) && tentativas < 2;
}
