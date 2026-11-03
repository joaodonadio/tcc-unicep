import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BotaoDetalhes, PainelDetalhes } from '../../components/ui/Detalhes.jsx';
import { useDetalhes } from '../../hooks/useDetalhes.js';
import { TEXTOS } from '../../lib/textos.js';

function Cartao({ nome }) {
  const { aberto, alternar, id } = useDetalhes();
  return (
    <div>
      <BotaoDetalhes nome={nome} aberto={aberto} controla={id} onClick={alternar} />
      <PainelDetalhes id={id} aberto={aberto}>
        <p>{`Conteúdo de ${nome}`}</p>
      </PainelDetalhes>
    </div>
  );
}

describe('Detalhes: botão e painel recolhível', () => {
  it('começa fechado: aria-expanded false, painel com inert e conteúdo no DOM', () => {
    render(<Cartao nome="Teste" />);
    const botao = screen.getByRole('button', { name: TEXTOS.hoje.detalhes('Teste') });
    const painel = document.getElementById(botao.getAttribute('aria-controls'));
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(painel).toHaveAttribute('inert');
    expect(painel).not.toHaveAttribute('data-aberto');
    expect(screen.getByText('Conteúdo de Teste')).toBeInTheDocument();
  });

  it('abre e fecha ao clicar', () => {
    render(<Cartao nome="Teste" />);
    const botao = screen.getByRole('button', { name: TEXTOS.hoje.detalhes('Teste') });
    const painel = document.getElementById(botao.getAttribute('aria-controls'));
    fireEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(painel).not.toHaveAttribute('inert');
    expect(painel).toHaveAttribute('data-aberto', 'true');
    fireEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(painel).toHaveAttribute('inert');
  });

  it('dois cartões têm ids de painel diferentes', () => {
    render(
      <>
        <Cartao nome="A" />
        <Cartao nome="B" />
      </>,
    );
    const a = screen.getByRole('button', { name: TEXTOS.hoje.detalhes('A') }).getAttribute('aria-controls');
    const b = screen.getByRole('button', { name: TEXTOS.hoje.detalhes('B') }).getAttribute('aria-controls');
    expect(a).not.toBe(b);
  });

  it('com texto visível, o texto é o nome do botão', () => {
    render(<BotaoDetalhes texto="Como escolhemos" aberto={false} controla="painel-x" onClick={() => {}} />);
    const botao = screen.getByRole('button', { name: 'Como escolhemos' });
    expect(botao).not.toHaveAttribute('aria-label');
    expect(botao).toHaveClass('detalhes-botao--texto');
    expect(botao).toHaveAttribute('aria-controls', 'painel-x');
  });
});
