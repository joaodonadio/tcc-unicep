import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ResumoMinhaLista } from '../../components/hoje/ResumoMinhaLista.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { brl } from '../../lib/formato.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const estado = vi.hoisted(() => ({ series: {}, pedidos: [] }));
vi.mock('../../hooks/useDados.js', () => ({
  useSeries: (tickers, janela) => {
    estado.pedidos.push({ tickers, janela });
    return tickers.map((t) => estado.series[t] ?? undefined);
  },
}));

const guardar = (tickers) => localStorage.setItem('painel-b3:lista', JSON.stringify(tickers));

describe('ResumoMinhaLista', () => {
  afterEach(() => {
    localStorage.clear();
    estado.series = {};
    estado.pedidos = [];
  });

  it('vazia: frase curta, o link do rodapé e como guardar no painel', () => {
    renderizar(<ResumoMinhaLista acoes={[]} />);
    expect(screen.getByText(porNivel(TEXTOS.hoje.minhaListaVazia, 'simples'))).toBeInTheDocument();
    expect(screen.getByText(porNivel(TEXTOS.hoje.minhaListaComoGuardar, 'simples'))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: TEXTOS.hoje.verMinhaLista })).toBeInTheDocument();
  });

  it('com ações: mini linha descrita do último mês e aviso de quem não tem dado do pregão', () => {
    guardar(['AAAA3', 'BBBB3']);
    estado.series.AAAA3 = { valores: { fechamento: [10, 11, 12] } };
    renderizar(<ResumoMinhaLista acoes={[{ ticker: 'AAAA3', nome: 'Empresa A', variacao_dia: 0.012 }]} />);
    expect(screen.getByRole('img', { name: TEXTOS.hoje.mini.acao('AAAA3', brl(10), brl(12)) })).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.hoje.semDadoDoPregao)).toBeInTheDocument();
    expect(estado.pedidos.at(-1)).toEqual({ tickers: ['AAAA3', 'BBBB3'], janela: '1m' });
  });

  it('pede no máximo 5 séries', () => {
    guardar(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7']);
    renderizar(<ResumoMinhaLista acoes={[]} />);
    expect(estado.pedidos.at(-1).tickers).toHaveLength(5);
  });
});
