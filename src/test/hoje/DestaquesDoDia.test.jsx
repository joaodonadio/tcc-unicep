import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { DestaquesDoDia } from '../../components/hoje/DestaquesDoDia.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { pct, vezes } from '../../lib/formato.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const ALERTAS = {
  alta: { ticker: 'AAAA3', empresa: 'Empresa A', variacao: 0.05 },
  queda: { ticker: 'BBBB3', empresa: 'Empresa B', variacao: -0.025 },
  volume: { itens: [{ ticker: 'CCCC3', empresa: 'Empresa C', vezes: 2.34 }] },
};

describe('DestaquesDoDia', () => {
  it('linhas compactas: variação com sinal, "2,3×" e uma barra por linha', () => {
    const { container } = renderizar(<DestaquesDoDia alertas={ALERTAS} />);
    expect(screen.getByText(pct(0.05))).toBeInTheDocument();
    expect(screen.getByText(pct(-0.025))).toBeInTheDocument();
    expect(screen.getByText(vezes(2.34))).toBeInTheDocument();
    expect(screen.getByText(porNivel(TEXTOS.hoje.vezesMediana, 'simples')('2,3'))).toHaveClass('sr-only');
    expect(container.querySelectorAll('.hoje-barra')).toHaveLength(3);
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

  it('sem destaques: frase curta e sem botão de detalhes', () => {
    renderizar(<DestaquesDoDia alertas={{ alta: null, queda: null, volume: null }} />);
    expect(screen.getByText(porNivel(TEXTOS.hoje.semDestaques, 'simples'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mais sobre/ })).toBeNull();
  });
});
