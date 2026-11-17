import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Carregador, EsqueletoGrafico } from '../../components/ui/Estados.jsx';
import { TEXTOS } from '../../lib/textos.js';

describe('Carregador', () => {
  it('é uma região de status com o rótulo padrão visível', () => {
    render(<Carregador />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText(TEXTOS.estados.carregando)).not.toHaveClass('sr-only');
  });

  it('aceita um rótulo próprio', () => {
    render(<Carregador rotulo="Buscando as notícias" />);
    expect(screen.getByRole('status')).toHaveTextContent('Buscando as notícias');
  });

  it('compacto mantém o texto só para leitor de tela', () => {
    render(<Carregador compacto rotulo="Carregando os setores." />);
    expect(screen.getByText('Carregando os setores.')).toHaveClass('sr-only');
  });

  it('tem três barras decorativas, fora da árvore de acessibilidade', () => {
    const { container } = render(<Carregador />);
    const barras = container.querySelector('.carregador__barras');
    expect(barras).toHaveAttribute('aria-hidden', 'true');
    expect(barras.children).toHaveLength(3);
  });
});

describe('EsqueletoGrafico', () => {
  it('é uma região de status com o texto para leitor de tela e um esqueleto de altura reservada', () => {
    const { container } = render(<EsqueletoGrafico />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.estados.carregando)).toHaveClass('sr-only');
    const esqueleto = container.querySelector('.esqueleto');
    expect(esqueleto).toHaveAttribute('aria-hidden', 'true');
    expect(esqueleto).toHaveStyle({ height: '16rem' });
  });

  it('aceita altura e rótulo próprios', () => {
    const { container } = render(<EsqueletoGrafico altura="12rem" rotulo="Carregando os pagamentos" />);
    expect(container.querySelector('.esqueleto')).toHaveStyle({ height: '12rem' });
    expect(screen.getByText('Carregando os pagamentos')).toHaveClass('sr-only');
  });
});
