import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Mascote from '../../components/ui/Mascote.jsx';

describe('Mascote Cotinha', () => {
  it('sem rótulo, é decorativo: aria-hidden e fora do foco', () => {
    const { container } = render(<Mascote />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('com rótulo, é uma imagem com nome', () => {
    render(<Mascote humor="contente" rotulo="Cotinha contente" />);
    const imagem = screen.getByRole('img', { name: 'Cotinha contente' });
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

  it('os quatro humores novos renderizam com a classe e decorativos', () => {
    for (const humor of ['animado', 'preocupado', 'surpreso', 'curioso']) {
      const { container, unmount } = render(<Mascote humor={humor} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('mascote', `mascote--${humor}`);
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      unmount();
    }
  });

  it('o surpreso tem a boca em "o" e o curioso tem um olho maior', () => {
    const { container: surpreso, unmount } = render(<Mascote humor="surpreso" />);
    expect(surpreso.querySelectorAll('.mascote-olhar > ellipse')).toHaveLength(1);
    unmount();

    const { container: curioso } = render(<Mascote humor="curioso" />);
    const escalados = [...curioso.querySelectorAll('.mascote-olhos > g')].filter((g) =>
      g.getAttribute('transform')?.includes('scale(1.18)'),
    );
    expect(escalados).toHaveLength(1);
  });

  it('corpo e pavios numa cor só, sem lateral escura', () => {
    const { container } = render(<Mascote />);
    const cores = [...container.querySelectorAll('.mascote-corpo > rect, .mascote-corpo > line')].map(
      (el) => el.getAttribute('fill') ?? el.getAttribute('stroke'),
    );
    expect(cores.length).toBeGreaterThan(0);
    expect(new Set(cores)).toEqual(new Set(['var(--cor-mascote)']));
    expect(container.querySelector('clipPath')).toBeNull();
  });
});
