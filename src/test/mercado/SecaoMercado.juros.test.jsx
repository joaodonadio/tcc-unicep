import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import SecaoMercado from '../../components/mercado/SecaoMercado.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

describe('SecaoMercado: Ibovespa, dólar e Brent', () => {
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

  it('dólar e Brent sem série: a nota explica os períodos sem número', async () => {
    renderizar(<SecaoMercado />);
    expect(await screen.findByText(TEXTOS.mercado.semHistoricoNota('dólar e Brent'))).toBeInTheDocument();
  });
});
