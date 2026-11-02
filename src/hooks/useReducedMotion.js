import { useMovimentoReduzido } from './useMovimentoReduzido.js';

/**
 * Movimento reduzido lido em JS: o efetivo da preferência Animações do Leitura (ou do sistema).
 * Os canvas (globo, orbe) congelam rotação e pulsos quando ele vale
 * (ARQUITETURA-INTERFACE.md §4.3).
 */
export function useReducedMotion() {
  return useMovimentoReduzido();
}
