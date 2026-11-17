import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { PreferenciasProvider } from '../../context/PreferenciasProvider.jsx';

/**
 * Renderiza com todos os providers da árvore. Cada chamada tem um QueryClient novo,
 * sem retry, para um teste não herdar cache do outro.
 */
export function renderizar(ui, { rota = '/', ...opcoes } = {}) {
  const clienteQuery = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const Envoltorio = ({ children }) => (
    <QueryClientProvider client={clienteQuery}>
      <PreferenciasProvider>
        <MemoryRouter initialEntries={[rota]}>{children}</MemoryRouter>
      </PreferenciasProvider>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Envoltorio, ...opcoes });
}
