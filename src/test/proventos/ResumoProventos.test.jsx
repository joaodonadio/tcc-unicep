import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ResumoProventos } from '../../components/proventos/ResumoProventos.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const HOJE = '2026-11-02';
const futuros = [
  { id: 'a', ticker: 'VALE3', empresa: 'Vale', tipo: 'JCP', tipo_rotulo: 'JCP', data_com: '2026-11-05', data_pagamento: '2026-11-20', valor_texto: 'R$ 0,30' },
  { id: 'b', ticker: 'PETR4', empresa: 'Petrobras', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_com: '2026-11-01', data_pagamento: '2026-11-04', valor_texto: 'R$ 0,50' },
  { id: 'c', ticker: 'ITSA4', empresa: 'Itaú', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_com: '2026-10-01', data_pagamento: '2026-11-20', valor_texto: '' },
];
const ranking = [{ posicao: 1, ticker: 'CCCC3', empresa: 'Gama', dy: 0.12, proporcao: 1 }];

const R = TEXTOS.proventos.resumo;

describe('ResumoProventos', () => {
  it('mostra a frase-guia com o mascote escondido e os blocos de fato', () => {
    const { container } = renderizar(
      <ResumoProventos
        futuros={futuros}
        aDefinir={[{ ticker: 'XXXX3' }]}
        eventos={futuros}
        hoje={HOJE}
        ranking={ranking}
      />,
    );
    expect(screen.getByText(porNivel(R.guia, 'simples'))).toBeInTheDocument();
    expect(screen.getByText(porNivel(R.proximo, 'simples'))).toBeInTheDocument();
    expect(screen.getByText(porNivel(R.marcados, 'simples'))).toBeInTheDocument();
    expect(screen.getByText(porNivel(R.mesPico, 'simples'))).toBeInTheDocument();
    expect(screen.getByText(porNivel(R.topo, 'simples'))).toBeInTheDocument();
    // os três pagamentos caem em novembro
    expect(screen.getByText('nov/2026')).toBeInTheDocument();
    expect(screen.getByText('3 pagamentos')).toBeInTheDocument();
    expect(screen.getByText('+ 1 com data a definir')).toBeInTheDocument();
    expect(container.querySelector('.proventos-resumo-mascote')).toHaveAttribute('aria-hidden', 'true');
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('o próximo pagamento linka para a ação e mostra valor, data e prazo', () => {
    renderizar(<ResumoProventos futuros={futuros} aDefinir={[]} eventos={futuros} hoje={HOJE} ranking={ranking} />);
    expect(screen.getByRole('link', { name: 'PETR4' })).toHaveAttribute('href', '/acao/PETR4?pergunta=proventos');
    expect(screen.getByText('R$ 0,50')).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el.tagName === 'SPAN' && el.textContent === 'paga em 04/11 · em 2 dias'),
    ).toBeInTheDocument();
  });

  it('sem dado o bloco não aparece, e nada vira 0 inventado', () => {
    const { container } = renderizar(
      <ResumoProventos futuros={undefined} aDefinir={undefined} eventos={[]} hoje={HOJE} ranking={[]} />,
    );
    expect(screen.queryByText(porNivel(R.proximo, 'simples'))).toBeNull();
    expect(screen.queryByText(porNivel(R.marcados, 'simples'))).toBeNull();
    expect(screen.queryByText(porNivel(R.topo, 'simples'))).toBeNull();
    expect(screen.getByText(porNivel(R.guia, 'simples'))).toBeInTheDocument();
    // sem agenda carregada, o calendário também não aparece
    expect(container.querySelector('.proventos-cal')).toBeNull();
  });

  it('o topo do ranking mostra o percentual e o ticker', () => {
    renderizar(<ResumoProventos futuros={futuros} aDefinir={[]} eventos={futuros} hoje={HOJE} ranking={ranking} />);
    expect(screen.getByText('12,0%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'CCCC3' })).toHaveAttribute('href', '/acao/CCCC3?pergunta=proventos');
  });

  it('o calendário ocupa o lugar dos avisos, com o título do nível simples', () => {
    const { container } = renderizar(
      <ResumoProventos futuros={futuros} aDefinir={[]} eventos={futuros} hoje={HOJE} ranking={ranking} />,
    );
    expect(screen.getByRole('heading', { name: 'Calendário de proventos' })).toBeInTheDocument();
    expect(container.querySelector('.proventos-cal')).not.toBeNull();
    expect(container.querySelector('.proventos-resumo-avisos')).toBeNull();
    expect(container.querySelector('[data-alerta]')).toBeNull();
  });

  it('carregando mostra esqueletos e espera o calendário', () => {
    const { container } = renderizar(
      <ResumoProventos futuros={undefined} aDefinir={undefined} eventos={[]} hoje={HOJE} ranking={[]} carregando />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(TEXTOS.dia.proventosCarregando);
    expect(container.querySelectorAll('.proventos-resumo-item')).toHaveLength(4);
    expect(container.querySelectorAll('.esqueleto')).toHaveLength(12);
    expect(container.querySelector('.proventos-cal')).toBeNull();
  });
});
