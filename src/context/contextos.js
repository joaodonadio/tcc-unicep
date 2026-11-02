import { createContext, useContext } from 'react';

/**
 * Estado de cliente (ARQUITETURA-INTERFACE.md §4.1): apenas preferências
 * e lista. Volume mínimo — todo estado de servidor vive no React Query.
 */

export const PreferenciasContext = createContext(null);
export const ListaContext = createContext(null);

function useContextoObrigatorio(contexto, nome) {
  const valor = useContext(contexto);
  if (!valor) throw new Error(`${nome} precisa estar dentro do seu Provider.`);
  return valor;
}

export const usePreferencias = () => useContextoObrigatorio(PreferenciasContext, 'usePreferencias');
export const useMinhaLista = () => useContextoObrigatorio(ListaContext, 'useMinhaLista');
