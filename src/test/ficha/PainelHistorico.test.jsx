import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { PainelHistorico } from '../../components/ficha/PainelHistorico.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS } from '../../lib/textos.js';

const HISTORICO = {
  datas: ['2026-10-20', '2026-10-21'],
  valores: [10, 12],
  motivos: [null, null],
};

vi.mock('../../hooks/useDados.js', () => ({
  useHistoricoCampo: () => ({
    data: { datas: ['2026-10-20', '2026-10-21'], valores: [10, 12], motivos: [null, null] },
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
    refetch: () => {},
  }),
}));

const CHAVE_PREFERENCIAS = 'painel-b3:preferencias';

const opcoesIndicador = () =>
  within(screen.getByRole('combobox', { name: TEXTOS.ficha.indicador }))
    .getAllByRole('option')
    .map((o) => o.textContent);

describe('histórico da ficha nos dois níveis', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('no simples mostra só P/L, P/VP e dividend yield, sem "Como estava em"', () => {
    renderizar(<PainelHistorico ticker="PETR4" />);
    expect(screen.queryByRole('heading', { name: TEXTOS.ficha.comoEstava })).not.toBeInTheDocument();
    expect(opcoesIndicador()).toEqual(['P/L', 'P/VP', 'Dividend yield']);
  });

  it('no técnico mostra "Como estava em" e os cinco indicadores', () => {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizar(<PainelHistorico ticker="PETR4" />);
    expect(screen.getByRole('heading', { name: TEXTOS.ficha.comoEstava })).toBeInTheDocument();
    expect(opcoesIndicador()).toEqual(['Cotação', 'P/L', 'P/VP', 'Dividend yield', 'ROE']);
  });

  it('no simples a evolução começa em P/L, pois a cotação não está na lista simples', () => {
    renderizar(<PainelHistorico ticker="PETR4" />);
    expect(screen.getByRole('combobox', { name: TEXTOS.ficha.indicador })).toHaveValue('pl');
  });

  it('o histórico guardado aparece com os dias de publicações', () => {
    renderizar(<PainelHistorico ticker="PETR4" />);
    expect(screen.getByText(TEXTOS.ficha.historicoDias(HISTORICO.datas.length, 'PETR4'))).toBeInTheDocument();
  });
});
