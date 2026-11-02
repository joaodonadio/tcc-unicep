import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import Mercado from '../../pages/Mercado.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

vi.mock('../../hooks/useTraducao.js', () => ({ useTraducao: () => ({ data: null }) }));

describe('Mercado', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('mostra o título da página, não tem mais a aba Setores e leva à página de setores pela aba Destaques', async () => {
    const { container } = renderizar(<Mercado />);

    expect(screen.getByRole('heading', { level: 1, name: TEXTOS.mercado.titulo })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /setores/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: TEXTOS.mercado.abas.destaques }));
    expect(await screen.findByRole('link', { name: TEXTOS.setores.verTodos })).toHaveAttribute('href', '/setores');

    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });
});
