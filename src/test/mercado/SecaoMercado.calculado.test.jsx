import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import SecaoMercado from '../../components/mercado/SecaoMercado.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

// Arquivo próprio: o cache de pacotes da fonte vale por arquivo de teste.
describe('SecaoMercado: índices completados pela série', () => {
  beforeEach(() => {
    const original = instalarFetchDados().getMockImplementation();
    // O pacote do dia sem o 1 mês do IVVB11: a série diária (252 pregões) completa o número.
    vi.stubGlobal(
      'fetch',
      vi.fn(async (entrada) => {
        const resp = await original(entrada);
        if (!String(entrada?.url ?? entrada).includes('mercado_dia')) return resp;
        const dados = await resp.json();
        const reg = dados.registros[0];
        reg.indices.IVVB11.m1 = { valor: null, status: 'historico_insuficiente' };
        return { ...resp, json: async () => dados };
      }),
    );
  });

  it('marca com asterisco o que veio do cálculo e explica na nota', async () => {
    renderizar(<SecaoMercado />);

    const tabela = await screen.findByRole('table', { name: TEXTOS.mercado.tabelaTitulo });
    expect(await screen.findByText(new RegExp(TEXTOS.mercado.calculadoNota.slice(0, 30)), { selector: 'p' })).toBeInTheDocument();
    expect(within(tabela).getAllByText(TEXTOS.mercado.calculadoSr).length).toBeGreaterThan(0);
  });
});
