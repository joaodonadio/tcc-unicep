import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import Noticias from '../../pages/Noticias.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

vi.mock('../../hooks/useTraducao.js', () => ({ useTraducao: () => ({ data: null }) }));

describe('Noticias', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('mostra o título da página e lista até 8 empresas com mais manchetes, com contagem e link para as notícias da ficha', async () => {
    const { container } = renderizar(<Noticias />);

    expect(screen.getByRole('heading', { level: 1, name: porNivel(TEXTOS.paginas.noticiasTitulo, 'simples') })).toBeInTheDocument();

    const titulo = await screen.findByRole('heading', { level: 3, name: porNivel(TEXTOS.dia.empresasTitulo, 'simples') });
    const bloco = titulo.parentElement;

    const empresas = within(bloco).getAllByRole('link');
    expect(empresas.length).toBeGreaterThan(0);
    expect(empresas.length).toBeLessThanOrEqual(8);
    for (const empresa of empresas) {
      expect(empresa).toHaveAttribute('href', expect.stringMatching(/^\/acao\/[A-Z]{4}\d{1,2}\?pergunta=noticias$/));
    }

    // Tabela: cada linha tem as três contagens. Número é número; ausência vira traço, nunca 0 por engano.
    const celulas = empresas.map((link) =>
      [...link.closest('tr').querySelectorAll('td')].map((celula) => celula.textContent.trim()),
    );
    expect(celulas.every((linha) => linha.length === 3)).toBe(true);
    expect(celulas.flat().every((texto) => /^(\d+|—Indisponível)$/.test(texto))).toBe(true);
    expect(celulas.flat().some((texto) => /^\d+$/.test(texto))).toBe(true);
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });
});
