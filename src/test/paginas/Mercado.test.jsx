import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import Mercado from '../../pages/Mercado.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

describe('Mercado', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('mostra o título da página, os índices, o dólar e os juros, sem abas nem destaques', async () => {
    const { container } = renderizar(<Mercado />);

    expect(screen.getByRole('heading', { level: 1, name: TEXTOS.mercado.titulo })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.mercado.indicesTitulo })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.mercado.juros.tituloSerie.simples }, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByText('Ver todos os setores')).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });
});
