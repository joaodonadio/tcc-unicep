import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { SeloCalculo } from '../../components/ui/SeloCalculo.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const CHAVE_PREFERENCIAS = 'painel-b3:preferencias';

describe('SeloCalculo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mostra o selo, a explicação simples e o link para a âncora da conta', () => {
    renderizar(<SeloCalculo conta="selic" />);
    expect(screen.getByText(TEXTOS.contas.selo)).toBeInTheDocument();
    expect(screen.getByText(porNivel(TEXTOS.contas.itens.selic.como, 'simples'))).toBeInTheDocument();
    const link = screen.getByRole('link', { name: TEXTOS.contas.comoFeito });
    expect(link).toHaveAttribute('href', '/dados#conta-selic');
  });

  it('com nível técnico mostra o texto técnico', () => {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizar(<SeloCalculo conta="dolar" />);
    expect(screen.getByText(TEXTOS.contas.itens.dolar.como.tecnico)).toBeInTheDocument();
    expect(screen.queryByText(TEXTOS.contas.itens.dolar.como.simples)).toBeNull();
  });

  it('com curto, esconde a explicação e mantém selo e link', () => {
    renderizar(<SeloCalculo conta="ipca" curto />);
    expect(screen.getByText(TEXTOS.contas.selo)).toBeInTheDocument();
    expect(screen.queryByText(porNivel(TEXTOS.contas.itens.ipca.como, 'simples'))).toBeNull();
    expect(screen.getByRole('link', { name: TEXTOS.contas.comoFeito })).toHaveAttribute('href', '/dados#conta-ipca');
  });

  it('conta desconhecida não renderiza nada', () => {
    const { container } = renderizar(<SeloCalculo conta="nao-existe" />);
    expect(container.querySelector('.selo-calculo')).toBeNull();
  });
});
