import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, RouterProvider, createMemoryRouter, useLocation, useRoutes } from 'react-router-dom';
import { rotas } from '../App.jsx';
import { TEXTOS, porNivel } from '../lib/textos.js';
import { instalarFetchDados } from './apoio/fetchDados.js';

// ScrollRestoration só restaura a rolagem entre navegações e chama window.scrollTo,
// que o jsdom não implementa. Nestes testes ele não tem efeito a verificar.
vi.mock('react-router-dom', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, ScrollRestoration: () => null };
});

const novoCliente = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderizarRota(caminho) {
  const roteador = createMemoryRouter(rotas, { initialEntries: [caminho] });
  render(
    <QueryClientProvider client={novoCliente()}>
      <RouterProvider router={roteador} />
    </QueryClientProvider>,
  );
  return roteador;
}

/**
 * Redirecionamentos (<Navigate>) num data router disparam uma navegação que cria
 * um Request do Node com o AbortController do jsdom, e o Node recusa esse sinal.
 * Por isso os redirecionamentos são checados sobre o mesmo array de rotas, num
 * MemoryRouter comum com useRoutes, que não faz essa requisição.
 */
function RotasEmMemoria() {
  return useRoutes(rotas);
}

function LocalAtual() {
  const { pathname, hash } = useLocation();
  return <output data-testid="local">{`${pathname}${hash}`}</output>;
}

function renderizarRedirecionamento(caminho) {
  render(
    <QueryClientProvider client={novoCliente()}>
      <MemoryRouter initialEntries={[caminho]}>
        <RotasEmMemoria />
        <LocalAtual />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const local = () => screen.getByTestId('local').textContent;

describe('rotas', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  // cada página própria tem um único h1; os chunks carregam sob demanda e, com a suíte inteira em paralelo, a primeira carga demora: prazo de 15s
  it('/ mostra a página Hoje: o Top 5 para estudar em destaque e o bloco Como usar', async () => {
    renderizarRota('/');

    expect(await screen.findByRole('heading', { level: 1, name: /Top 5 para estudar hoje/i }, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: porNivel(TEXTOS.comoUsar.titulo, 'simples') })).toBeInTheDocument();
  }, 20000);

  it.each([
    ['/mercado', TEXTOS.mercado.titulo],
    ['/setores', TEXTOS.paginas.setores],
    ['/acoes', /ações/],
    ['/proventos', porNivel(TEXTOS.proventos.titulo, 'simples')],
    ['/noticias', porNivel(TEXTOS.paginas.noticiasTitulo, 'simples')],
    ['/modelo', TEXTOS.paginas.modelo],
    ['/dados', porNivel(TEXTOS.dados.titulo, 'simples')],
  ])('%s mostra a página com um único h1', async (caminho, titulo) => {
    renderizarRota(caminho);

    expect(await screen.findByRole('heading', { level: 1, name: titulo }, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  }, 20000);

  it('/setores traz o mapa do pregão por setor, abaixo dos cartões', async () => {
    renderizarRota('/setores');

    expect(
      await screen.findByRole('heading', { level: 2, name: TEXTOS.setores.mapaTitulo }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it('/modelo mostra o a régua de acerto como seção h2 e não repete o Top 5', async () => {
    renderizarRota('/modelo');

    expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.acerto.titulo }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: TEXTOS.top5.titulo })).not.toBeInTheDocument();
  });

  it('/sugestoes redireciona para /acoes', async () => {
    renderizarRedirecionamento('/sugestoes');

    await waitFor(() => expect(local()).toBe('/acoes'));
  });

  it('/rota-qualquer redireciona para /', async () => {
    renderizarRedirecionamento('/rota-qualquer');

    await waitFor(() => expect(local()).toBe('/'));
  });

  it('/acao/PETR4 mostra a ficha da ação', async () => {
    renderizarRota('/acao/PETR4');

    // a ficha carrega vários pacotes; na suíte completa, sob carga, pode passar do padrão de 1s
    expect(await screen.findByRole('heading', { level: 1, name: 'PETR4' }, { timeout: 5000 })).toBeInTheDocument();
  });
});
