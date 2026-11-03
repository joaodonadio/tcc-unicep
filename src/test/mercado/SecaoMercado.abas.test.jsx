import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import SecaoMercado from '../../components/mercado/SecaoMercado.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

/** Mostra a query da URL atual, para checar ?aba=. */
function LocalAtual() {
  const local = useLocation();
  return <output data-testid="local">{local.search}</output>;
}

const abaSelecionada = () => screen.getByRole('tab', { selected: true });

describe('SecaoMercado: abas', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('abre em Índices e mostra só o painel dessa aba', async () => {
    renderizar(<SecaoMercado />);

    expect(screen.getByRole('tab', { name: TEXTOS.mercado.abas.indices })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('table', { name: TEXTOS.mercado.tabelaTitulo })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Juros/ })).not.toBeInTheDocument();
  });

  it('o painel é o tabpanel ligado à aba selecionada', async () => {
    renderizar(<SecaoMercado />);

    const painel = screen.getByRole('tabpanel');
    expect(painel).toHaveAttribute('aria-labelledby', abaSelecionada().id);
    expect(abaSelecionada()).toHaveAttribute('aria-controls', painel.id);
  });

  it('clicar em Destaques grava ?aba=destaques na URL e traz o link para a página Setores', async () => {
    renderizar(
      <>
        <SecaoMercado />
        <LocalAtual />
      </>,
    );

    fireEvent.click(screen.getByRole('tab', { name: TEXTOS.mercado.abas.destaques }));

    expect(abaSelecionada()).toHaveTextContent(TEXTOS.mercado.abas.destaques);
    expect(screen.getByTestId('local')).toHaveTextContent('?aba=destaques');
    expect(screen.getByRole('link', { name: TEXTOS.setores.verTodos })).toHaveAttribute('href', '/setores');
    expect(screen.queryByRole('tab', { name: 'Setores' })).not.toBeInTheDocument();
  });

  it('abre direto na aba indicada pela URL', async () => {
    renderizar(<SecaoMercado />, { rota: '/?aba=destaques' });

    expect(screen.getByRole('tab', { name: TEXTOS.mercado.abas.destaques })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('heading', { level: 3, name: TEXTOS.mercado.destaqueSetorTitulo })).toBeInTheDocument();
  });

  it('valor inválido na URL cai em Índices', async () => {
    renderizar(<SecaoMercado />, { rota: '/?aba=qualquer' });

    expect(screen.getByRole('tab', { name: TEXTOS.mercado.abas.indices })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('table', { name: TEXTOS.mercado.tabelaTitulo })).toBeInTheDocument();
  });

  it('setas trocam de aba com volta no fim, e Home e End vão às pontas', () => {
    renderizar(<SecaoMercado />);
    fireEvent.keyDown(abaSelecionada(), { key: 'ArrowRight' });
    expect(abaSelecionada()).toHaveTextContent(TEXTOS.mercado.abas.destaques);
    fireEvent.keyDown(abaSelecionada(), { key: 'ArrowRight' });
    expect(abaSelecionada()).toHaveTextContent(TEXTOS.mercado.abas.indices);
    fireEvent.keyDown(abaSelecionada(), { key: 'ArrowLeft' });
    expect(abaSelecionada()).toHaveTextContent(TEXTOS.mercado.abas.destaques);
    fireEvent.keyDown(abaSelecionada(), { key: 'Home' });
    expect(abaSelecionada()).toHaveTextContent(TEXTOS.mercado.abas.indices);
    fireEvent.keyDown(abaSelecionada(), { key: 'End' });
    expect(abaSelecionada()).toHaveTextContent(TEXTOS.mercado.abas.destaques);
  });

  it('?aba=juros (aba que saiu) cai em Índices', async () => {
    renderizar(<SecaoMercado />, { rota: '/?aba=juros' });
    expect(screen.getByRole('tab', { name: TEXTOS.mercado.abas.indices })).toHaveAttribute('aria-selected', 'true');
  });
});
