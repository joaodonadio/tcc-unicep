import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { PainelIndicadores } from '../../components/ficha/PainelIndicadores.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS } from '../../lib/textos.js';

const RESUMO = {
  pl: { valor: 6, status: 'ok', setor: { valor: 14, status: 'ok' } },
  margem_liquida: { valor: 0.24, status: 'ok', setor: { valor: 0.02, status: 'ok' } },
  ebitda: {
    valor_12m: { valor: 2.7e11, status: 'ok' },
    margem: { valor: 0.5, status: 'ok' },
    setor_margem: { valor: 0.14, status: 'ok' },
  },
  endividamento: {
    divida_liquida: { valor: 8e10, status: 'ok' },
    dl_ebitda: { valor: 0.3, status: 'ok' },
    caixa_liquido: { valor: false, status: 'ok' },
    setor_dl_ebitda: { valor: 1.7, status: 'ok' },
  },
};

vi.mock('../../hooks/useDados.js', () => ({
  useResumo: () => ({ data: RESUMO, isPending: false, isError: false, error: null, refetch: () => {} }),
}));

const I = TEXTOS.ficha.indicadores;

describe('PainelIndicadores nos dois níveis', () => {
  afterEach(() => localStorage.clear());

  it('simples: bloco com nome, frase de comparação e "Como ler"', () => {
    renderizar(<PainelIndicadores ticker="PETR4" chaves={['pl']} />);
    expect(screen.getByRole('heading', { level: 3, name: 'P/L' })).toBeInTheDocument();
    expect(screen.getByText(I.comparacao.abaixo('14,0'))).toBeInTheDocument();
    expect(screen.getByText(I.comoLer)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('técnico: tabela com mediana do setor e indicadores extras, sem "Como ler"', () => {
    localStorage.setItem('painel-b3:preferencias', JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizar(<PainelIndicadores ticker="PETR4" chaves={['pl', 'margem_liquida', 'ebitda', 'dl_ebitda']} />);
    const tabela = screen.getByRole('table');
    expect(within(tabela).getByRole('columnheader', { name: I.colSetor })).toBeInTheDocument();
    expect(within(tabela).getByRole('rowheader', { name: 'Margem líquida' })).toBeInTheDocument();
    expect(within(tabela).getByRole('rowheader', { name: I.extras.margemEbitda })).toBeInTheDocument();
    expect(within(tabela).getByRole('rowheader', { name: I.extras.dividaLiquida })).toBeInTheDocument();
    expect(within(tabela).getByRole('rowheader', { name: I.extras.caixaLiquido })).toBeInTheDocument();
    const linhaPl = within(tabela).getByRole('row', { name: /P\/L/ });
    expect(within(linhaPl).getByText(I.situacao.abaixo)).toBeInTheDocument();
    expect(screen.queryByText(I.comoLer)).not.toBeInTheDocument();
  });
});
