import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import SecaoMercado from '../../components/mercado/SecaoMercado.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

/** Cartão (li) do índice pelo nome visível. */
const cartao = (nome) =>
  waitFor(() => {
    const achado = screen.getAllByText(nome).map((e) => e.closest('.mercado-indice')).find(Boolean);
    if (!achado) throw new Error(`cartão de ${nome} ainda não chegou`);
    return achado;
  });

describe('SecaoMercado: períodos dos índices', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('o Ibovespa mostra 1 mês, 6 meses e 1 ano com a rentabilidade do resumo', async () => {
    renderizar(<SecaoMercado />);

    const ibov = await cartao('Ibovespa');
    const periodos = within(ibov).getAllByText(/^[+−-]/).map((c) => c.textContent);
    // ABEV3 traz o Ibovespa com estes valores: 1 mês, 6 meses e 1 ano
    expect(periodos).toEqual(expect.arrayContaining(['+8,9%', '+6,7%', '+43,5%']));
    expect(within(ibov).getByText('1 mês')).toBeInTheDocument();
    expect(within(ibov).getByText('6 meses')).toBeInTheDocument();
    expect(within(ibov).getByText('1 ano')).toBeInTheDocument();
  });

  it('Brent, sem período no pacote, mostra só o valor do dia (sem "Indisponível" nem 0)', async () => {
    renderizar(<SecaoMercado />);

    const brent = await cartao('Petróleo Brent');
    expect(within(brent).getByText(TEXTOS.mercado.semSoDia)).toBeInTheDocument();
    expect(brent.textContent).not.toMatch(/Indisponível/);
    expect(brent.querySelector('.mercado-indice__periodos')).toBeNull();
  });

  it('o dólar sem histórico não mostra período inventado: só o valor do dia', async () => {
    renderizar(<SecaoMercado />);

    const dolar = await cartao('Dólar');
    expect(within(dolar).getByText(TEXTOS.mercado.semSoDia)).toBeInTheDocument();
    expect(dolar.querySelector('.mercado-indice__periodos')).toBeNull();
  });

  it('a frase do pregão aparece no topo, só com fatos', async () => {
    renderizar(<SecaoMercado />);

    expect(await screen.findByText(/^\d+ ações? acompanhadas?\. Dia (volátil|estável)\.$/)).toBeInTheDocument();
  });
});
