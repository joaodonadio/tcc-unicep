import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App.jsx';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

// chunk antigo depois de um deploy: recarrega uma vez (no máximo a cada 10 s) em vez de quebrar
window.addEventListener('vite:preloadError', (evento) => {
  const CHAVE = 'recarga-apos-atualizacao';
  try {
    if (Date.now() - Number(sessionStorage.getItem(CHAVE) ?? 0) < 10_000) return;
    sessionStorage.setItem(CHAVE, String(Date.now()));
  } catch {
    return;
  }
  evento.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
