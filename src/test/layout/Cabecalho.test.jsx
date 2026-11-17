import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import Cabecalho from '../../components/layout/Cabecalho.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

// a agenda de proventos não é o foco destes testes; evita rede
vi.mock('../../hooks/useAgenda.js', () => ({
  useAgendaProventos: () => ({ data: undefined }),
}));

// a análise do dia é trocada por teste, para cobrir o aviso de atualização que falhou
const analise = vi.hoisted(() => ({ atual: undefined }));
vi.mock('../../hooks/useMetaPublicacao.js', () => ({
  useMetaPublicacao: () => ({ data: analise.atual }),
}));

const CHAVE_PREFS = 'painel-b3:preferencias';

/** Abre o painel Leitura, que começa fechado. */
function abrirLeitura() {
  const botao = screen.getByRole('button', { name: TEXTOS.leitura.botao });
  fireEvent.click(botao);
  return botao;
}

describe('Cabecalho', () => {
  beforeEach(() => {
    instalarFetchDados();
    localStorage.clear();
    analise.atual = undefined;
  });

  it('monta as oito páginas do menu, na ordem, com os hrefs certos', () => {
    renderizar(<Cabecalho />);
    const nav = screen.getByRole('navigation', { name: TEXTOS.cabecalho.navegacao });
    const paginas = TEXTOS.cabecalho.paginas;

    expect(nav.querySelectorAll('a')).toHaveLength(8);
    expect([...nav.querySelectorAll('a')].map((a) => a.textContent)).toEqual([
      paginas.hoje,
      paginas.mercado,
      paginas.setores,
      paginas.acoes,
      paginas.proventos,
      paginas.noticias,
      paginas.modelo,
      paginas.dados,
    ]);
    expect(screen.getByRole('link', { name: paginas.hoje })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: paginas.mercado })).toHaveAttribute('href', '/mercado');
    expect(screen.getByRole('link', { name: paginas.setores })).toHaveAttribute('href', '/setores');
    expect(screen.getByRole('link', { name: paginas.acoes })).toHaveAttribute('href', '/acoes');
    expect(screen.getByRole('link', { name: paginas.proventos })).toHaveAttribute('href', '/proventos');
    expect(screen.getByRole('link', { name: paginas.noticias })).toHaveAttribute('href', '/noticias');
    expect(screen.getByRole('link', { name: paginas.modelo })).toHaveAttribute('href', '/modelo');
    expect(screen.getByRole('link', { name: paginas.dados })).toHaveAttribute('href', '/dados');
  });

  it('marca como atual (aria-current="page") a página da rota', () => {
    renderizar(<Cabecalho />, { rota: '/mercado' });
    expect(screen.getByRole('link', { name: TEXTOS.cabecalho.paginas.mercado })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: TEXTOS.cabecalho.paginas.hoje })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('Hoje só fica atual na rota "/", não nas outras páginas', () => {
    renderizar(<Cabecalho />, { rota: '/acoes' });
    expect(screen.getByRole('link', { name: TEXTOS.cabecalho.paginas.acoes })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: TEXTOS.cabecalho.paginas.hoje })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('o cabeçalho não mostra mais a data do pregão nem o termo Pregão', () => {
    analise.atual = { data_referencia: '2026-10-29', gerado_em: '2026-10-30T11:15:00-03:00' };
    renderizar(<Cabecalho />);

    expect(screen.queryByRole('button', { name: 'Pregão' })).not.toBeInTheDocument();
    expect(screen.queryByText(/publicado em/)).not.toBeInTheDocument();
  });

  it('sem atualização com falha, o cabeçalho não mostra aviso', () => {
    analise.atual = { status_execucao: 'ok', data_referencia: '2026-10-29' };
    renderizar(<Cabecalho />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('com atualização que falhou, o aviso aparece numa faixa própria, com a data e o link para os dados', () => {
    analise.atual = { status_execucao: 'falhou', data_referencia: '2026-10-29' };
    renderizar(<Cabecalho />);
    const aviso = screen.getByRole('status');
    expect(aviso).toHaveTextContent(/A atualização de hoje não chegou/);
    expect(aviso).toHaveTextContent('29/10/2026');
    expect(within(aviso).getByRole('link', { name: TEXTOS.cabecalho.avisoDetalhes })).toHaveAttribute('href', '/dados');
  });

  it('o botão Leitura abre o painel com aria-expanded e Esc fecha e devolve o foco ao botão', async () => {
    renderizar(<Cabecalho />);
    const botao = screen.getByRole('button', { name: TEXTOS.leitura.botao });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: TEXTOS.leitura.rotulo })).not.toBeInTheDocument();

    fireEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: TEXTOS.leitura.rotulo })).toBeVisible();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    // o painel sai com animação: fica no DOM (oculto) até o fim da saída
    await waitFor(() => expect(screen.queryByRole('region', { name: TEXTOS.leitura.rotulo })).not.toBeInTheDocument());
    expect(botao).toHaveFocus();
  });

  it('clicar fora do painel Leitura fecha o painel', () => {
    renderizar(<Cabecalho />);
    const botao = abrirLeitura();
    expect(botao).toHaveAttribute('aria-expanded', 'true');

    fireEvent.pointerDown(document.body);
    expect(botao).toHaveAttribute('aria-expanded', 'false');
  });

  it('Simples é o padrão e só a descrição do modo escolhido aparece', () => {
    renderizar(<Cabecalho />);
    abrirLeitura();
    expect(screen.getByRole('button', { name: TEXTOS.leitura.simples })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText(TEXTOS.leitura.dicaSimples)).toBeInTheDocument();
    expect(screen.queryByText(TEXTOS.leitura.dicaTecnica)).not.toBeInTheDocument();
  });

  it('o botão Como usar no painel leva ao bloco da página inicial', () => {
    renderizar(<Cabecalho />);
    abrirLeitura();
    expect(screen.getByRole('link', { name: TEXTOS.cabecalho.comoUsar })).toHaveAttribute(
      'href',
      '/#como-usar',
    );
  });

  it('o menu Mais abre com as páginas extras e o glossário, e fecha com Esc', () => {
    renderizar(<Cabecalho />);
    const mais = screen.getByRole('button', { name: TEXTOS.cabecalho.maisRotulo });
    expect(mais).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(mais);
    expect(mais).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('button', { name: 'Glossário' })).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mais).toHaveAttribute('aria-expanded', 'false');
  });

  it('Modo simples e Modo técnico alternam aria-pressed', () => {
    renderizar(<Cabecalho />);
    abrirLeitura();
    const simples = screen.getByRole('button', { name: TEXTOS.leitura.simples });
    const tecnica = screen.getByRole('button', { name: TEXTOS.leitura.tecnica });

    expect(simples).toHaveAttribute('aria-pressed', 'true');
    expect(tecnica).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(tecnica);

    expect(simples).toHaveAttribute('aria-pressed', 'false');
    expect(tecnica).toHaveAttribute('aria-pressed', 'true');
  });

  it('A− fica desativado no tamanho mínimo', () => {
    localStorage.setItem(CHAVE_PREFS, JSON.stringify({ nivel: 'simples', zoom: 1 }));
    renderizar(<Cabecalho />);
    abrirLeitura();
    const diminuir = screen.getByRole('button', { name: TEXTOS.leitura.diminuir });
    expect(diminuir).toBeEnabled();

    fireEvent.click(diminuir);

    expect(diminuir).toBeDisabled();
    expect(screen.getByRole('button', { name: TEXTOS.leitura.aumentar })).toBeEnabled();
  });
});
