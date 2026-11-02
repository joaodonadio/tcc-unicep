import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import SecaoMercado from '../../components/mercado/SecaoMercado.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

const TEMPO_ERRO = { timeout: 4000 };

/** Série SGS de teste: a Selic de 12 meses atrás e a atual, ou o dólar nas mesmas datas. */
const SERIES_BCB = {
  432: [
    { data: '27/10/2025', valor: '14.25' },
    { data: '28/10/2025', valor: '14.50' },
    { data: '27/10/2026', valor: '15.00' },
  ],
  1: [
    { data: '27/10/2025', valor: '5.0000' },
    { data: '27/10/2026', valor: '5.2500' },
  ],
};

const aba = (chave) => screen.getByRole('tab', { name: TEXTOS.mercado.abas[chave] });

describe('SecaoMercado: Ibovespa e juros', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('preenche 1 mês, 6 meses e 1 ano do Ibovespa com a rentabilidade do resumo', async () => {
    renderizar(<SecaoMercado />);

    const tabela = await screen.findByRole('table', { name: TEXTOS.mercado.tabelaTitulo });
    const linha = within(tabela).getByRole('rowheader', { name: /^Ibovespa/ }).closest('tr');
    const celulas = within(linha).getAllByRole('cell').map((c) => c.textContent);

    // Hoje, 1 mês, 6 meses, 1 ano (ABEV3 traz o Ibovespa com estes valores)
    expect(celulas[1]).toContain('+8,9%');
    expect(celulas[2]).toContain('+6,7%');
    expect(celulas[3]).toContain('+43,5%');
  });

  it('dólar e Brent seguem indisponíveis nos três períodos', async () => {
    renderizar(<SecaoMercado />);

    const tabela = await screen.findByRole('table', { name: TEXTOS.mercado.tabelaTitulo });
    for (const nome of [/^Dólar/, /^Petróleo Brent/]) {
      const linha = within(tabela).getByRole('rowheader', { name: nome }).closest('tr');
      const periodos = within(linha).getAllByRole('cell').slice(1);
      expect(periodos).toHaveLength(3);
      for (const celula of periodos) {
        expect(celula.textContent).toContain(TEXTOS.mercado.indisponivel);
      }
    }
  });

  it('mostra a frase do pregão no topo, só com fatos', async () => {
    renderizar(<SecaoMercado />);

    expect(await screen.findByText(/^\d+ ações? acompanhadas?\. Dia (volátil|estável)\.$/)).toBeInTheDocument();
  });

  it('sem resposta do Banco Central, os dois blocos de juros mostram o erro e o resto da seção segue', async () => {
    const { container } = renderizar(<SecaoMercado />);

    fireEvent.click(aba('juros'));

    expect(await screen.findByRole('heading', { level: 3, name: TEXTOS.mercado.jurosTitulo })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(TEXTOS.mercado.bcbErro)).toHaveLength(2), TEMPO_ERRO);

    fireEvent.click(aba('indices'));
    expect(await screen.findByRole('table', { name: TEXTOS.mercado.tabelaTitulo })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('com a série do Banco Central, mostra a Selic e o dólar com a frase de resumo e a fonte', async () => {
    const base = instalarFetchDados();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (entrada, opcoes) => {
        const url = String(entrada?.url ?? entrada);
        const casa = /bcdata\.sgs\.(\d+)\//.exec(url);
        if (casa) return { ok: true, status: 200, json: async () => SERIES_BCB[casa[1]] };
        return base(entrada, opcoes);
      }),
    );

    renderizar(<SecaoMercado />);

    fireEvent.click(aba('juros'));

    expect(
      await screen.findByText('Selic hoje: 15,00% ao ano. Há 12 meses: 14,25%.', {}, TEMPO_ERRO),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Dólar PTAX: R$ 5,25. Há 12 meses: R$ 5,00 (variação +5,0%).'),
    ).toBeInTheDocument();
    expect(screen.getAllByText(TEXTOS.mercado.fonteBcb)).toHaveLength(2);
  });
});
