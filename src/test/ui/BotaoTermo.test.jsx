import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { BotaoTermo } from '../../components/ui/BotaoTermo.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { EXPLICACOES } from '../../lib/explicacoes.js';
import { TEXTOS } from '../../lib/textos.js';

function DoisTermos() {
  return (
    <p>
      <BotaoTermo chave="pregao">o pregão</BotaoTermo> e <BotaoTermo chave="sinais">os sinais</BotaoTermo>
    </p>
  );
}

describe('BotaoTermo', () => {
  it('clicar abre um balão só com a explicação do termo', () => {
    renderizar(<DoisTermos />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'o pregão' }));

    expect(screen.getByRole('dialog', { name: EXPLICACOES.pregao.titulo })).toBeInTheDocument();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('aria-expanded vira true ao abrir e aria-controls aponta para o balão', () => {
    renderizar(<DoisTermos />);
    const termo = screen.getByRole('button', { name: 'o pregão' });
    expect(termo).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(termo);

    expect(termo).toHaveAttribute('aria-expanded', 'true');
    expect(termo.getAttribute('aria-controls')).toBe(
      screen.getByRole('dialog', { name: EXPLICACOES.pregao.titulo }).id,
    );
  });

  it('ao abrir, o foco vai para o balão', () => {
    renderizar(<DoisTermos />);
    fireEvent.click(screen.getByRole('button', { name: 'o pregão' }));
    expect(screen.getByRole('dialog', { name: EXPLICACOES.pregao.titulo })).toHaveFocus();
  });

  it('Esc fecha o balão e devolve o foco ao termo', () => {
    renderizar(<DoisTermos />);
    const termo = screen.getByRole('button', { name: 'o pregão' });
    fireEvent.click(termo);
    const dialogo = screen.getByRole('dialog', { name: EXPLICACOES.pregao.titulo });

    fireEvent.keyDown(dialogo, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(termo).toHaveAttribute('aria-expanded', 'false');
    expect(termo).toHaveFocus();
  });

  it('o botão Fechar do balão fecha e devolve o foco ao termo', () => {
    renderizar(<DoisTermos />);
    const termo = screen.getByRole('button', { name: 'o pregão' });
    fireEvent.click(termo);

    fireEvent.click(screen.getByRole('button', { name: TEXTOS.termo.fechar }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(termo).toHaveFocus();
  });

  it('clique fora fecha o balão', () => {
    renderizar(<DoisTermos />);
    fireEvent.click(screen.getByRole('button', { name: 'o pregão' }));

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abrir outro termo fecha o primeiro: só um balão por vez', () => {
    renderizar(<DoisTermos />);
    const pregao = screen.getByRole('button', { name: 'o pregão' });
    const sinais = screen.getByRole('button', { name: 'os sinais' });

    fireEvent.click(pregao);
    fireEvent.click(sinais);

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: EXPLICACOES.sinais.titulo })).toBeInTheDocument();
    expect(pregao).toHaveAttribute('aria-expanded', 'false');
    expect(sinais).toHaveAttribute('aria-expanded', 'true');
  });

  it('chave desconhecida mostra só o texto, sem botão', () => {
    renderizar(<BotaoTermo chave="chave_que_nao_existe">texto simples</BotaoTermo>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('texto simples')).toBeInTheDocument();
  });
});
