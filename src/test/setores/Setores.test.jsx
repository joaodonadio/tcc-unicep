import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import Setores from '../../pages/Setores.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { limparCachePacotes } from '../../services/fonteArquivos.js';
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

  it('mostra o h1 e uma frase só no topo, sem a explicação da prateleira', async () => {
    renderizar(pagina());

    expect(screen.getByRole('heading', { level: 1, name: TEXTOS.paginas.setores })).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.paginas.setoresIntro)).toBeInTheDocument();
    expect(document.querySelector('.setores-explica')).toBeNull();
    await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
  });

  it('o mapa do pregão saiu desta tela (agora fica em Ações)', async () => {
    renderizar(pagina());

    await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
    expect(screen.queryByRole('heading', { name: TEXTOS.setores.mapaTitulo })).not.toBeInTheDocument();
  });

  it('o seletor tem Hoje, 1 semana, 1 mês, 6 meses e 1 ano; troca aria-selected e a URL', () => {
    renderizar(pagina());

    const grupo = screen.getByRole('tablist', { name: TEXTOS.setores.periodoGrupo });
    const abas = within(grupo).getAllByRole('tab').map((t) => t.textContent);
    expect(abas).toEqual(['Último pregão', '1 semana', '1 mês', '6 meses', '1 ano']);

    const hoje = within(grupo).getByRole('tab', { name: TEXTOS.setores.periodos.d1 });
    const mes = within(grupo).getByRole('tab', { name: TEXTOS.setores.periodos.m1 });
    expect(hoje).toHaveAttribute('aria-selected', 'true');

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

  it('cada cartão mostra a média, a contagem ↑ ↓ e o nome que leva às ações, sem o texto antigo', async () => {
    renderizar(pagina());

    const grade = await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
    const cartoes = within(grade).getAllByRole('article');
    expect(cartoes.length).toBeGreaterThan(0);

    for (const cartao of cartoes) {
      const contagem = cartao.querySelector('.setor-contagem');
      expect(contagem.textContent).toMatch(/↑|Sem dado/);
      expect(cartao.textContent).not.toMatch(/Algumas empresas|Resultado no período|Ver as ações/);
    }
    const nomeLink = within(cartoes[0]).getAllByRole('link')[0];
    expect(nomeLink.getAttribute('href')).toMatch(/^\/acoes#setor-/);
    expect(grade.textContent).not.toMatch(/NaN|undefined/);
  });

  it('o nome do setor, no cartão, leva à tela Ações, ancorada no setor', async () => {
    renderizar(pagina());

    const grade = await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
    const cartao = within(grade).getAllByRole('article')[0];
    const nome = within(cartao).getByRole('heading', { level: 3 });
    const link = within(nome).getByRole('link', { name: nome.textContent });
    expect(link.getAttribute('href')).toMatch(/^\/acoes#setor-/);
    // o nome vem primeiro; as pílulas que sobram (cartão de destaque) seguem para a ficha
    const links = within(cartao).getAllByRole('link');
    expect(links[0]).toBe(link);
    for (const pilula of links.slice(1)) expect(pilula.getAttribute('href')).toMatch(/^\/acao\/[A-Z0-9]+$/);
  });

  it('nos cartões compactos, os pontos das ações não são links', async () => {
    renderizar(pagina());

    const grade = await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
    const compactos = within(grade)
      .getAllByRole('article')
      .filter((a) => a.classList.contains('setor-cartao--compacto'));
    expect(compactos.length).toBeGreaterThan(0);
    for (const cartao of compactos) expect(cartao.querySelectorAll('.setor-pontos a')).toHaveLength(0);
  });

  it('o modo técnico mostra o tom das notícias', async () => {
    localStorage.setItem('painel-b3:preferencias', JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizar(pagina());

    const grade = await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
    const cartao = within(grade).getAllByRole('article')[0];
    expect(within(cartao).getByText(TEXTOS.setores.tomNoticias)).toBeInTheDocument();
  });

  it('o modo técnico mostra a seção de velas entre o ranking e a grade', async () => {
    localStorage.setItem('painel-b3:preferencias', JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizar(pagina());

    expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.setores.velas.titulo })).toBeInTheDocument();
  });

  it('o modo simples não mostra a seção de velas', async () => {
    renderizar(pagina());

    await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
    expect(screen.queryByRole('heading', { name: TEXTOS.setores.velas.titulo })).not.toBeInTheDocument();
  });

  it('na aba 1 semana, com todas as séries ausentes, mostra o bloco de erro', async () => {
    limparCachePacotes();
    const servir = instalarFetchDados();
    // o pacote de séries diárias não existe: toda série da semana vira null
    vi.stubGlobal('fetch', async (entrada) =>
      String(entrada?.url ?? entrada).includes('series_diarias')
        ? { ok: false, status: 404, json: async () => ({}) }
        : servir(entrada),
    );
    renderizar(pagina(), { rota: '/?periodo=s1' });

    expect(await screen.findByText(TEXTOS.setores.semanaErro)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: TEXTOS.setores.listaTitulo })).not.toBeInTheDocument();
  });

  it('na aba 1 semana, com variacao_preco.s1 no resumo, não busca as séries da semana', async () => {
    limparCachePacotes();
    const servir = instalarFetchDados();
    // o resumo de cada ação já traz a variação de 1 semana
    vi.stubGlobal('fetch', async (entrada) => {
      const resposta = await servir(entrada);
      if (!String(entrada?.url ?? entrada).includes('resumo_acao')) return resposta;
      const pacote = await resposta.json();
      const registros = pacote.registros.map((r) => ({
        ...r,
        variacao_preco: { ...r.variacao_preco, s1: { valor: 0.01, status: 'ok' } },
      }));
      return { ok: true, status: 200, json: async () => ({ ...pacote, registros }) };
    });
    renderizar(pagina(), { rota: '/?periodo=s1' });

    await screen.findByRole('list', { name: TEXTOS.setores.listaTitulo });
    const urls = servir.mock.calls.map(([entrada]) => String(entrada?.url ?? entrada));
    expect(urls.some((u) => u.includes('series-semana') || u.includes('series_diarias'))).toBe(false);
  });
});
