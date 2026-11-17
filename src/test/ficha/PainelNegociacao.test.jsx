import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { PainelNegociacao } from '../../components/ficha/PainelNegociacao.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { numeroCompacto } from '../../lib/formato.js';
import { porNivel, TEXTOS } from '../../lib/textos.js';

const estado = vi.hoisted(() => ({ resumo: null }));

vi.mock('../../hooks/useDados.js', () => ({
  useResumo: () => ({
    data: estado.resumo,
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
    refetch: () => {},
  }),
}));

const N = TEXTOS.ficha.negociacao;

const VOLUME = {
  total: { valor: 21725600, status: 'ok' },
  mediana_20: { valor: 30722900, status: 'ok' },
  relativo: { valor: 0.7071, status: 'ok', texto: '0,7 o normal do último mês' },
};

describe('PainelNegociacao: como foi a negociação', () => {
  afterEach(() => {
    estado.resumo = null;
  });

  it('mostra o volume do dia, a mediana de 20 pregões e a frase do relativo', () => {
    estado.resumo = { volume: VOLUME, volatilidade_20d: { valor: 0.0156, status: 'ok', posicao_pct: { valor: 0.5, status: 'ok' } } };
    renderizar(<PainelNegociacao ticker="ABEV3" />);
    expect(screen.getByRole('heading', { name: N.titulo })).toBeInTheDocument();
    expect(screen.getByText(numeroCompacto(21725600))).toBeInTheDocument();
    expect(screen.getByText(numeroCompacto(30722900))).toBeInTheDocument();
    expect(screen.getByText('0,7 o normal do último mês')).toBeInTheDocument();
  });

  it('posição baixa mostra a faixa Baixa e quantas ações a ação oscila mais', () => {
    estado.resumo = { volume: VOLUME, volatilidade_20d: { valor: 0.0156, status: 'ok', posicao_pct: { valor: 0.0723, status: 'ok' }, texto: 'mais calma que 93% das ações' } };
    renderizar(<PainelNegociacao ticker="ABEV3" />);
    expect(screen.getByText(N.faixa(N.faixas.baixa))).toBeInTheDocument();
    expect(screen.getByText(N.oscilaMais(7))).toBeInTheDocument();
    expect(screen.getByText('mais calma que 93% das ações')).toBeInTheDocument();
  });

  it('posição alta mostra a faixa Alta', () => {
    estado.resumo = { volume: VOLUME, volatilidade_20d: { valor: 0.04, status: 'ok', posicao_pct: { valor: 0.8, status: 'ok' } } };
    renderizar(<PainelNegociacao ticker="PETR4" />);
    expect(screen.getByText(N.faixa(N.faixas.alta))).toBeInTheDocument();
    expect(screen.getByText(N.oscilaMais(80))).toBeInTheDocument();
  });

  it('sem volume mostra o texto de ausência, nunca zero', () => {
    estado.resumo = { volatilidade_20d: { valor: null, status: 'indisponivel' } };
    renderizar(<PainelNegociacao ticker="PETR4" />);
    expect(screen.getByText(N.volumeAusente)).toBeInTheDocument();
    expect(screen.getByText(N.semOscilacao)).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('número retido pela API (como na RAIZ4) mostra a nota de segurança', () => {
    estado.resumo = {
      volume: { total: { valor: 10300000, status: 'ok' }, mediana_20: { valor: null, status: 'historico_insuficiente' } },
      volatilidade_20d: { valor: null, status: 'historico_insuficiente' },
    };
    renderizar(<PainelNegociacao ticker="RAIZ4" />);
    expect(screen.getByText(porNivel(N.retido, 'simples'))).toBeInTheDocument();
  });

  it('com todos os números publicados, a nota não aparece', () => {
    estado.resumo = { volume: VOLUME, volatilidade_20d: { valor: 0.0156, status: 'ok', posicao_pct: { valor: 0.5, status: 'ok' } } };
    renderizar(<PainelNegociacao ticker="ABEV3" />);
    expect(screen.queryByText(porNivel(N.retido, 'simples'))).not.toBeInTheDocument();
  });
});
