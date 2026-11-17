import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import NumeroAnimado from '../../components/ui/NumeroAnimado.jsx';

const formatar = (n) => `${Math.round(n)} pts`;

describe('NumeroAnimado', () => {
  it('em teste (sem matchMedia) mostra o valor final direto', () => {
    render(<NumeroAnimado valor={128} formatar={formatar} ausente="sem dado" />);
    expect(screen.getByText('128 pts')).toBeInTheDocument();
  });

  it('valor nulo mostra o texto de ausência, nunca 0', () => {
    render(<NumeroAnimado valor={null} formatar={formatar} ausente="sem dado" />);
    expect(screen.getByText('sem dado')).toBeInTheDocument();
    expect(screen.queryByText('0 pts')).not.toBeInTheDocument();
  });

  it('o zero verdadeiro continua sendo zero', () => {
    render(<NumeroAnimado valor={0} formatar={formatar} ausente="sem dado" />);
    expect(screen.getByText('0 pts')).toBeInTheDocument();
  });

  it('com movimento, o texto para leitor de tela traz o valor formatado', () => {
    const original = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    });
    try {
      const { container, unmount } = render(
        <NumeroAnimado valor={1234} formatar={formatar} ausente="sem dado" />,
      );
      expect(container.querySelector('.counter__sr').textContent).toBe('1.234');
      unmount();
    } finally {
      if (original === undefined) delete window.matchMedia;
      else window.matchMedia = original;
    }
  });
});
