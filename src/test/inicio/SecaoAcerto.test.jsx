import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import SecaoAcerto from '../../components/inicio/SecaoAcerto.jsx';
import { TEXTOS } from '../../lib/textos.js';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';

describe('SecaoAcerto', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('sem histórico mostra a espera e a régua do acaso', async () => {
    renderizar(<SecaoAcerto />);

    expect(await screen.findByRole('heading', { level: 3, name: TEXTOS.acerto.esperaTitulo })).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.acerto.esperaTexto)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: TEXTOS.acerto.titulo })).toBeInTheDocument();
  });
});
