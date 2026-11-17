import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import Top5Destaque from '../../components/hoje/Top5Destaque.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { REGRAS } from '../../lib/sugestoes.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

vi.mock('../../components/modelos3d/Modelo3D.jsx', () => ({
  default: ({ tipo }) => <div data-testid="modelo3d">{tipo}</div>,
}));

const T = TEXTOS.top5Hoje;

describe('Top5Destaque', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('mostra o título, cinco itens e, em "Como escolhemos", quantas coisas o site olha', async () => {
    renderizar(<Top5Destaque />);

    expect(await screen.findByRole('heading', { level: 2, name: /Top 5 para estudar hoje/ })).toBeInTheDocument();
    const lista = await screen.findByRole('list', { name: T.listaRotulo });
    expect(within(lista).getAllByRole('button')).toHaveLength(5);

    const botao = screen.getByRole('button', { name: T.comoEscolhemos });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    const painel = document.getElementById(botao.getAttribute('aria-controls'));
    expect(painel).toHaveAttribute('inert');
    expect(within(painel).getByText(porNivel(T.origemRegras, 'simples')(REGRAS.length))).toBeInTheDocument();

    fireEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(painel).not.toHaveAttribute('inert');
  });

  it('a primeira vem selecionada e clicar na terceira muda o palco', async () => {
    renderizar(<Top5Destaque />);

    const lista = await screen.findByRole('list', { name: T.listaRotulo });
    const botoes = within(lista).getAllByRole('button');
    expect(botoes[0]).toHaveAttribute('aria-pressed', 'true');

    const ticker = botoes[2].querySelector('.top5-ticker').textContent;
    fireEvent.click(botoes[2]);

    expect(botoes[2]).toHaveAttribute('aria-pressed', 'true');
    expect(botoes[0]).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(T.escolhido(ticker))).toBeInTheDocument();
    const painel = screen.getByLabelText(T.painelRotulo);
    expect(within(painel).getByText(ticker, { exact: false })).toBeInTheDocument();
    const ficha = within(painel).getByRole('link', { name: T.abrirFicha });
    expect(ficha).toHaveAttribute('href', `/acao/${ticker}?pergunta=regras`);
    expect(ficha).toHaveClass('botao--principal');
  });

  it('cada cartão da lista traz o motivo principal', async () => {
    renderizar(<Top5Destaque />);

    const lista = await screen.findByRole('list', { name: T.listaRotulo });
    const motivo = within(lista).getAllByRole('button')[0].querySelector('.top5-item-motivo');
    expect(motivo).not.toBeNull();
    expect(motivo.textContent.trim()).not.toBe('');
  });

  it('o palco mostra o gráfico de 6 meses com título e não tem mais o placar', async () => {
    renderizar(<Top5Destaque />);

    const lista = await screen.findByRole('list', { name: T.listaRotulo });
    const ticker = within(lista).getAllByRole('button')[0].querySelector('.top5-ticker').textContent;
    const painel = screen.getByLabelText(T.painelRotulo);

    expect(within(painel).getByText(T.seisMesesTitulo)).toBeInTheDocument();
    expect(await within(painel).findByRole('img', { name: new RegExp(`^${ticker} nos últimos 6 meses`) })).toBeInTheDocument();
    expect(painel.querySelector('.top5-placar')).toBeNull();
  });

  it('"Por que está aqui" resume os pontos em palavras e cada ponto abre a sua explicação', async () => {
    renderizar(<Top5Destaque />);

    await screen.findByRole('list', { name: T.listaRotulo });
    const conteudo = screen.getByRole('tabpanel');
    expect(conteudo.querySelector('.top5-resumo').textContent).toMatch(/a favor/);
    // o Cotinha fica ao lado da frase-resumo, com o humor que o resumo pede
    const pavio = conteudo.querySelector('.top5-resumo-linha .mascote');
    expect(pavio.getAttribute('class')).toMatch(/mascote--(neutro|contente|atento)/);
    // e no Top 5 ele usa a ação vivo (animação em ciclo)
    expect(pavio).toHaveClass('mascote--vivo');

    const botoes = within(conteudo).getAllByRole('button');
    expect(botoes.length).toBeGreaterThan(0);
    expect(botoes.length).toBeLessThanOrEqual(4);
    const tipo = botoes[0].querySelector('.top5-motivo-tipo').textContent;
    expect(Object.values(T.tomMotivo)).toContain(tipo);

    const [primeiro, ...outros] = botoes;
    expect(primeiro).toHaveAttribute('aria-expanded', 'false');
    const painel = document.getElementById(primeiro.getAttribute('aria-controls'));
    expect(painel).toHaveAttribute('inert');
    expect(painel.textContent.trim()).not.toBe('');

    fireEvent.click(primeiro);
    expect(primeiro).toHaveAttribute('aria-expanded', 'true');
    expect(painel).not.toHaveAttribute('inert');
    outros.forEach((b) => expect(b).toHaveAttribute('aria-expanded', 'false'));
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

  it('o palco tem duas abas e marca a escolhida com aria-selected', async () => {
    renderizar(<Top5Destaque />);

    await screen.findByRole('list', { name: T.listaRotulo });
    const abas = within(screen.getByRole('tablist', { name: T.abasPainelRotulo })).getAllByRole('tab');
    expect(abas).toHaveLength(2);
    expect(screen.getByRole('tab', { name: T.porQue })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: T.entenda })).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(screen.getByRole('tab', { name: T.entenda }));
    expect(screen.getByRole('tab', { name: T.entenda })).toHaveAttribute('aria-selected', 'true');
  });

  it('a seleção da lista é marcada para o indicador, que fica desligado sem medida', async () => {
    renderizar(<Top5Destaque />);

    const lista = await screen.findByRole('list', { name: T.listaRotulo });
    expect(lista.querySelector('.top5-indicador')).toHaveAttribute('aria-hidden', 'true');
    // jsdom não mede layout: o escolhido segue com o próprio destaque
    expect(lista).not.toHaveAttribute('data-indicador');
    const botoes = within(lista).getAllByRole('button');
    expect(botoes[0]).toHaveAttribute('data-indicador-alvo', 'true');

    fireEvent.click(botoes[2]);
    expect(botoes[2]).toHaveAttribute('data-indicador-alvo', 'true');
    expect(botoes[0]).not.toHaveAttribute('data-indicador-alvo');
  });

  it('o palco marca a entrada: por ação ao montar, por aba depois de trocar de aba', async () => {
    renderizar(<Top5Destaque />);

    await screen.findByRole('list', { name: T.listaRotulo });
    const painel = screen.getByLabelText(T.painelRotulo);
    expect(painel).toHaveAttribute('data-entrada', 'acao');

    fireEvent.click(screen.getByRole('tab', { name: T.porQue }));
    expect(painel).toHaveAttribute('data-entrada', 'acao');

    fireEvent.click(screen.getByRole('tab', { name: T.entenda }));
    expect(painel).toHaveAttribute('data-entrada', 'aba');
    const abas = screen.getByRole('tablist', { name: T.abasPainelRotulo });
    expect(abas.querySelector('.top5-aba-indicador')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('tab', { name: T.entenda })).toHaveAttribute('data-indicador-alvo', 'true');
  });
});
