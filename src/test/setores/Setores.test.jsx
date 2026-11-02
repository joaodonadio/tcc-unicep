import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import Setores from '../../pages/Setores.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

function LocalAtual() {
  const local = useLocation();
  return <output data-testid="local">{local.search}</output>;
}

const pagina = () => (
  <>
    <Setores />
    <LocalAtual />
  </>
);

describe('página Setores', () => {
  beforeEach(() => {
    localStorage.clear();
    instalarFetchDados();
  });

  it('mostra o h1, a frase para leigos e o mapa do pregão', async () => {
    renderizar(pagina());

    expect(screen.getByRole('heading', { level: 1, name: TEXTOS.paginas.setores })).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.paginas.setoresIntro)).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.setores.oQueE)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.setores.mapaTitulo })).toBeInTheDocument();
  });

  it('o seletor de período é uma lista de abas e troca aria-selected e a URL', () => {
    renderizar(pagina());

    const grupo = screen.getByRole('tablist', { name: TEXTOS.setores.periodoGrupo });
    const hoje = within(grupo).getByRole('tab', { name: TEXTOS.setores.periodos.d1 });
    const mes = within(grupo).getByRole('tab', { name: TEXTOS.setores.periodos.m1 });
    expect(hoje).toHaveAttribute('aria-selected', 'true');
    expect(mes).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(mes);

    expect(mes).toHaveAttribute('aria-selected', 'true');
    expect(hoje).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('local')).toHaveTextContent('?periodo=m1');
  });

  it('abre no período indicado pela URL', () => {
    renderizar(pagina(), { rota: '/?periodo=a1' });

    expect(screen.getByRole('tab', { name: TEXTOS.setores.periodos.a1 })).toHaveAttribute('aria-selected', 'true');
  });

  it('o ranking lista cada setor com o texto completo e um link para o cartão dele', async () => {
    renderizar(pagina());

    const ranking = await screen.findByRole('list', { name: TEXTOS.setores.rankingLista });
    const linhas = within(ranking).getAllByRole('listitem');
    expect(linhas.length).toBeGreaterThan(0);
    const link = within(linhas[0]).getByRole('link');
    expect(link.getAttribute('href')).toMatch(/^#setor-/);
    expect(link.textContent).toMatch(/subiu|subiram|Sem dado/);
    expect(ranking.textContent).not.toMatch(/NaN|undefined/);
  });

  it('mostra a frase-resumo e um cartão por setor com links para as fichas', async () => {
    renderizar(pagina());

    const grade = await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
    const cartoes = within(grade).getAllByRole('article');
    expect(cartoes.length).toBeGreaterThan(0);
    const frase = document.querySelector('.setores-frase').textContent;
    expect(frase).toMatch(/^Hoje \d+ setor(es)? subi\w+ e \d+ ca\S+\. O que mais subiu foi .+ \(\S+%\)\. O que mais caiu, .+ \(\S+%\)\.$/);

    for (const cartao of cartoes) {
      expect(within(cartao).getByText(/\d+ de \d+ subiram|Sem dado/)).toBeInTheDocument();
    }
    const link = within(cartoes[0]).getAllByRole('link')[0];
    expect(link.getAttribute('href')).toMatch(/^\/acao\/[A-Z0-9]+$/);
    expect(grade.textContent).not.toMatch(/NaN|undefined/);
  });

  it('tocar no botão do cartão mostra todas as ações do setor, numa área com rolagem', async () => {
    renderizar(pagina());

    const grade = await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
    const cartao = within(grade).getAllByRole('article')[0];
    const botao = within(cartao).getByRole('button', { name: new RegExp(TEXTOS.setores.ver) });
    expect(botao).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(botao);

    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(within(cartao).getByRole('list', { name: TEXTOS.setores.acoesDoSetor(cartao.querySelector('h3').textContent) })).toBeInTheDocument();
  });

  it('o modo técnico mostra o tom das notícias e as variações nos 4 períodos', async () => {
    localStorage.setItem('painel-b3:preferencias', JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizar(pagina());

    const grade = await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
    const cartao = within(grade).getAllByRole('article')[0];
    expect(within(cartao).getByText(TEXTOS.setores.tomNoticias)).toBeInTheDocument();
    expect(within(cartao).getByRole('table', { name: TEXTOS.setores.quatroPeriodos })).toBeInTheDocument();
  });

  it('o modo simples não mostra a mini-tabela de períodos', async () => {
    renderizar(pagina());

    const grade = await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
    expect(within(grade).queryByRole('table')).not.toBeInTheDocument();
  });

  it('o modo técnico mostra a seção de dispersão entre o ranking e a grade', async () => {
    localStorage.setItem('painel-b3:preferencias', JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizar(pagina());

    expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.setores.dispersao.titulo })).toBeInTheDocument();
  });

  it('o modo simples não mostra a seção de dispersão', async () => {
    renderizar(pagina());

    await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
    expect(screen.queryByRole('heading', { name: TEXTOS.setores.dispersao.titulo })).not.toBeInTheDocument();
  });
});
