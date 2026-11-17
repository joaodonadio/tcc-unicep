import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import ComoUsar from '../../components/hoje/ComoUsar.jsx';
import Cabecalho from '../../components/layout/Cabecalho.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const CHAVE_FECHADO = 'painel-b3:como-usar-fechado';

const titulo = () => screen.queryByRole('heading', { level: 2, name: porNivel(TEXTOS.comoUsar.titulo, 'simples') });

describe('ComoUsar', () => {
  beforeEach(() => {
    instalarFetchDados();
    localStorage.clear();
  });

  it('abre na primeira visita, com público, dicas, dicionário e cinco passos', () => {
    const { container } = renderizar(<ComoUsar />);

    expect(titulo()).toBeInTheDocument();
    expect(screen.getByText(porNivel(TEXTOS.comoUsar.publico, 'simples'))).toBeInTheDocument();
    for (const dica of porNivel(TEXTOS.comoUsar.dicas, 'simples')) {
      expect(screen.getByText(dica)).toBeInTheDocument();
    }
    expect(
      screen.getByRole('heading', { level: 3, name: porNivel(TEXTOS.comoUsar.dicionario.titulo, 'simples') }),
    ).toBeInTheDocument();
    for (const verbete of porNivel(TEXTOS.comoUsar.dicionario.verbetes, 'simples')) {
      expect(screen.getByText(verbete.significado)).toBeInTheDocument();
    }
    const passos = container.querySelector('.como-usar__passos');
    expect(within(passos).getAllByRole('listitem')).toHaveLength(5);
  });

  it('a frase antes dos passos muda com o nível: simples e técnico', () => {
    const { unmount } = renderizar(<ComoUsar />);
    expect(screen.getByText(TEXTOS.comoUsar.comoNavegar.simples)).toBeInTheDocument();
    unmount();

    localStorage.setItem('painel-b3:preferencias', JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizar(<ComoUsar />);
    expect(screen.getByText(TEXTOS.comoUsar.comoNavegar.tecnico)).toBeInTheDocument();
    expect(screen.queryByText(TEXTOS.comoUsar.comoNavegar.simples)).not.toBeInTheDocument();
    localStorage.removeItem('painel-b3:preferencias');
  });

  it('cada passo é um link: o primeiro vai à lista do Top 5 e os outros às páginas, na ordem', () => {
    renderizar(<ComoUsar />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
    expect(links[0].getAttribute('href')).toMatch(/#top5$/);
    expect(links[1]).toHaveAttribute('href', '/mercado');
    expect(links[2]).toHaveAttribute('href', '/setores');
    expect(links[3]).toHaveAttribute('href', '/acoes');
    expect(links[4]).toHaveAttribute('href', '/proventos');
  });

  it('sem IntersectionObserver os passos já aparecem, e cada um traz ilustração escondida da leitura', () => {
    const { container } = renderizar(<ComoUsar />);

    const passos = container.querySelector('.como-usar__passos');
    expect(passos).toHaveAttribute('data-visivel', 'true');
    for (const passo of within(passos).getAllByRole('listitem')) {
      expect(passo.querySelector('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('a dica do sublinhado e os verbetes usam o botão de termo', () => {
    renderizar(<ComoUsar />);

    expect(screen.getByRole('button', { name: 'dividendo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'pregão' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'B3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ações' })).toBeInTheDocument();
  });

  it('o X esconde o bloco e grava a escolha no localStorage', () => {
    renderizar(<ComoUsar />);

    fireEvent.click(screen.getByRole('button', { name: TEXTOS.comoUsar.fechar }));

    expect(titulo()).not.toBeInTheDocument();
    expect(localStorage.getItem(CHAVE_FECHADO)).toBe('1');
  });

  it('segue fechado em uma nova visita', () => {
    localStorage.setItem(CHAVE_FECHADO, '1');
    renderizar(<ComoUsar />);

    expect(titulo()).not.toBeInTheDocument();
  });

  it('o link Como usar do cabeçalho reabre o bloco e tira a marca de fechado', () => {
    localStorage.setItem(CHAVE_FECHADO, '1');
    renderizar(
      <>
        <Cabecalho />
        <ComoUsar />
      </>,
    );
    expect(titulo()).not.toBeInTheDocument();

    // o link Como usar fica dentro do painel Leitura, fechado por padrão
    fireEvent.click(screen.getByRole('button', { name: TEXTOS.leitura.botao }));
    fireEvent.click(screen.getByRole('link', { name: TEXTOS.cabecalho.comoUsar }));

    expect(titulo()).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE_FECHADO)).toBeNull();
  });
});
