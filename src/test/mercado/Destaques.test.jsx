import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import SecaoMercado from '../../components/mercado/SecaoMercado.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

describe('SecaoMercado: Destaques', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('mostra o destaque de cada setor com link para a ação e volume', async () => {
    renderizar(<SecaoMercado />, { rota: '/?aba=destaques' });

    const titulo = await screen.findByRole('heading', { level: 3, name: TEXTOS.mercado.destaqueSetorTitulo });
    const secao = titulo.closest('section');
    const cartoes = within(secao).getAllByRole('listitem');
    expect(cartoes.length).toBeGreaterThan(3);
    expect(within(cartoes[0]).getByRole('link')).toHaveAttribute('href', expect.stringMatching(/^\/acao\//));
    expect(cartoes[0].textContent).toMatch(/o normal/);
    expect(secao.textContent).not.toMatch(/NaN|undefined/);
  });

  it('a lista traz 15 ações, mostra mais 15 e a busca filtra sem acento', async () => {
    renderizar(<SecaoMercado />, { rota: '/?aba=destaques' });

    const tabela = await screen.findByRole('table', { name: TEXTOS.mercado.volumeTabela });
    expect(within(tabela).getAllByRole('row')).toHaveLength(16);

    fireEvent.click(screen.getByRole('button', { name: /^Mostrar mais/ }));
    expect(within(tabela).getAllByRole('row')).toHaveLength(31);

    fireEvent.change(screen.getByRole('searchbox', { name: TEXTOS.mercado.buscaRotulo }), {
      target: { value: 'ambev' },
    });
    expect(within(tabela).getByRole('link', { name: 'ABEV3' })).toBeInTheDocument();
    expect(within(tabela).getAllByRole('row').length).toBeLessThan(5);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzzzz' } });
    expect(screen.getByText(TEXTOS.mercado.semResultado)).toBeInTheDocument();
  });

  it('ordena pelo volume com aria-sort, do maior para o menor', async () => {
    renderizar(<SecaoMercado />, { rota: '/?aba=destaques' });

    const tabela = await screen.findByRole('table', { name: TEXTOS.mercado.volumeTabela });
    const botao = within(tabela).getByRole('button', { name: TEXTOS.mercado.colVolume });
    const cabecalho = botao.closest('th');
    expect(cabecalho).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(botao);
    expect(cabecalho).toHaveAttribute('aria-sort', 'ascending');
  });
});
