/**
 * Leitura dos campos {valor, status, texto?, setor?} dos pacotes de dados.
 *
 * Regra central: valor nulo NUNCA vira 0. Quem não tem número mostra o
 * texto do status (textoStatus), não um zero.
 */

import { ROTULO_STATUS } from './textos.js';

/** true só se o campo tem valor utilizável e status 'ok'. */
export function ok(o) {
  if (o?.status !== 'ok' || o.valor == null) return false;
  return typeof o.valor === 'number' ? Number.isFinite(o.valor) : true;
}

/** Valor do campo se ele estiver ok; caso contrário null. */
export function valorOuNulo(o) {
  return ok(o) ? o.valor : null;
}

/** Texto que explica a ausência de valor, conforme o status do pacote. */
export function textoStatus(o) {
  switch (o?.status) {
    case 'lucro_negativo':
      return o.texto ?? ROTULO_STATUS.lucro_negativo;
    case 'nao_se_aplica':
      return ROTULO_STATUS.nao_se_aplica;
    case 'historico_insuficiente':
      return ROTULO_STATUS.historico_insuficiente;
    case 'calibracao_nao_conferida':
      return ROTULO_STATUS.calibracao_nao_conferida;
    case 'ok':
      return '';
    default:
      return ROTULO_STATUS.indisponivel;
  }
}

/** Campo pronto para a tela: texto formatado (ou "—") e o motivo da ausência. */
export function exibir(campo, formatar = String) {
  if (ok(campo)) return { texto: formatar(campo.valor), motivo: '' };
  return { texto: '—', motivo: textoStatus(campo) || ROTULO_STATUS.indisponivel };
}

/** Número puro (séries, histórico): texto formatado ou "—". Nunca vira 0. */
export function exibirNumero(v, formatar = String) {
  return typeof v === 'number' && Number.isFinite(v) ? formatar(v) : '—';
}
