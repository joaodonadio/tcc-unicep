import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { DestaquesDoDia } from '../../components/hoje/DestaquesDoDia.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { pct, vezes } from '../../lib/formato.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

// maior alta e maior queda ficam no Resumo do pregão: o bloco só mostra o volume incomum
const ALERTAS = {
  alta: { ticker: 'AAAA3', empresa: 'Empresa A', variacao: 0.05 },
  queda: { ticker: 'BBBB3', empresa: 'Empresa B', variacao: -0.025 },
  volume: { itens: [{ ticker: 'CCCC3', empresa: 'Empresa C', vezes: 2.34 }] },
};

describe('DestaquesDoDia', () => {
  it('só volume incomum: "2,3×" e uma barra com a marca do normal, sem alta nem queda', () => {
    const { container } = renderizar(<DestaquesDoDia alertas={ALERTAS} />);
    expect(screen.getByText(vezes(2.34))).toBeInTheDocument();
    expect(screen.getByText(porNivel(TEXTOS.hoje.vezesMediana, 'simples')('2,3'))).toHaveClass('sr-only');
    expect(screen.queryByText(pct(0.05))).toBeNull();
    expect(screen.queryByText(pct(-0.025))).toBeNull();
    expect(container.querySelectorAll('.hoje-barra')).toHaveLength(1);
    expect(container.querySelectorAll('.hoje-barra-normal')).toHaveLength(1);
  });

  it('explicações e empresas ficam no painel, que abre pelo botão', () => {
    renderizar(<DestaquesDoDia alertas={ALERTAS} />);
    const botao = screen.getByRole('button', { name: TEXTOS.hoje.detalhes(porNivel(TEXTOS.hoje.destaquesTitulo, 'simples')) });
    const painel = document.getElementById(botao.getAttribute('aria-controls'));
    expect(painel).toHaveAttribute('inert');
    expect(within(painel).getByText(TEXTOS.hoje.quemE('CCCC3', 'Empresa C'))).toBeInTheDocument();
    expect(within(painel).getByText(porNivel(TEXTOS.hoje.volumeNota, 'simples'))).toBeInTheDocument();
    fireEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
  });

  it('sem volume incomum: o bloco não aparece', () => {
    const { container } = renderizar(<DestaquesDoDia alertas={{ alta: ALERTAS.alta, queda: ALERTAS.queda, volume: null }} />);
    expect(container.querySelector('section')).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });
});
