import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderizar } from '../apoio/renderizar.jsx';
import ControlesLeitura from '../../components/layout/ControlesLeitura.jsx';
import { TEXTOS } from '../../lib/textos.js';

const CHAVE = 'painel-b3:preferencias';

function abrirLeitura() {
  fireEvent.click(screen.getByRole('button', { name: TEXTOS.leitura.botao }));
}

const grupoAnimacoes = () => screen.getByRole('group', { name: TEXTOS.leitura.animacoes });

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.movimento;
});

describe('ControlesLeitura: Animações', () => {
  it('mostra o grupo com três botões e o padrão Seguir o sistema marcado', () => {
    renderizar(<ControlesLeitura />);
    abrirLeitura();

    const grupo = grupoAnimacoes();
    const botoes = within(grupo).getAllByRole('button');
    expect(botoes.map((b) => b.textContent)).toEqual([
      TEXTOS.leitura.movSistema,
      TEXTOS.leitura.movLigadas,
      TEXTOS.leitura.movDesligadas,
    ]);
    expect(within(grupo).getByRole('button', { name: TEXTOS.leitura.movSistema })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(grupo).getByRole('button', { name: TEXTOS.leitura.movLigadas })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(within(grupo).getByRole('button', { name: TEXTOS.leitura.movDesligadas })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('mostra a frase de ajuda sobre o computador que desliga as animações', () => {
    renderizar(<ControlesLeitura />);
    abrirLeitura();
    expect(
      screen.getByText('Se o seu computador desliga as animações, escolha Ligadas para vê-las aqui.'),
    ).toBeVisible();
  });

  it('escolher Ligadas move o aria-pressed e grava a preferência', () => {
    renderizar(<ControlesLeitura />);
    abrirLeitura();

    const grupo = grupoAnimacoes();
    fireEvent.click(within(grupo).getByRole('button', { name: TEXTOS.leitura.movLigadas }));

    expect(within(grupo).getByRole('button', { name: TEXTOS.leitura.movLigadas })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(grupo).getByRole('button', { name: TEXTOS.leitura.movSistema })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(JSON.parse(localStorage.getItem(CHAVE))).toMatchObject({ movimento: 'ligadas' });
  });
});
