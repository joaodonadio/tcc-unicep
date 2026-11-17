import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import SecaoMercado from '../../components/mercado/SecaoMercado.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

/** Mostra a query da URL atual, para checar que ?aba= saiu. */
function LocalAtual() {
  const local = useLocation();
  return <output data-testid="local">{local.search}</output>;
}

describe('SecaoMercado: sem abas', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('?aba=destaques (aba que saiu) sai da URL e a página segue com os índices', async () => {
    renderizar(
      <>
        <SecaoMercado />
        <LocalAtual />
      </>,
      { rota: '/?aba=destaques' },
    );

    expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.mercado.indicesTitulo })).toBeInTheDocument();
    expect(screen.getByTestId('local')).toHaveTextContent(/^$/);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('?aba=qualquer também sai da URL sem quebrar a página', async () => {
    renderizar(
      <>
        <SecaoMercado />
        <LocalAtual />
      </>,
      { rota: '/?aba=qualquer' },
    );

    expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.mercado.indicesTitulo })).toBeInTheDocument();
    expect(screen.getByTestId('local')).toHaveTextContent(/^$/);
  });
});
