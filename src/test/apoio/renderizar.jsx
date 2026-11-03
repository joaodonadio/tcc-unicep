import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { PreferenciasProvider } from '../../context/PreferenciasProvider.jsx';
import { ListaProvider } from '../../context/ListaProvider.jsx';

/**
 * Renderiza com todos os providers da árvore. Cada chamada tem um QueryClient novo,
 * sem retry, para um teste não herdar cache do outro.
 */
export function renderizar(ui, { rota = '/', ...opcoes } = {}) {
  const clienteQuery = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const Envoltorio = ({ children }) => (
    <QueryClientProvider client={clienteQuery}>
      <PreferenciasProvider>
        <ListaProvider>
          <MemoryRouter initialEntries={[rota]}>{children}</MemoryRouter>
        </ListaProvider>
      </PreferenciasProvider>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Envoltorio, ...opcoes });
}
