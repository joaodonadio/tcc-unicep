import { useContext } from 'react';
import { PreferenciasContext } from '../context/contextos.js';
import { movimentoReduzido } from '../lib/movimento.js';

/**
 * Movimento reduzido efetivo para componentes. Com o PreferenciasProvider, usa o valor do
 * contexto (muda junto com a preferência do Leitura); sem ele (testes, componente avulso),
 * lê a raiz ou a preferência do sistema.
 */
export function useMovimentoReduzido() {
  const contexto = useContext(PreferenciasContext);
  return contexto ? contexto.movimentoReduzido : movimentoReduzido();
}
