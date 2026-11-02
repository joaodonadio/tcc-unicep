import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { AlertasProventos } from '../../components/proventos/AlertasProventos.jsx';
import { CalendarioProventos } from '../../components/proventos/CalendarioProventos.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { alertasDeProventos } from '../../lib/agenda.js';

const HOJE = '2026-11-02';
const eventos = [
  { id: 'a', ticker: 'VALE3', empresa: 'Vale', tipo: 'JCP', tipo_rotulo: 'JCP', data_com: '2026-11-05', data_pagamento: '2026-11-20', valor_texto: 'R$ 0,30' },
  { id: 'b', ticker: 'PETR4', empresa: 'Petrobras', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_com: '2026-10-01', data_pagamento: '2026-11-04', valor_texto: 'R$ 0,50' },
  { id: 'c', ticker: 'ITSA4', empresa: 'Itaú', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_com: '2026-10-01', data_pagamento: '2026-11-20', valor_texto: '' },
];

describe('AlertasProventos', () => {
  it('mostra a frase factual da data-com e o pagamento da semana', () => {
    renderizar(<AlertasProventos alertas={alertasDeProventos(eventos, HOJE, [])} />);
    expect(screen.getByText('Último dia para ter VALE3 e receber o JCP: 05/11')).toBeInTheDocument();
    // o prazo fica só na pílula, sem repetir na frase
    expect(screen.getByText('em 3 dias')).toBeInTheDocument();
    expect(screen.getByText('PETR4 paga R$ 0,50 por ação em 04/11')).toBeInTheDocument();
    expect(screen.getByText('em 2 dias')).toBeInTheDocument();
  });

  it('alerta sem itens não aparece e valor ausente não vira zero', () => {
    renderizar(<AlertasProventos alertas={alertasDeProventos(eventos, HOJE, ['ITSA4'])} />);
    const lista = document.querySelector('[data-alerta="lista"]');
    expect(within(lista).getByText(/ITSA4: dividendo, pagamento em 20\/11; valor por ação não informado/)).toBeInTheDocument();
    expect(lista.textContent).not.toMatch(/R\$ 0,00/);
  });

  it('sem nenhum alerta mostra uma frase', () => {
    renderizar(<AlertasProventos alertas={[]} />);
    expect(screen.getByText(/Nenhuma data importante nos próximos 7 dias/)).toBeInTheDocument();
    expect(document.querySelector('[data-alerta]')).toBeNull();
  });
});

describe('CalendarioProventos', () => {
  it('marca dias com pagamento, abre a lista do dia e navega de mês', () => {
    renderizar(<CalendarioProventos eventos={eventos} hoje={HOJE} />);
    expect(screen.getByText('Novembro de 2026')).toBeInTheDocument();

    const dia = screen.getByRole('button', { name: 'Dia 20: 2 pagamentos' });
    expect(dia).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(dia);
    expect(dia).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Pagamentos em 20/11/2026' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /VALE3/ })).toHaveAttribute('href', '/acao/VALE3?pergunta=proventos');

    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(screen.getByText('Dezembro de 2026')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma empresa marcou pagamento neste mês.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }));
    expect(screen.getByText('Novembro de 2026')).toBeInTheDocument();
  });
});
