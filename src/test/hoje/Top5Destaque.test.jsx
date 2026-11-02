import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import Top5Destaque from '../../components/hoje/Top5Destaque.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

vi.mock('../../components/modelos3d/Modelo3D.jsx', () => ({
  default: ({ tipo }) => <div data-testid="modelo3d">{tipo}</div>,
}));

const T = TEXTOS.top5Hoje;

describe('Top5Destaque', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('mostra o título, cinco itens e a origem pelas regras', async () => {
    renderizar(<Top5Destaque />);

    expect(await screen.findByRole('heading', { level: 1, name: /Top 5 para estudar hoje/ })).toBeInTheDocument();
    const lista = await screen.findByRole('list', { name: T.listaRotulo });
    expect(within(lista).getAllByRole('button')).toHaveLength(5);
    expect(screen.getByText(T.origemRegras)).toBeInTheDocument();
  });

  it('a primeira vem selecionada e clicar na terceira muda o painel', async () => {
    renderizar(<Top5Destaque />);

    const lista = await screen.findByRole('list', { name: T.listaRotulo });
    const botoes = within(lista).getAllByRole('button');
    expect(botoes[0]).toHaveAttribute('aria-pressed', 'true');

    const ticker = botoes[2].querySelector('.top5-ticker').textContent;
    fireEvent.click(botoes[2]);

    expect(botoes[2]).toHaveAttribute('aria-pressed', 'true');
    expect(botoes[0]).toHaveAttribute('aria-pressed', 'false');
    const painel = screen.getByLabelText(T.painelRotulo);
    expect(within(painel).getByText(ticker, { exact: false })).toBeInTheDocument();
    expect(within(painel).getByRole('link', { name: T.abrirFicha })).toHaveAttribute('href', `/acao/${ticker}?pergunta=regras`);
  });

  it('o 3D só monta na aba Entenda com um objeto e troca de objeto pelas perguntas', async () => {
    renderizar(<Top5Destaque />);

    await screen.findByRole('list', { name: T.listaRotulo });
    expect(screen.queryByTestId('modelo3d')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: T.entenda }));
    expect(screen.getByTestId('modelo3d')).toHaveTextContent('balanca');
    fireEvent.click(screen.getByRole('tab', { name: T.abas.pendulo }));
    expect(screen.getByTestId('modelo3d')).toHaveTextContent('pendulo');

    fireEvent.click(screen.getByRole('tab', { name: T.porQue }));
    expect(screen.queryByTestId('modelo3d')).not.toBeInTheDocument();
  });

  it('as abas do painel marcam a escolhida com aria-selected e trocam o conteúdo', async () => {
    renderizar(<Top5Destaque />);

    await screen.findByRole('list', { name: T.listaRotulo });
    expect(screen.getByRole('tab', { name: T.porQue })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: T.numeros })).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(screen.getByRole('tab', { name: T.numeros }));
    expect(screen.getByRole('tab', { name: T.numeros })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(T.numerosIntro)).toBeInTheDocument();
  });
});
