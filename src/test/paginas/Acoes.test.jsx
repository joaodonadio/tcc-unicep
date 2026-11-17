import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import Acoes from '../../pages/Acoes.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS } from '../../lib/textos.js';

const acoesPregao = [
  { ticker: 'AAAA3', nome: 'Empresa A', setor_nome: 'Energia', variacao_dia: 0.01 },
  { ticker: 'BBBB3', nome: 'Empresa B', setor_nome: 'Saúde', variacao_dia: -0.02 },
  { ticker: 'PETR4', nome: 'Petrobras', setor_nome: 'Energia', variacao_dia: 0.015 },
  { ticker: 'PETR3', nome: 'Petrobras ON', setor_nome: 'Energia', variacao_dia: 0.012 },
];

vi.mock('../../hooks/useAnalise.js', () => ({
  useAnaliseDoDia: () => ({ data: { acoes_pregao: acoesPregao }, isPending: false, isError: false, error: null }),
  useRecarregarAnalise: () => () => {},
}));

vi.mock('../../hooks/useDados.js', () => ({
  useResumos: () => ({ data: [] }),
}));

describe('Acoes', () => {
  it('mostra todas as ações do pregão e o título do mapa', () => {
    renderizar(<Acoes />, { rota: '/acoes' });
    expect(screen.getByRole('heading', { level: 2, name: TEXTOS.setores.mapaTitulo })).toBeInTheDocument();
    expect(screen.getByText('AAAA3')).toBeInTheDocument();
    expect(screen.getByText('BBBB3')).toBeInTheDocument();
  });

  it('tem campo de busca com rótulo visível e sem contagem enquanto o termo está vazio', () => {
    renderizar(<Acoes />, { rota: '/acoes' });
    const campo = screen.getByLabelText(TEXTOS.acoes.buscaRotulo);
    expect(campo).toHaveAttribute('type', 'search');
    expect(campo).toHaveAttribute('placeholder', TEXTOS.acoes.buscaPlaceholder);
    expect(screen.queryByText(/ações? encontrada/)).not.toBeInTheDocument();
  });

  it('filtra o mapa pelo termo e anuncia a contagem', () => {
    renderizar(<Acoes />, { rota: '/acoes' });
    fireEvent.change(screen.getByLabelText(TEXTOS.acoes.buscaRotulo), { target: { value: 'petr' } });
    expect(screen.getByText('PETR4')).toBeInTheDocument();
    expect(screen.getByText('PETR3')).toBeInTheDocument();
    expect(screen.queryByText('AAAA3')).not.toBeInTheDocument();
    expect(screen.queryByText('BBBB3')).not.toBeInTheDocument();
    // o setor Saúde não tem ação no termo e some do mapa
    expect(screen.queryByText('Saúde')).not.toBeInTheDocument();
    expect(screen.getByText(TEXTOS.acoes.buscaContagem(2))).toBeInTheDocument();
  });

  it('usa a forma no singular quando sobra uma ação', () => {
    renderizar(<Acoes />, { rota: '/acoes' });
    fireEvent.change(screen.getByLabelText(TEXTOS.acoes.buscaRotulo), { target: { value: 'AAAA' } });
    expect(screen.getByText(TEXTOS.acoes.buscaContagem(1))).toBeInTheDocument();
    expect(screen.queryByText('PETR4')).not.toBeInTheDocument();
  });

  it('sem resultado mostra a mensagem vazia no lugar do mapa', () => {
    renderizar(<Acoes />, { rota: '/acoes' });
    fireEvent.change(screen.getByLabelText(TEXTOS.acoes.buscaRotulo), { target: { value: 'zzzz' } });
    expect(screen.getByText(TEXTOS.acoes.buscaVazia)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: TEXTOS.setores.mapaTitulo })).not.toBeInTheDocument();
    expect(screen.getByText(TEXTOS.acoes.buscaContagem(0))).toBeInTheDocument();
  });

  it('busca em branco volta a mostrar todas as ações', () => {
    renderizar(<Acoes />, { rota: '/acoes' });
    const campo = screen.getByLabelText(TEXTOS.acoes.buscaRotulo);
    fireEvent.change(campo, { target: { value: 'petr' } });
    fireEvent.change(campo, { target: { value: '   ' } });
    expect(screen.getByText('AAAA3')).toBeInTheDocument();
    expect(screen.getByText('BBBB3')).toBeInTheDocument();
  });
});
