import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { GraficoIbovespa } from '../../components/hoje/GraficoIbovespa.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { numero, pct } from '../../lib/formato.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const estado = vi.hoisted(() => ({ serie: null, erro: false }));

vi.mock('../../hooks/useDados.js', () => ({
  useSerie: () => ({ data: estado.serie, isPending: false, isError: estado.erro, error: null, refetch: () => {} }),
}));

// 130 pregões de 100.000 a 112.900: a janela de 6 meses (127) vai de 100.300 a 112.900
const FECHAMENTO = Array.from({ length: 130 }, (_, i) => 100000 + i * 100);
const fmt = (v) => numero(v, { casas: 0 });

describe('GraficoIbovespa', () => {
  beforeEach(() => {
    estado.serie = { datas: FECHAMENTO.map((_, i) => `2026-01-${String((i % 28) + 1).padStart(2, '0')}`), valores: { fechamento: FECHAMENTO } };
    estado.erro = false;
  });

  it('variação da janela em destaque, com sinal e direção', () => {
    renderizar(<GraficoIbovespa />);
    const valor = screen.getByText(pct(112900 / 100300 - 1));
    expect(valor).toHaveAttribute('data-sinal', 'up');
    expect(screen.getByText(porNivel(TEXTOS.hoje.graficoVariacao, 'simples'))).toBeInTheDocument();
  });

  it('gráfico descrito, mínima e máxima visíveis e o link do mercado', () => {
    renderizar(<GraficoIbovespa />);
    expect(screen.getByRole('img', { name: TEXTOS.hoje.mini.ibovespa(fmt(100300), fmt(112900)) })).toBeInTheDocument();
    expect(screen.getAllByText(fmt(100300)).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: TEXTOS.hoje.verMercado })).toHaveAttribute('href', '/mercado');
  });

  it('a explicação fica no painel, que abre pelo botão', () => {
    renderizar(<GraficoIbovespa />);
    const botao = screen.getByRole('button', { name: TEXTOS.hoje.detalhes(porNivel(TEXTOS.hoje.graficoTitulo, 'simples')) });
    const painel = document.getElementById(botao.getAttribute('aria-controls'));
    expect(painel).toHaveAttribute('inert');
    expect(within(painel).getByText(TEXTOS.hoje.faixaSeisMesesDescricao(fmt(100300), fmt(112900)))).toBeInTheDocument();
    fireEvent.click(botao);
    expect(painel).not.toHaveAttribute('inert');
  });

  it('com erro, o aviso no lugar do gráfico e sem variação', () => {
    estado.erro = true;
    estado.serie = null;
    renderizar(<GraficoIbovespa />);
    expect(screen.getByText(TEXTOS.hoje.graficoIndisponivel)).toBeInTheDocument();
    expect(document.querySelector('.hoje-janela')).toBeNull();
  });
});
