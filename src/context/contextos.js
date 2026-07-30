import { createContext, useContext } from 'react';

/**
 * Estado de cliente (ARQUITETURA-INTERFACE.md §4.1): apenas preferências,
 * passo do tour e o espelho local do diário. Volume mínimo — todo estado de
 * servidor vive no React Query.
 */

export const PreferenciasContext = createContext(null);
export const TourContext = createContext(null);
export const DecisoesContext = createContext(null);

function useContextoObrigatorio(contexto, nome) {
  const valor = useContext(contexto);
  if (!valor) throw new Error(`${nome} precisa estar dentro do seu Provider.`);
  return valor;
}

export const usePreferencias = () => useContextoObrigatorio(PreferenciasContext, 'usePreferencias');
export const useTour = () => useContextoObrigatorio(TourContext, 'useTour');
export const useDecisoes = () => useContextoObrigatorio(DecisoesContext, 'useDecisoes');
