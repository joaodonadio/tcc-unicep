import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderizar as renderizarComProvedores } from '../apoio/renderizar.jsx';
import { AgendaProventos } from '../../components/inicio/AgendaProventos.jsx';

// a agenda vem de react-query; aqui a consulta é montada à mão, sem rede
const consulta = vi.hoisted(() => ({ atual: null }));
vi.mock('../../hooks/useAgenda.js', () => ({
  useAgendaProventos: () => consulta.atual,
}));

const HOJE = '2026-10-22';

// 8 pagamentos futuros; a seção mostra todos, sem limite de próximos
const futuros = [
  { ticker: 'PETR4', empresa: 'Petrobras', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-10-23', dia: '23/10', data_extenso: '23 de outubro de 2026', data_com_texto: '01/10/2026', valor_texto: 'R$ 0,50' },
  { ticker: 'VALE3', empresa: 'Vale', tipo: 'JCP', tipo_rotulo: 'JCP', data_pagamento: '2026-10-26', dia: '26/10', data_extenso: '26 de outubro de 2026', data_com_texto: '02/10/2026', valor_texto: 'R$ 0,30' },
  { ticker: 'ITSA4', empresa: 'Itaú', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-05', dia: '05/11', data_extenso: '5 de novembro de 2026', data_com_texto: '03/10/2026', valor_texto: 'R$ 0,40' },
  { ticker: 'BBAS3', empresa: 'Banco do Brasil', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-06', dia: '06/11', data_extenso: '6 de novembro de 2026', data_com_texto: '03/10/2026', valor_texto: 'R$ 0,20' },
  { ticker: 'BBDC4', empresa: 'Bradesco', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-10', dia: '10/11', data_extenso: '10 de novembro de 2026', data_com_texto: '04/10/2026', valor_texto: 'R$ 0,15' },
  { ticker: 'WEGE3', empresa: 'WEG', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-12', dia: '12/11', data_extenso: '12 de novembro de 2026', data_com_texto: '05/10/2026', valor_texto: 'R$ 0,10' },
  { ticker: 'ABEV3', empresa: 'Ambev', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-15', dia: '15/11', data_extenso: '15 de novembro de 2026', data_com_texto: '05/10/2026', valor_texto: 'R$ 0,08' },
  { ticker: 'RENT3', empresa: 'Localiza', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-20', dia: '20/11', data_extenso: '20 de novembro de 2026', data_com_texto: '06/10/2026', valor_texto: 'R$ 0,05' },
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

  it('mostra os grupos de semana esperados', () => {
    renderizar();
    expect(screen.getByRole('heading', { name: 'Esta semana' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Próxima semana' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mais adiante' })).toBeInTheDocument();
  });

  it('o item leva à ficha da ação na pergunta de proventos', () => {
    renderizar();
    const primeiro = screen.getByRole('link', { name: /PETR4/ });
    expect(primeiro).toHaveAttribute('href', '/acao/PETR4?pergunta=proventos');
  });

  it('mostra todos os pagamentos futuros, sem limite', () => {
    renderizar();
    expect(screen.getAllByRole('link', { name: /Data-com/ })).toHaveLength(8);
  });

  it('a etiqueta JCP explica o tipo no title', () => {
    renderizar();
    const jcp = screen.getByText('JCP');
    expect(jcp).toHaveAttribute('title', expect.stringMatching(/juros sobre capital próprio/));
  });

  it('mostra o estado de espera quando não há pagamentos', () => {
    consulta.atual = montarConsulta({ data: { futuros: [], a_definir: [] } });
    renderizar();
    expect(screen.getByText('Nenhum pagamento marcado para as próximas semanas.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('o bloco tem título e aparece dentro da seção de proventos', () => {
    renderizar();
    const secao = screen.getByRole('region', { name: 'Próximos proventos' });
    expect(within(secao).getByRole('heading', { name: 'Esta semana' })).toBeInTheDocument();
  });
});
