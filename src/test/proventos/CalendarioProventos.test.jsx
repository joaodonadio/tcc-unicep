import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { CalendarioProventos } from '../../components/proventos/CalendarioProventos.jsx';
import { renderizar } from '../apoio/renderizar.jsx';

const HOJE = '2026-11-02';
const eventos = [
  { id: 'a', ticker: 'VALE3', empresa: 'Vale', tipo: 'JCP', tipo_rotulo: 'JCP', data_com: '2026-11-05', data_pagamento: '2026-11-20', valor_texto: 'R$ 0,30' },
  { id: 'b', ticker: 'PETR4', empresa: 'Petrobras', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_com: '2026-10-01', data_pagamento: '2026-11-04', valor_texto: 'R$ 0,50' },
  { id: 'c', ticker: 'ITSA4', empresa: 'Itaú', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_com: '2026-10-01', data_pagamento: '2026-11-20', valor_texto: '' },
  // a definir: só data-com, sem pagamento
  { id: 'd', ticker: 'BBAS3', empresa: 'Banco do Brasil', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_com: '2026-11-10', data_pagamento: null, valor_texto: 'R$ 0,20' },
];

const diaComEvento = (rotulo) => screen.getByRole('button', { name: rotulo });

describe('CalendarioProventos', () => {
  it('abre no mês do próximo evento, com o dia desse evento selecionado', () => {
    renderizar(<CalendarioProventos eventos={eventos} hoje={HOJE} />);
    expect(screen.getByText('Novembro de 2026')).toBeInTheDocument();
    expect(diaComEvento('04/11/2026: 1 pagamento')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Proventos em 04/11/2026' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /PETR4/ })).toHaveAttribute('href', '/acao/PETR4?pergunta=proventos');
  });

  it('marca pagamento com bolinha e data-com com losango', () => {
    const { container } = renderizar(<CalendarioProventos eventos={eventos} hoje={HOJE} />);
    const com = diaComEvento('05/11/2026: 1 data-com');
    expect(com.querySelectorAll('.proventos-cal-marca-com')).toHaveLength(1);
    expect(com.querySelectorAll('.proventos-cal-marca-pag')).toHaveLength(0);

    const pagamentos = diaComEvento('20/11/2026: 2 pagamentos');
    expect(pagamentos.querySelectorAll('.proventos-cal-marca-pag')).toHaveLength(2);

    // data-com a definir aparece como data-com, sem pagamento
    expect(diaComEvento('10/11/2026: 1 data-com')).toBeInTheDocument();
    // dia sem evento não é botão
    expect(container.querySelector('[data-hoje]').textContent).toBe('2');
  });

  it('o dia selecionado lista os proventos dele', () => {
    renderizar(<CalendarioProventos eventos={eventos} hoje={HOJE} />);
    fireEvent.click(diaComEvento('20/11/2026: 2 pagamentos'));
    expect(diaComEvento('20/11/2026: 2 pagamentos')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Proventos em 20/11/2026' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /VALE3/ })).toHaveAttribute('href', '/acao/VALE3?pergunta=proventos');
    expect(screen.getByRole('link', { name: /ITSA4/ })).toBeInTheDocument();
  });

  it('trocar de mês seleciona o primeiro dia com evento; mês vazio mostra a frase', () => {
    renderizar(<CalendarioProventos eventos={eventos} hoje={HOJE} />);
    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(screen.getByText('Dezembro de 2026')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma empresa marcou pagamento neste mês.')).toBeInTheDocument();
    expect(document.querySelector('.proventos-cal-itens')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }));
    expect(screen.getByText('Novembro de 2026')).toBeInTheDocument();
    expect(diaComEvento('04/11/2026: 1 pagamento')).toHaveAttribute('aria-pressed', 'true');
  });

  it('sem nenhuma data futura, abre no mês de hoje com a frase do mês vazio', () => {
    renderizar(<CalendarioProventos eventos={[]} hoje={HOJE} />);
    expect(screen.getByText('Novembro de 2026')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma empresa marcou pagamento neste mês.')).toBeInTheDocument();
  });
});
