import { useMovimentoReduzido } from './useMovimentoReduzido.js';

/**
 * Movimento reduzido lido em JS: o efetivo da preferência Animações do Leitura (ou do sistema).
 * Rolagem, canvas 3D e gráficos animados trocam o movimento por mudança direta quando ele vale
 * (ARQUITETURA-INTERFACE.md §4.3).
 */
export function useReducedMotion() {
  return useMovimentoReduzido();
}
