import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { PorQueApareceu } from '../../components/ficha/PorQueApareceu.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { REGRAS } from '../../lib/sugestoes.js';
import { TEXTOS } from '../../lib/textos.js';

const estado = vi.hoisted(() => ({ analise: null }));

vi.mock('../../hooks/useAnalise.js', () => ({
  useAnaliseDoDia: () => estado.analise,
  useRecarregarAnalise: () => () => {},
}));

const T = TEXTOS.regras;

const sinal = (id, tipo, extra = {}) => ({
  id,
  tipo,
  titulo: `Titulo ${id}`,
  simples: `Frase ${id}.`,
  tecnico: `Tecnico ${id}.`,
  dados: [{ rotulo: 'P/L', valor: '8,2×', comparado: '12,0×' }],
  contra: [],
  limites: ['Limite de teste.'],
  ...extra,
});

const analiseCom = (sinais) => ({
  isPending: false,
  isError: false,
  data: { sugestoes: [{ ticker: 'PETR4', sinais }] },
});

const totalDo = (tipo) => REGRAS.filter((r) => r.tipo === tipo).length;

describe('PorQueApareceu', () => {
  beforeEach(() => {
    estado.analise = analiseCom([sinal('a', 'forte'), sinal('b', 'forte'), sinal('c', 'atencao')]);
  });

  it('o placar mostra quantas checagens apontaram algo por tipo e de quantas', () => {
    renderizar(<PorQueApareceu ticker="PETR4" />);

    const aFavor = screen.getByText(T.tipos.forte.nome, { selector: '.placar-cartao__nome' }).closest('li');
    expect(within(aFavor).getByText('2')).toBeInTheDocument();
    expect(within(aFavor).getByText(T.deTotal(totalDo('forte')))).toBeInTheDocument();

    const atencao = screen.getByText(T.tipos.atencao.nome, { selector: '.placar-cartao__nome' }).closest('li');
    expect(within(atencao).getByText('1')).toBeInTheDocument();
    expect(within(atencao).getByText(T.deTotal(totalDo('atencao')))).toBeInTheDocument();

    expect(screen.getByText(T.placarLegenda(3, REGRAS.length))).toBeInTheDocument();
  });

  it('cada regra acesa mostra a frase, o título e os números da ação e da referência', () => {
    renderizar(<PorQueApareceu ticker="PETR4" />);

    expect(screen.getByRole('heading', { level: 4, name: 'Titulo a' })).toBeInTheDocument();
    expect(screen.getByText('Frase a.')).toBeInTheDocument();
    expect(screen.getAllByText('8,2×')).toHaveLength(3);
    expect(screen.getAllByText('12,0×')).toHaveLength(3);
    expect(screen.getAllByText(TEXTOS.ficha.colunaSetor)).toHaveLength(3);
  });

  it('indicador sem referência vira cartão com o próprio rótulo, sem coluna do setor', () => {
    estado.analise = analiseCom([
      sinal('a', 'forte', {
        dados: [
          { rotulo: 'P/L', valor: '8,2×', comparado: '12,0×' },
          { rotulo: 'Beta', valor: '1,10', comparado: null },
        ],
      }),
    ]);
    renderizar(<PorQueApareceu ticker="PETR4" />);

    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('1,10')).toBeInTheDocument();
    expect(screen.queryByText(T.semReferencia)).not.toBeInTheDocument();
  });

  it('regra sem nenhuma referência mostra só os cartões, sem a legenda "Esta ação"', () => {
    estado.analise = analiseCom([
      sinal('a', 'forte', {
        dados: [
          { rotulo: 'Ação, 6 meses', valor: '+5,1%', comparado: null },
          { rotulo: 'Ibovespa, 6 meses', valor: '+3,0%', comparado: null },
          { rotulo: 'Média do setor, 6 meses', valor: '+2,2%', comparado: null },
        ],
      }),
    ]);
    renderizar(<PorQueApareceu ticker="PETR4" />);

    expect(screen.getByText('Ibovespa, 6 meses')).toBeInTheDocument();
    expect(screen.getByText('+3,0%')).toBeInTheDocument();
    expect(screen.queryByText(TEXTOS.ficha.colunaAcao)).not.toBeInTheDocument();
    expect(screen.queryByText(TEXTOS.ficha.colunaSetor)).not.toBeInTheDocument();
  });

  it('os limites aparecem uma vez, numa nota', () => {
    renderizar(<PorQueApareceu ticker="PETR4" />);

    expect(screen.getByText(TEXTOS.ficha.limitesRegras(['limite de teste']))).toBeInTheDocument();
  });

  it('"Como funcionam" começa recolhido e lista todas as regras', () => {
    renderizar(<PorQueApareceu ticker="PETR4" />);

    const resumo = screen.getByText(T.resumoCheck(REGRAS.length));
    const detalhes = resumo.closest('details');
    expect(detalhes).not.toHaveAttribute('open');
    expect(within(detalhes).getAllByRole('listitem').length).toBeGreaterThanOrEqual(REGRAS.length);
    expect(within(detalhes).getByText(REGRAS[0].nome)).toBeInTheDocument();
  });

  it('sem regras acesas, mostra a mensagem e ainda oferece a explicação', () => {
    estado.analise = analiseCom([]);
    renderizar(<PorQueApareceu ticker="PETR4" />);

    expect(screen.getByText(TEXTOS.ficha.semRegras.simples)).toBeInTheDocument();
    expect(screen.getByText(T.resumoCheck(REGRAS.length))).toBeInTheDocument();
  });
});
