import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import SecaoMercado from '../../components/mercado/SecaoMercado.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

describe('períodos do gráfico dos índices', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('os períodos são 1 semana, 1 mês, 6 meses e 1 ano, com 6 meses marcado por padrão', async () => {
    renderizar(<SecaoMercado />);

    const periodo = await screen.findByRole('group', { name: TEXTOS.mercado.periodoGrupo });
    expect(within(periodo).getAllByRole('button').map((b) => b.textContent)).toEqual([
      '1 semana',
      '1 mês',
      '6 meses',
      '1 ano',
    ]);
    expect(within(periodo).getByRole('button', { name: '6 meses' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('trocar o período troca a janela do gráfico e os cartões de rendimento', async () => {
    renderizar(<SecaoMercado />);

    const periodo = await screen.findByRole('group', { name: TEXTOS.mercado.periodoGrupo });
    const listaAntes = await screen.findByRole('list', { name: TEXTOS.mercado.resumoLista(TEXTOS.mercado.periodos['6m']) });
    const textoAntes = listaAntes.textContent;
    const grafico6m = screen.getByRole('img', { name: /^Ibovespa/ }).getAttribute('aria-label');

    fireEvent.click(within(periodo).getByRole('button', { name: TEXTOS.mercado.periodos['1s'] }));

    const listaSemana = await screen.findByRole('list', { name: TEXTOS.mercado.resumoLista(TEXTOS.mercado.periodos['1s']) });
    expect(listaSemana.textContent).not.toBe(textoAntes);
    expect(screen.getByRole('img', { name: /^Ibovespa/ }).getAttribute('aria-label')).not.toBe(grafico6m);
  });

  it('o rodapé do gráfico mostra a data completa na semana e mês e ano nos períodos longos', async () => {
    renderizar(<SecaoMercado />);

    const periodo = await screen.findByRole('group', { name: TEXTOS.mercado.periodoGrupo });
    const grafico = screen.getByRole('img', { name: /^Ibovespa/ }).closest('.mercado-grafico');
    expect(grafico.querySelector('.chart-foot span').textContent).toMatch(/^[a-zç]{3}\/\d{4}$/);

    fireEvent.click(within(periodo).getByRole('button', { name: TEXTOS.mercado.periodos['1s'] }));
    const graficoSemana = screen.getByRole('img', { name: /^Ibovespa/ }).closest('.mercado-grafico');
    expect(graficoSemana.querySelector('.chart-foot span').textContent).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});
