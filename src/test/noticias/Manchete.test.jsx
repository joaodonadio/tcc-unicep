import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Manchete } from '../../components/noticias/Manchete.jsx';

describe('Manchete', () => {
  it('mostra o título como veio, sem tradução nem rótulo', () => {
    render(<Manchete titulo="Petrobras rises" />);
    expect(screen.getByText('Petrobras rises')).toBeTruthy();
    expect(screen.queryByText(/tradução/)).toBeNull();
  });

  it('título ausente vira texto vazio, sem "undefined"', () => {
    const { container } = render(<Manchete titulo={undefined} />);
    expect(container.textContent).toBe('');
  });

  it('dentro de um link só gera elementos inline (SPAN)', () => {
    const { container } = render(
      <a href="#">
        <Manchete titulo="Petrobras rises" />
      </a>,
    );
    const filhos = Array.from(container.querySelector('a').querySelectorAll('*'));
    expect(filhos.length).toBeGreaterThan(0);
    expect(filhos.every((el) => el.tagName === 'SPAN')).toBe(true);
  });
});
