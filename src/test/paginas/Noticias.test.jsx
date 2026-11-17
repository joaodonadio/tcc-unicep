import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import Noticias from '../../pages/Noticias.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

describe('Noticias', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('mostra o título da página e os cartões de empresas com link para as notícias da ficha', async () => {
    const { container } = renderizar(<Noticias />);

    expect(screen.getByRole('heading', { level: 1, name: porNivel(TEXTOS.paginas.noticiasTitulo, 'simples') })).toBeInTheDocument();

    const titulo = await screen.findByRole('heading', { level: 2, name: porNivel(TEXTOS.dia.empresasTitulo, 'simples') });
    const bloco = titulo.parentElement;

    const linhas = bloco.querySelectorAll('.noticias-barra-linha');
    expect(linhas.length).toBeGreaterThan(0);
    expect(linhas.length).toBeLessThanOrEqual(8);

    const links = within(bloco).getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute('href', expect.stringMatching(/^\/acao\/[A-Z]{4}\d{1,2}\?pergunta=noticias$/));
    }

    // Cada linha tem o texto completo para leitor de tela: número ou palavra de indisponível, nunca 0 por engano.
    for (const linha of linhas) {
      const texto = linha.querySelector('.sr-only').textContent;
      expect(texto).toMatch(/^[A-Z0-9 e,·]+: (\d[\d.]* manchetes?, \d[\d.]* positivas?, \d[\d.]* neutras?, \d[\d.]* negativas?|Indisponível)$/);
    }
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });
});
