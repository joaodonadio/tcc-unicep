import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { CarregandoTela } from './components/ui/Estados.jsx';
import { ErroRota } from './components/layout/ErroRota.jsx';

/**
 * SPA com uma página por tema (ARQUITETURA-INTERFACE.md §4.1): Hoje (/), Mercado,
 * Ações, Setores, Proventos, Notícias, O modelo e Sobre os dados, além da ficha da ação
 * (/acao/:ticker). A rota antiga /sugestoes vai para Ações; qualquer outro caminho
 * cai em Hoje.
 *
 * Code splitting por rota: o layout monta uma única vez, e a navegação entre
 * páginas é instantânea.
 */

const Hoje = lazy(() => import('./pages/Hoje.jsx'));
const Mercado = lazy(() => import('./pages/Mercado.jsx'));
const Setores = lazy(() => import('./pages/Setores.jsx'));
const Acoes = lazy(() => import('./pages/Acoes.jsx'));
const Proventos = lazy(() => import('./pages/Proventos.jsx'));
const Noticias = lazy(() => import('./pages/Noticias.jsx'));
const Modelo = lazy(() => import('./pages/Modelo.jsx'));
const Dados = lazy(() => import('./pages/Dados.jsx'));
const Ficha = lazy(() => import('./pages/Ficha.jsx'));

// eslint-disable-next-line react-refresh/only-export-components
export const rotas = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErroRota />,
    children: [
      {
        errorElement: <ErroRota />,
        children: [
          { index: true, element: <Suspense fallback={<CarregandoTela />}><Hoje /></Suspense> },
          { path: 'mercado', element: <Suspense fallback={<CarregandoTela />}><Mercado /></Suspense> },
          { path: 'setores', element: <Suspense fallback={<CarregandoTela />}><Setores /></Suspense> },
          { path: 'acoes', element: <Suspense fallback={<CarregandoTela />}><Acoes /></Suspense> },
          { path: 'proventos', element: <Suspense fallback={<CarregandoTela />}><Proventos /></Suspense> },
          { path: 'noticias', element: <Suspense fallback={<CarregandoTela />}><Noticias /></Suspense> },
          { path: 'modelo', element: <Suspense fallback={<CarregandoTela />}><Modelo /></Suspense> },
          { path: 'dados', element: <Suspense fallback={<CarregandoTela />}><Dados /></Suspense> },
          { path: 'acao/:ticker', element: <Suspense fallback={<CarregandoTela />}><Ficha /></Suspense> },
          { path: 'sugestoes', element: <Navigate to="/acoes" replace /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(rotas);

export function App() {
  return <RouterProvider router={router} />;
}
