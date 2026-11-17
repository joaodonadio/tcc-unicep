import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderizar as renderizarComProvedores } from '../apoio/renderizar.jsx';
import { AgendaProventos } from '../../components/proventos/AgendaProventos.jsx';
import { TEXTOS } from '../../lib/textos.js';

// a agenda vem de react-query; aqui a consulta é montada à mão, sem rede
const consulta = vi.hoisted(() => ({ atual: null }));
vi.mock('../../hooks/useAgenda.js', () => ({
  useAgendaProventos: () => consulta.atual,
}));

const HOJE = '2026-10-22';

// 8 pagamentos futuros: a lista mostra 6 e o botão abre o resto
const futuros = [
  { ticker: 'PETR4', empresa: 'PETROBRAS S.A.', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-10-23', data_com: '2026-10-01', data_extenso: '23 de outubro de 2026', valor_texto: 'R$ 0,50' },
  { ticker: 'VALE3', empresa: 'VALE S.A.', tipo: 'JCP', tipo_rotulo: 'JCP', data_pagamento: '2026-10-26', data_com: '2026-10-02', data_extenso: '26 de outubro de 2026', valor_texto: 'R$ 0,30' },
  { ticker: 'ITSA4', empresa: 'Itaú', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-05', data_com: '2026-10-03', data_extenso: '5 de novembro de 2026', valor_texto: 'R$ 0,40' },
  { ticker: 'BBAS3', empresa: 'BANCO DO BRASIL S.A.', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-06', data_com: '2026-10-03', data_extenso: '6 de novembro de 2026', valor_texto: 'R$ 0,20' },
  { ticker: 'BBDC4', empresa: 'Bradesco', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-10', data_com: '2026-10-04', data_extenso: '10 de novembro de 2026', valor_texto: 'R$ 0,15' },
  { ticker: 'WEGE3', empresa: 'WEG', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-12', data_com: '2026-10-05', data_extenso: '12 de novembro de 2026', valor_texto: 'R$ 0,10' },
  { ticker: 'ABEV3', empresa: 'Ambev', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-15', data_com: '2026-10-05', data_extenso: '15 de novembro de 2026', valor_texto: 'R$ 0,08' },
  { ticker: 'RENT3', empresa: 'Localiza', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-20', data_com: '2026-10-06', data_extenso: '20 de novembro de 2026', valor_texto: 'R$ 0,05' },
].map((ev, i) => ({ id: `ev-${i}`, ...ev }));

function montarConsulta(sobrescrever = {}) {
  return {
    data: { futuros, a_definir: [] },
    hoje: HOJE,
    falhas: [],
    isPending: false,
    isError: false,
    error: null,
    refetch: () => {},
    ...sobrescrever,
  };
}

const renderizar = () => renderizarComProvedores(<AgendaProventos />);

describe('AgendaProventos', () => {
  beforeEach(() => {
    consulta.atual = montarConsulta();
  });

  it('é um bloco com o título "Próximos pagamentos" e a nota da data-com', () => {
    renderizar();
    const bloco = screen.getByRole('region', { name: TEXTOS.proventos.agendaTitulo });
    expect(within(bloco).getByRole('heading', { name: TEXTOS.proventos.agendaTitulo })).toBeInTheDocument();
    expect(within(bloco).getByText(/último dia para ter a ação e receber/)).toBeInTheDocument();
  });

  it('mostra seis pagamentos e o botão "Ver todos (8)" abre o resto', () => {
    renderizar();
    const lista = screen.getByRole('list', { name: TEXTOS.proventos.agendaRolagem });
    expect(within(lista).getAllByRole('listitem')).toHaveLength(6);

    const botao = screen.getByRole('button', { name: 'Ver todos (8)' });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(botao).toHaveAttribute('aria-controls', lista.id);

    fireEvent.click(botao);
    expect(within(lista).getAllByRole('listitem')).toHaveLength(8);
    expect(screen.getByRole('button', { name: 'Ver menos' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('aberta, a lista tem data-aberta e um título por mês com a contagem', () => {
    renderizar();
    const lista = screen.getByRole('list', { name: TEXTOS.proventos.agendaRolagem });
    expect(lista).not.toHaveAttribute('data-aberta');
    expect(lista).not.toHaveAttribute('tabindex');

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos (8)' }));
    expect(lista).toHaveAttribute('data-aberta', 'true');
    expect(lista).toHaveAttribute('tabindex', '0');
    // o título do mês não conta como pagamento
    expect(within(lista).getAllByRole('listitem')).toHaveLength(8);
    expect(within(lista).getByText('Outubro de 2026')).toBeInTheDocument();
    expect(within(lista).getByText('2 pagamentos')).toBeInTheDocument();
    expect(within(lista).getByText('Novembro de 2026')).toBeInTheDocument();
    expect(within(lista).getByText('6 pagamentos')).toBeInTheDocument();
  });

  it('aberta, mostra a nota de valores por ação; fechada, não', () => {
    renderizar();
    expect(screen.queryByText(TEXTOS.proventos.notaListaAberta)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos (8)' }));
    expect(screen.getByText(TEXTOS.proventos.notaListaAberta)).toBeInTheDocument();
  });

  it('ao abrir, a lista perde a entrada em cascata e o primeiro link continua no DOM', () => {
    renderizar();
    const lista = screen.getByRole('list', { name: TEXTOS.proventos.agendaRolagem });
    expect(lista).toHaveClass('entra-lista');
    const primeiroLink = screen.getByRole('link', { name: /PETR4/ });

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos (8)' }));
    expect(lista).not.toHaveClass('entra-lista');
    expect(primeiroLink).toBeInTheDocument();
  });

  it('fechada, a lista não tem data-aberta nem títulos de mês', () => {
    const { container } = renderizar();
    const lista = screen.getByRole('list', { name: TEXTOS.proventos.agendaRolagem });
    expect(lista).not.toHaveAttribute('data-aberta');
    expect(container.querySelectorAll('.proventos-prox-mes')).toHaveLength(0);
  });

  it('o item leva à ficha da ação na pergunta de proventos', () => {
    renderizar();
    const primeiro = screen.getByRole('link', { name: /PETR4/ });
    expect(primeiro).toHaveAttribute('href', '/acao/PETR4?pergunta=proventos');
  });

  it('o nome da empresa sai em título, sem sufixo, e a data-com aparece em texto curto', () => {
    renderizar();
    expect(screen.getByText('Petrobras')).toBeInTheDocument();
    expect(screen.getByText('Banco do Brasil')).toBeInTheDocument();
    expect(screen.getAllByText('data-com 01/10')).toHaveLength(1);
  });

  it('a etiqueta JCP explica o tipo no title', () => {
    renderizar();
    const jcp = screen.getByText('JCP');
    expect(jcp).toHaveAttribute('title', expect.stringMatching(/Juros sobre capital próprio/));
  });

  it('sem pagamentos mostra a espera com o mascote e não tem lista', () => {
    consulta.atual = montarConsulta({ data: { futuros: [], a_definir: [] } });
    const { container } = renderizar();
    expect(screen.getByText('Nenhum pagamento marcado para as próximas semanas.')).toBeInTheDocument();
    expect(container.querySelector('.proventos-vazio-cartao .proventos-mascote')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
