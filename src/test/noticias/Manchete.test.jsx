import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Manchete } from '../../components/noticias/Manchete.jsx';

const traducao = { data: null };
vi.mock('../../hooks/useTraducao.js', () => ({ useTraducao: () => traducao }));

describe('Manchete', () => {
  it('mostra a tradução em destaque e o original com o rótulo', () => {
    traducao.data = { pt: 'Petrobras sobe', idioma: 'en' };
    render(<Manchete titulo="Petrobras rises" />);
    expect(screen.getByText('Petrobras sobe')).toBeTruthy();
    expect(screen.getByText('original em inglês · tradução automática')).toBeTruthy();
    expect(screen.getByText('Petrobras rises')).toBeTruthy();
  });

  it('sem tradução mostra só o original, sem o rótulo', () => {
    traducao.data = null;
    render(<Manchete titulo="Petrobras rises" />);
    expect(screen.getByText('Petrobras rises')).toBeTruthy();
    expect(screen.queryByText(/tradução automática/)).toBeNull();
  });

  it('idioma português mostra só o original', () => {
    traducao.data = { pt: 'Petrobras sobe', idioma: 'pt' };
    render(<Manchete titulo="Petrobras rises" />);
    expect(screen.getByText('Petrobras rises')).toBeTruthy();
    expect(screen.queryByText('Petrobras sobe')).toBeNull();
  });

  it('dentro de um link só gera elementos inline (SPAN)', () => {
    traducao.data = { pt: 'Petrobras sobe', idioma: 'en' };
    const { container } = render(
      <a href="#">
        <Manchete titulo="Petrobras rises" />
      </a>,
    );
    const link = container.querySelector('a');
    const filhos = Array.from(link.querySelectorAll('*'));
    expect(filhos.length).toBeGreaterThan(0);
    expect(filhos.every((el) => el.tagName === 'SPAN')).toBe(true);
  });
});
