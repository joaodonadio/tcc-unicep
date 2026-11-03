import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Mascote from '../../components/ui/Mascote.jsx';

describe('Mascote Pavio', () => {
  it('sem rótulo, é decorativo: aria-hidden e fora do foco', () => {
    const { container } = render(<Mascote />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('com rótulo, é uma imagem com nome', () => {
    render(<Mascote humor="contente" rotulo="Pavio contente" />);
    const imagem = screen.getByRole('img', { name: 'Pavio contente' });
    expect(imagem).not.toHaveAttribute('aria-hidden');
  });

  it('põe as classes de humor, de ação e a extra', () => {
    const { container } = render(<Mascote humor="atento" acao="acenando" className="extra" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('mascote', 'mascote--atento', 'mascote--acenando', 'extra');
  });

  it('ação vivo gera a classe mascote--vivo', () => {
    const { container } = render(<Mascote humor="contente" acao="vivo" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('mascote--contente', 'mascote--vivo');
  });

  it('humor inválido cai no neutro, e ação inválida é ignorada', () => {
    const { container } = render(<Mascote humor="feliz" acao="pulando" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('mascote--neutro');
    expect(svg).not.toHaveClass('mascote--feliz');
    expect(svg).not.toHaveClass('mascote--pulando');
  });

  it('dois mascotes na mesma página têm ids de clipPath diferentes e sem dois-pontos', () => {
    const { container } = render(
      <>
        <Mascote />
        <Mascote />
      </>,
    );
    const ids = [...container.querySelectorAll('clipPath')].map((clip) => clip.id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids[0]).not.toMatch(/:/);
  });
});
