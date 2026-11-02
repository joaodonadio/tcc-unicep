import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { PainelNoticias } from '../../components/ficha/PainelNoticias.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS } from '../../lib/textos.js';

vi.mock('../../hooks/useTraducao.js', () => ({ useTraducao: () => ({ data: null }) }));
vi.mock('../../hooks/useDados.js', () => ({
  useNoticiasAcao: () => ({
    isPending: false,
    isError: false,
    refetch: () => {},
    data: {
      janela_inicio: '2026-10-22T08:00:01-03:00',
      janela_fim: '2026-10-23T08:00:00-03:00',
      resumo: {
        quantidade: { valor: 1, status: 'ok' },
        positivas: { valor: 1, status: 'ok' },
        neutras: { valor: 0, status: 'ok' },
        negativas: { valor: 0, status: 'ok' },
      },
      itens: [
        {
          id: 'n1',
          titulo: 'Empresa tem lucro maior',
          link: 'https://exemplo.com/a',
          fonte: 'Fonte',
          rotulo: 'positivo',
          prob_positivo: 0.62,
          prob_neutro: 0.3,
          prob_negativo: 0.08,
          destaque: 1,
          janela: 'pregao',
          publicado_em: '2026-10-28T12:00:00Z',
        },
      ],
    },
  }),
}));

const T = TEXTOS.ficha.tec;

describe('PainelNoticias nos dois níveis', () => {
  afterEach(() => localStorage.clear());

  it('simples: rótulo do tom e a frase que explica o tom, sem probabilidades', () => {
    renderizar(<PainelNoticias ticker="PETR4" />);
    expect(screen.getByText(TEXTOS.ficha.noticias.tom.positivo)).toBeInTheDocument();
    expect(screen.getByText(T.tomExplica)).toBeInTheDocument();
    expect(screen.queryByText(T.probabilidadesValor('62%', '30%', '8%'))).not.toBeInTheDocument();
  });

  it('técnico: coluna com as probabilidades do FinBERT', () => {
    localStorage.setItem('painel-b3:preferencias', JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizar(<PainelNoticias ticker="PETR4" />);
    expect(screen.getByRole('columnheader', { name: T.probabilidades })).toBeInTheDocument();
    expect(screen.getByText(T.probabilidadesValor('62%', '30%', '8%'))).toBeInTheDocument();
    expect(screen.queryByText(T.tomExplica)).not.toBeInTheDocument();
  });

  it('mostra a janela de publicação acima da lista, com data e hora', () => {
    renderizar(<PainelNoticias ticker="PETR4" />);
    expect(
      screen.getByText(TEXTOS.ficha.noticias.janelaPeriodo('22/10/2026 às 08h00', '23/10/2026 às 08h00')),
    ).toBeInTheDocument();
  });

  it('o link de leitura fica só no título: sem "Ler em" na linha de fonte', () => {
    renderizar(<PainelNoticias ticker="PETR4" />);
    expect(screen.queryByRole('link', { name: /Ler em/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Empresa tem lucro maior/ })).toHaveAttribute(
      'href',
      'https://exemplo.com/a',
    );
  });
});
