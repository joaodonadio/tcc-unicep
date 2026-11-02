import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { HistoricoAno } from '../../components/ficha/HistoricoAno.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { ROTULO_STATUS, TEXTOS } from '../../lib/textos.js';

// AZUL3 tem trechos de status.pl (lucro negativo e indisponível) dentro do último ano.
const H = TEXTOS.ficha.historicoAno;

describe('Histórico de 1 ano na pergunta "Está cara?"', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('mostra o bloco com abas P/L, P/VP e Dividend yield, e P/L selecionado', async () => {
    renderizar(<HistoricoAno ticker="AZUL3" />);
    expect(await screen.findByRole('heading', { name: H.titulo })).toBeInTheDocument();
    const abas = within(screen.getByRole('tablist', { name: H.abas })).getAllByRole('tab');
    expect(abas.map((a) => a.textContent)).toEqual(['P/L', 'P/VP', 'Dividend yield']);
    expect(screen.getByRole('tab', { name: 'P/L' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'P/VP' })).toHaveAttribute('aria-selected', 'false');
  });

  it('traz a nota de cada trecho sem P/L, com o motivo traduzido', async () => {
    renderizar(<HistoricoAno ticker="AZUL3" />);
    await screen.findByRole('heading', { name: H.titulo });
    expect(
      screen.getByText(H.semValor('P/L', '13/01', '29/01', ROTULO_STATUS.lucro_negativo)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(H.semValor('P/L', '30/01', '30/01', ROTULO_STATUS.indisponivel)),
    ).toBeInTheDocument();
  });

  it('ao trocar de aba, só o indicador escolhido aparece (um por vez); sem valores, diz isso', async () => {
    renderizar(<HistoricoAno ticker="AZUL3" />);
    await screen.findByRole('heading', { name: H.titulo });
    expect(screen.getByRole('img', { name: /P\/L/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'P/VP' }));
    await waitFor(() => expect(screen.getByRole('tab', { name: 'P/VP' })).toHaveAttribute('aria-selected', 'true'));
    expect(screen.getByRole('tab', { name: 'P/L' })).toHaveAttribute('aria-selected', 'false');
    // AZUL3 não tem nenhum P/VP válido no último ano: sem gráfico, com a mensagem.
    expect(screen.queryByRole('img', { name: /P\/L/ })).not.toBeInTheDocument();
    expect(screen.getByText(H.semDado)).toBeInTheDocument();
  });

  it('no simples não mostra o percentil; no técnico mostra', async () => {
    const { unmount } = renderizar(<HistoricoAno ticker="AZUL3" />);
    await screen.findByRole('heading', { name: H.titulo });
    expect(screen.queryByText(H.percentil)).not.toBeInTheDocument();
    unmount();

    localStorage.setItem('painel-b3:preferencias', JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizar(<HistoricoAno ticker="AZUL3" />);
    await screen.findByRole('heading', { name: H.titulo });
    expect(screen.getByText(H.percentil)).toBeInTheDocument();
  });
});
