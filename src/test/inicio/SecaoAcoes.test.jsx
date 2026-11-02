import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import SecaoAcoes from '../../components/inicio/SecaoAcoes.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { PASSO } from '../../lib/listaAcoes.js';
import { REGRAS } from '../../lib/sugestoes.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const CHAVE_LISTA = 'painel-b3:lista';
const CHAVE_PREFERENCIAS = 'painel-b3:preferencias';

/** Mostra o endereço atual (busca e hash) para o teste conferir a URL. */
function Endereco() {
  const local = useLocation();
  return <output aria-label="endereco">{local.search + local.hash}</output>;
}

const linhas = () => screen.findAllByRole('listitem');

describe('SecaoAcoes', () => {
  beforeEach(() => {
    localStorage.clear();
    instalarFetchDados();
  });

  it('mostra 15 linhas e "Mostrar mais" leva a 30', async () => {
    renderizar(<SecaoAcoes />, { rota: '/?vista=lista' });
    expect(await linhas()).toHaveLength(PASSO);

    fireEvent.click(screen.getByRole('button', { name: TEXTOS.acoes.mostrarMais(PASSO) }));

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2 * PASSO));
  });

  it('busca "petr" filtra a lista, e a busca sem acento também funciona', async () => {
    renderizar(<SecaoAcoes />, { rota: '/?vista=lista' });
    await linhas();
    const busca = screen.getByLabelText(TEXTOS.acoes.busca);

    fireEvent.change(busca, { target: { value: 'petr' } });
    expect(screen.getByRole('link', { name: 'PETR4' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'VALE3' })).not.toBeInTheDocument();

    fireEvent.change(busca, { target: { value: 'petrobrás' } });
    expect(screen.getByRole('link', { name: 'PETR4' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'VALE3' })).not.toBeInTheDocument();
  });

  it('aba "Minha lista" vazia mostra o texto de lista vazia', async () => {
    renderizar(<SecaoAcoes />, { rota: '/?filtro=minha&vista=lista' });

    expect(await screen.findByText(porNivel(TEXTOS.acoes.listaVazia, 'simples'))).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('aba "Minha lista" mostra só as ações guardadas', async () => {
    localStorage.setItem(CHAVE_LISTA, '["PETR4"]');
    renderizar(<SecaoAcoes />, { rota: '/?filtro=minha&vista=lista' });

    const itens = await linhas();
    expect(itens).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'PETR4' })).toBeInTheDocument();
  });

  it('rota com ?filtro=atencao abre com a aba Atenção selecionada', async () => {
    renderizar(<SecaoAcoes />, { rota: '/?filtro=atencao&vista=lista' });

    const aba = await screen.findByRole('tab', { name: new RegExp(TEXTOS.acoes.filtro.atencao) });
    expect(aba).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: new RegExp(TEXTOS.acoes.filtro.todas) })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('o ticker linka para a página da ação', async () => {
    renderizar(<SecaoAcoes />, { rota: '/?vista=lista' });
    await linhas();
    fireEvent.change(screen.getByLabelText(TEXTOS.acoes.busca), { target: { value: 'petr4' } });

    expect(screen.getByRole('link', { name: 'PETR4' })).toHaveAttribute('href', '/acao/PETR4');
  });

  it('?vista=tabela antigo cai em "Todas as ações" e mantém o filtro', async () => {
    renderizar(
      <>
        <SecaoAcoes />
        <Endereco />
      </>,
      { rota: '/acoes?filtro=atencao&vista=tabela' },
    );

    expect(await screen.findByRole('button', { name: TEXTOS.acoes.vista.lista })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('tab', { name: new RegExp(TEXTOS.acoes.filtro.atencao) })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: TEXTOS.acoes.vista.destaques }));

    expect(screen.getByRole('button', { name: TEXTOS.acoes.vista.destaques })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByLabelText('endereco')).toHaveTextContent('?filtro=atencao');
    expect(screen.getByLabelText('endereco')).not.toHaveTextContent('vista=');
  });

  it('no nível Técnica, sem ?vista, "Todas as ações" traz P/L e DY e nenhuma tabela', async () => {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizar(<SecaoAcoes />);

    expect(await linhas()).toHaveLength(PASSO);
    expect(screen.getByRole('button', { name: TEXTOS.acoes.vista.lista })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getAllByText(TEXTOS.acoes.colunas.pl).length).toBeGreaterThan(0);
    expect(screen.getAllByText(TEXTOS.acoes.colunas.dy).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: TEXTOS.acoes.vista.destaques }));
    expect(await screen.findByRole('list', { name: TEXTOS.acoes.destaqueGrade })).toBeInTheDocument();
  });

  it('no nível Simples, sem ?vista, abre nos destaques: um cartão por setor, com filtros e busca à vista', async () => {
    renderizar(<SecaoAcoes />);

    const grade = await screen.findByRole('list', { name: TEXTOS.acoes.destaqueGrade });
    const cartoes = within(grade).getAllByRole('listitem');
    const setores = cartoes.map((c) => c.querySelector('.destaque__setor').textContent);
    expect(cartoes.length).toBeGreaterThan(1);
    expect(new Set(setores).size).toBe(setores.length);
    expect(cartoes[0].querySelector('.destaque__setor .icone-setor')).not.toBeNull();
    expect(within(cartoes[0]).getByRole('link')).toHaveAttribute('href', expect.stringMatching(/^\/acao\//));
    expect(screen.getByRole('button', { name: TEXTOS.acoes.vista.destaques })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByLabelText(TEXTOS.acoes.busca)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('buscar nos destaques leva para "Todas as ações" com o termo', async () => {
    renderizar(
      <>
        <SecaoAcoes />
        <Endereco />
      </>,
    );
    await screen.findByRole('list', { name: TEXTOS.acoes.destaqueGrade });

    fireEvent.change(screen.getByLabelText(TEXTOS.acoes.busca), { target: { value: 'petr' } });

    expect(await screen.findByRole('link', { name: 'PETR4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: TEXTOS.acoes.vista.lista })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('endereco')).toHaveTextContent('vista=lista');
    expect(screen.getByLabelText(TEXTOS.acoes.busca)).toHaveValue('petr');
  });

  it('a vista "Todas as ações" mantém filtros e busca e grava ?vista=lista', async () => {
    renderizar(
      <>
        <SecaoAcoes />
        <Endereco />
      </>,
    );
    await screen.findByRole('list', { name: TEXTOS.acoes.destaqueGrade });

    fireEvent.click(screen.getByRole('button', { name: TEXTOS.acoes.vista.lista }));

    expect(await linhas()).toHaveLength(PASSO);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByLabelText(TEXTOS.acoes.busca)).toBeInTheDocument();
    expect(screen.getByLabelText('endereco')).toHaveTextContent('?vista=lista');
  });

  it('a legenda fixa mostra o número de checagens e os três selos', async () => {
    renderizar(<SecaoAcoes />, { rota: '/?vista=lista' });
    await linhas();

    expect(REGRAS.length).toBeGreaterThan(0);
    expect(screen.getByText(TEXTOS.acoes.legenda.checagens(REGRAS.length))).toBeInTheDocument();
    for (const tipo of ['forte', 'atencao', 'contexto']) {
      expect(screen.getByText(TEXTOS.acoes.legenda.nome[tipo])).toBeInTheDocument();
    }
  });

  it('os selos de sinais dizem a contagem por extenso, no singular e no plural', () => {
    expect(TEXTOS.acoes.pontosAFavor(1)).toBe('1 ponto a favor');
    expect(TEXTOS.acoes.pontosAFavor(2)).toBe('2 pontos a favor');
    expect(TEXTOS.acoes.pontosDeAtencao(1)).toBe('1 ponto de atenção');
    expect(TEXTOS.acoes.pontosDeAtencao(3)).toBe('3 pontos de atenção');
    expect(TEXTOS.acoes.fatosDeContexto(1)).toBe('1 fato de contexto');
    expect(TEXTOS.acoes.fatosDeContexto(2)).toBe('2 fatos de contexto');
  });

  it('cada filtro explica o que mostra no title e numa linha abaixo do controle', async () => {
    renderizar(<SecaoAcoes />, { rota: '/?filtro=forte&vista=lista' });

    const aba = await screen.findByRole('tab', { name: new RegExp(TEXTOS.acoes.filtro.forte) });
    expect(aba).toHaveAttribute('title', porNivel(TEXTOS.acoes.filtroExplica.forte, 'simples'));
    expect(screen.getByText(porNivel(TEXTOS.acoes.filtroExplica.forte, 'simples'))).toBeInTheDocument();
  });
});
