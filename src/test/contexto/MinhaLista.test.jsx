import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderizar } from '../apoio/renderizar.jsx';
import { useMinhaLista } from '../../context/contextos.js';
import { BotaoGuardar } from '../../components/ui/BotaoGuardar.jsx';
import { TEXTOS } from '../../lib/textos.js';

const CHAVE = 'painel-b3:lista';

/** Lista os tickers do contexto, para checar o estado sem depender de classe. */
function Lista() {
  const { tickers } = useMinhaLista();
  return (
    <ul aria-label="Minha lista">
      {tickers.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

/** Dispara alternar() pelo contexto, sem botão. */
let alternarExterno;
function Alternador() {
  const { alternar } = useMinhaLista();
  alternarExterno = alternar;
  return null;
}

const gravado = () => JSON.parse(localStorage.getItem(CHAVE));

beforeEach(() => {
  localStorage.clear();
});

describe('Minha lista', () => {
  it('alternar adiciona e depois remove o ticker', () => {
    renderizar(
      <>
        <Alternador />
        <Lista />
      </>,
    );

    act(() => alternarExterno('PETR4'));
    expect(screen.getByRole('listitem')).toHaveTextContent('PETR4');

    act(() => alternarExterno('PETR4'));
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('grava a lista na chave painel-b3:lista', () => {
    renderizar(<Alternador />);

    act(() => alternarExterno('VALE3'));

    expect(gravado()).toEqual(['VALE3']);
  });

  it('JSON inválido no storage vira lista vazia, sem quebrar', () => {
    localStorage.setItem(CHAVE, '{isto-nao-e-json');

    renderizar(<Lista />);

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('não duplica um ticker que já está no storage', () => {
    localStorage.setItem(CHAVE, JSON.stringify(['PETR4', 'petr4', 'PETR4']));

    renderizar(<Lista />);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('normaliza o ticker para maiúsculas ao alternar', () => {
    renderizar(<Alternador />);

    act(() => alternarExterno('petr4'));

    expect(gravado()).toEqual(['PETR4']);
  });

  it('BotaoGuardar muda aria-pressed ao clicar', () => {
    renderizar(<BotaoGuardar ticker="ITUB4" />);

    const botao = screen.getByRole('button', { name: TEXTOS.guardar.guardarAcao('ITUB4') });
    expect(botao).toHaveAttribute('aria-pressed', 'false');
    expect(botao).toHaveTextContent(TEXTOS.guardar.guardar);

    fireEvent.click(botao);

    // o nome acessível é fixo; o estado marcado vai só em aria-pressed
    expect(botao).toHaveAttribute('aria-pressed', 'true');
    expect(botao).toHaveTextContent(TEXTOS.guardar.guardada);
  });

  it('sincroniza quando outra aba altera o storage', () => {
    renderizar(<Lista />);
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();

    localStorage.setItem(CHAVE, JSON.stringify(['BBAS3']));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CHAVE }));
    });

    expect(screen.getByRole('listitem')).toHaveTextContent('BBAS3');
  });
});
