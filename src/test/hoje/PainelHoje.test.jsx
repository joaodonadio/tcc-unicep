import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import PainelHoje from '../../components/hoje/PainelHoje.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

vi.mock('../../components/modelos3d/Modelo3D.jsx', () => ({ default: () => null }));

describe('PainelHoje', () => {
  beforeEach(() => {
    // fetch de teste: só os pacotes de public/dados (a API privada)
    instalarFetchDados();
  });

  it('mostra o título do pregão e nenhum NaN ou undefined', async () => {
    const { container } = renderizar(<PainelHoje />);

    expect(await screen.findByRole('heading', { level: 2, name: /Como foi a bolsa em/ })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('mostra os cinco números do dia com rótulo e valor', async () => {
    renderizar(<PainelHoje />);

    const faixa = await screen.findByRole('region', { name: porNivel(TEXTOS.hoje.numeros, 'simples') });
    for (const rotulo of [
      porNivel(TEXTOS.hoje.ibovespa, 'simples'),
      porNivel(TEXTOS.hoje.dolar, 'simples'),
      porNivel(TEXTOS.hoje.cdi, 'simples'),
      porNivel(TEXTOS.hoje.ipca, 'simples'),
      porNivel(TEXTOS.hoje.amplitude, 'simples'),
    ]) {
      expect(await within(faixa).findByText(rotulo)).toBeInTheDocument();
    }

    // o dólar vem só do pacote do pregão: valor em reais, nunca zero
    const dolar = (await within(faixa).findByText(porNivel(TEXTOS.hoje.dolar, 'simples'))).closest('.hoje-numero');
    await vi.waitFor(() => expect(dolar.textContent).toMatch(/R\$ \d/));
    // cinco buscas encadeadas: sob a suíte inteira passa dos 5 s padrão
  }, 15000);

  it('mostra os títulos dos blocos', async () => {
    renderizar(<PainelHoje />);

    expect(await screen.findByRole('heading', { level: 2, name: porNivel(TEXTOS.hoje.numeros, 'simples') })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: porNivel(TEXTOS.hoje.graficoTitulo, 'simples') })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: porNivel(TEXTOS.hoje.destaquesTitulo, 'simples') })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: porNivel(TEXTOS.hoje.proventosTitulo, 'simples') })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: porNivel(TEXTOS.hoje.noticiasTitulo, 'simples') })).toBeInTheDocument();
  });

  it('leva às páginas completas pelos links "Ver"', async () => {
    renderizar(<PainelHoje />);

    await screen.findByRole('heading', { level: 2, name: /Como foi a bolsa em/ });
    expect(await screen.findByRole('link', { name: TEXTOS.hoje.verMercado })).toHaveAttribute('href', '/mercado');
    expect(await screen.findByRole('link', { name: TEXTOS.hoje.verAcoes })).toHaveAttribute('href', '/acoes');
    expect(await screen.findByRole('link', { name: TEXTOS.hoje.verProventos })).toHaveAttribute('href', '/proventos');
    expect(await screen.findByRole('link', { name: TEXTOS.hoje.verNoticias })).toHaveAttribute('href', '/noticias');
  });
});
