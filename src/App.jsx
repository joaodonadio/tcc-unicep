import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { CarregandoTela } from './components/ui/Estados.jsx';

/**
 * SPA com 4 rotas (ARQUITETURA-INTERFACE.md §4.1).
 *
 * Code splitting por rota: a navbar e a camada de experiência montam uma única
 * vez no layout, e a navegação entre telas é instantânea — o contexto
 * analítico do usuário é preservado (M1, M12).
 */

const Hoje = lazy(() => import('./pages/Hoje.jsx'));
const Recomendacoes = lazy(() => import('./pages/Recomendacoes.jsx'));
const Mercado = lazy(() => import('./pages/Mercado.jsx'));
const Perguntar = lazy(() => import('./pages/Perguntar.jsx'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Suspense fallback={<CarregandoTela />}><Hoje /></Suspense> },
      {
        path: 'recomendacoes',
        element: <Suspense fallback={<CarregandoTela />}><Recomendacoes /></Suspense>,
      },
      { path: 'mercado', element: <Suspense fallback={<CarregandoTela />}><Mercado /></Suspense> },
      {
        path: 'perguntar',
        element: <Suspense fallback={<CarregandoTela />}><Perguntar /></Suspense>,
      },
      { path: '*', element: <Suspense fallback={<CarregandoTela />}><Hoje /></Suspense> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
