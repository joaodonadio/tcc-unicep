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
});
