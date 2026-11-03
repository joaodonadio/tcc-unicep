import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import Hoje from '../../pages/Hoje.jsx';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';

describe('Hoje', () => {
  beforeEach(() => {
    instalarFetchDados();
    localStorage.clear();
  });

  it('monta o bloco Como usar e o painel do pregão, cada um com seu título', async () => {
    renderizar(<Hoje />);

    expect(screen.getByRole('heading', { level: 2, name: porNivel(TEXTOS.comoUsar.titulo, 'simples') })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: /Top 5 para estudar hoje/i })).toBeInTheDocument();
  });
});
