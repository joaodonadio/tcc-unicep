import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Modelo3D from '../../components/modelos3d/Modelo3D.jsx';
import { BlocoObjeto3D } from '../../components/modelos3d/BlocoObjeto3D.jsx';
import { TEXTOS } from '../../lib/textos.js';

// jsdom não tem WebGL: o componente mostra só a frase-resposta.
describe('Modelo3D sem WebGL', () => {
  it('mostra a frase-resposta e não monta o palco', () => {
    render(<Modelo3D tipo="moedas" dados={{ pl: 7.9, plSetor: 11.4 }} ticker="PETR4" />);
    expect(screen.getByText('Está cara?')).toBeInTheDocument();
    expect(screen.getByText(/Mais barata que o setor: custa 7,9 anos de lucro; o setor custa 11,4\./)).toBeInTheDocument();
    expect(screen.queryByTestId('modelo3d-palco')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('sem número mostra a frase de ausência', () => {
    render(<Modelo3D tipo="moedas" dados={{ pl: null, plSetor: 5 }} ticker="PETR4" />);
    expect(screen.getByText('Teve prejuízo, então não dá para medir.')).toBeInTheDocument();
  });

  it.each([
    ['balanca', { dlEbitda: 1.2, dlEbitdaSetor: 2 }],
    ['cofrinho', { dy: 0.06, dySetor: 0.05 }],
    ['pendulo', { beta: 1.4 }],
  ])('%s mostra a pergunta', (tipo, dados) => {
    render(<Modelo3D tipo={tipo} dados={dados} ticker="PETR4" />);
    expect(screen.getByText(TEXTOS.modelos3d.frases[tipo].pergunta)).toBeInTheDocument();
  });
});

describe('BlocoObjeto3D', () => {
  const resumo = { beta: { valor: 0.9, status: 'ok' } };

  it('modo simples: título e frase sempre visíveis', () => {
    render(<BlocoObjeto3D pergunta="oscila" resumo={resumo} ticker="PETR4" tecnico={false} />);
    expect(screen.getByRole('heading', { name: TEXTOS.modelos3d.titulo })).toBeInTheDocument();
    expect(screen.getByText(/Parecido com a bolsa/)).toBeInTheDocument();
  });

  it('modo técnico: recolhido em details, sem frase até abrir', () => {
    render(<BlocoObjeto3D pergunta="oscila" resumo={resumo} ticker="PETR4" tecnico />);
    expect(screen.getByText(TEXTOS.modelos3d.detalhesTecnico)).toBeInTheDocument();
    expect(screen.queryByText(/Parecido com a bolsa/)).not.toBeInTheDocument();
  });

  it('pergunta sem objeto ou sem resumo não renderiza nada', () => {
    const { container, rerender } = render(<BlocoObjeto3D pergunta="noticias" resumo={resumo} ticker="X" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<BlocoObjeto3D pergunta="oscila" resumo={null} ticker="X" />);
    expect(container).toBeEmptyDOMElement();
  });
});
