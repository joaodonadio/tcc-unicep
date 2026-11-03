import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { ResumoProventos } from '../../components/hoje/ResumoProventos.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const estado = vi.hoisted(() => ({ agenda: null }));
vi.mock('../../hooks/useAgenda.js', () => ({ useAgendaProventos: () => estado.agenda }));

const item = (id, ticker, data, dia) => ({
  id, ticker, data_pagamento: data, dia, valor_texto: 'R$ 0,50', tipo_rotulo: 'Dividendo', data_com_texto: '10/10/2026',
});

describe('ResumoProventos', () => {
  beforeEach(() => {
    estado.agenda = {
      hoje: '2026-10-22',
      isPending: false,
      isError: false,
      data: { futuros: [item('1', 'AAAA3', '2026-10-24', '24/10'), item('2', 'BBBB3', '2026-10-24', '24/10'), item('3', 'CCCC3', '2026-10-27', '27/10')] },
    };
  });

  it('linha do tempo com um ponto por data e a frase para leitores de tela', () => {
    const { container } = renderizar(<ResumoProventos />);
    expect(container.querySelectorAll('.hoje-tempo-ponto')).toHaveLength(2);
    expect(screen.getByText(TEXTOS.hoje.tempoDescricao(3, 7))).toHaveClass('sr-only');
  });

  it('lista compacta e o detalhe de cada pagamento no painel', () => {
    renderizar(<ResumoProventos />);
    expect(screen.getByRole('link', { name: 'AAAA3' })).toBeInTheDocument();
    const botao = screen.getByRole('button', { name: TEXTOS.hoje.detalhes(porNivel(TEXTOS.hoje.proventosTitulo, 'simples')) });
    const painel = document.getElementById(botao.getAttribute('aria-controls'));
    expect(within(painel).getByText(TEXTOS.hoje.proventoDetalhe('AAAA3', 'Dividendo', '10/10/2026'))).toBeInTheDocument();
  });

  it('sem pagamentos: frase e sem botão', () => {
    estado.agenda = { ...estado.agenda, data: { futuros: [] } };
    renderizar(<ResumoProventos />);
    expect(screen.getByText(porNivel(TEXTOS.hoje.proventosVazio, 'simples'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mais sobre/ })).toBeNull();
  });
});
