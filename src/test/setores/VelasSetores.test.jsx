import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { VelasSetores } from '../../components/setores/VelasSetores.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS } from '../../lib/textos.js';

const T = TEXTOS.setores.velas;

const alfa = {
  setor: 'Setor Alfa',
  vela: { abertura: 0, fechamento: 0.03, maxima: 0.04, minima: -0.002 },
  n: 3,
  total: 3,
  inicio: '2026-01-02',
  fim: '2026-01-30',
};
const beta = { setor: 'Setor Beta', vela: { abertura: 0, fechamento: -0.01, maxima: 0, minima: -0.012 }, n: 2, total: 2 };
const gama = { setor: 'Setor Gama', vela: null, n: 0, total: 1 };

describe('VelasSetores', () => {
  it('mostra o título e a lista com subiu e caiu, com sinal e percentual', () => {
    renderizar(<VelasSetores velas={[alfa, beta]} periodo="s1" />);

    expect(screen.getByRole('heading', { level: 2, name: T.titulo })).toBeInTheDocument();

    const lista = screen.getByRole('list', { name: T.tabela });
    const itens = within(lista).getAllByRole('listitem');
    const linhaAlfa = itens.find((li) => li.textContent.includes('Setor Alfa'));
    const linhaBeta = itens.find((li) => li.textContent.includes('Setor Beta'));
    expect(linhaAlfa.textContent).toContain(T.tooltip.subiu);
    expect(linhaAlfa.textContent).toContain('+3,0%');
    expect(linhaBeta.textContent).toContain(T.tooltip.caiu);
    expect(lista.textContent).not.toMatch(/NaN|undefined/);
  });

  it('setor sem vela aparece na nota de sem dado', () => {
    renderizar(<VelasSetores velas={[alfa, gama]} periodo="s1" />);

    expect(screen.getByText(T.semDados('Setor Gama'))).toBeInTheDocument();
  });

  it('enquanto carrega, mostra o carregador e esconde a lista', () => {
    renderizar(<VelasSetores velas={[]} periodo="s1" carregando />);

    expect(screen.getByText(T.carregando)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: T.tabela })).not.toBeInTheDocument();
  });

  it('se falhar, mostra a mensagem de erro', () => {
    renderizar(<VelasSetores velas={[]} periodo="s1" falhou />);

    expect(screen.getByText(T.erro)).toBeInTheDocument();
  });

  it('no período de 1 dia, mostra a nota sobre o pavio', () => {
    renderizar(<VelasSetores velas={[alfa]} periodo="d1" />);

    expect(screen.getByText(T.notaDia)).toBeInTheDocument();
  });

  it('mostra o selo "Calculado no site" abaixo do gráfico', () => {
    renderizar(<VelasSetores velas={[alfa, beta]} periodo="s1" />);

    expect(screen.getByText(TEXTOS.contas.selo)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: TEXTOS.contas.comoFeito })).toHaveAttribute('href', '/dados#conta-velas');
  });
});
