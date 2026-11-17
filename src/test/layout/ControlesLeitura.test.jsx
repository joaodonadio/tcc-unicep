import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderizar } from '../apoio/renderizar.jsx';
import ControlesLeitura from '../../components/layout/ControlesLeitura.jsx';
import { TEXTOS } from '../../lib/textos.js';

const CHAVE = 'painel-b3:preferencias';
const CONSULTA = '(prefers-reduced-motion: reduce)';

/** matchMedia simulado: o sistema pede movimento reduzido só quando `reduz` é verdadeiro. */
function mockarSistema(reduz) {
  window.matchMedia = vi.fn((consulta) => ({
    media: consulta,
    matches: consulta === CONSULTA && reduz,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function abrirLeitura() {
  fireEvent.click(screen.getByRole('button', { name: TEXTOS.leitura.botao }));
}

const grupoExplicacoes = () => screen.getByRole('group', { name: TEXTOS.leitura.explicacoes });
const grupoAnimacoes = () => screen.getByRole('group', { name: TEXTOS.leitura.animacoes });
const grupoTamanho = () => screen.getByRole('group', { name: TEXTOS.leitura.texto });

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.movimento;
  mockarSistema(false);
});

afterEach(() => {
  delete window.matchMedia;
});

describe('ControlesLeitura: Animações', () => {
  it('mostra só Ligadas e Desligadas, sem Seguir o sistema', () => {
    renderizar(<ControlesLeitura />);
    abrirLeitura();

    const botoes = within(grupoAnimacoes()).getAllByRole('button');
    expect(botoes.map((b) => b.textContent)).toEqual([TEXTOS.leitura.movLigadas, TEXTOS.leitura.movDesligadas]);
    expect(screen.queryByText('Seguir o sistema')).not.toBeInTheDocument();
    expect(screen.queryByText(/Se o seu computador desliga/)).not.toBeInTheDocument();
  });

  it('o inicial segue o sistema: com o sistema pedindo menos movimento, Desligadas fica marcada', () => {
    mockarSistema(true);
    renderizar(<ControlesLeitura />);
    abrirLeitura();

    const grupo = grupoAnimacoes();
    expect(within(grupo).getByRole('button', { name: TEXTOS.leitura.movDesligadas })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(grupo).getByRole('button', { name: TEXTOS.leitura.movLigadas })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('o inicial é Ligadas quando o sistema não pede menos movimento', () => {
    renderizar(<ControlesLeitura />);
    abrirLeitura();

    const grupo = grupoAnimacoes();
    expect(within(grupo).getByRole('button', { name: TEXTOS.leitura.movLigadas })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(grupo).getByRole('button', { name: TEXTOS.leitura.movDesligadas })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('escolher Desligadas move o aria-pressed e grava a preferência', () => {
    renderizar(<ControlesLeitura />);
    abrirLeitura();

    const grupo = grupoAnimacoes();
    fireEvent.click(within(grupo).getByRole('button', { name: TEXTOS.leitura.movDesligadas }));

    expect(within(grupo).getByRole('button', { name: TEXTOS.leitura.movDesligadas })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(grupo).getByRole('button', { name: TEXTOS.leitura.movLigadas })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(JSON.parse(localStorage.getItem(CHAVE))).toMatchObject({ movimento: 'desligadas' });
  });
});

describe('ControlesLeitura: Explicações', () => {
  it('mostra só a descrição do modo escolhido', () => {
    renderizar(<ControlesLeitura />);
    abrirLeitura();

    expect(screen.getByText(TEXTOS.leitura.dicaSimples)).toBeVisible();
    expect(screen.queryByText(TEXTOS.leitura.dicaTecnica)).not.toBeInTheDocument();
  });

  it('ao escolher Técnico, a descrição troca e a do Simples some', () => {
    renderizar(<ControlesLeitura />);
    abrirLeitura();

    fireEvent.click(within(grupoExplicacoes()).getByRole('button', { name: TEXTOS.leitura.tecnica }));

    expect(screen.getByText(TEXTOS.leitura.dicaTecnica)).toBeVisible();
    expect(screen.queryByText(TEXTOS.leitura.dicaSimples)).not.toBeInTheDocument();
    expect(within(grupoExplicacoes()).getByRole('button', { name: TEXTOS.leitura.tecnica })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('ControlesLeitura: Tamanho do texto', () => {
  it('"Voltar ao normal" só aparece quando o texto não está em 100%', () => {
    renderizar(<ControlesLeitura />);
    abrirLeitura();
    expect(screen.queryByRole('button', { name: TEXTOS.leitura.voltarNormal })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: TEXTOS.leitura.aumentar }));
    expect(screen.getByText('110%')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: TEXTOS.leitura.voltarNormal }));
    expect(screen.getByText('100%')).toBeVisible();
    expect(screen.queryByRole('button', { name: TEXTOS.leitura.voltarNormal })).not.toBeInTheDocument();
  });

  it('A− e A+ ficam dentro do grupo de tamanho', () => {
    renderizar(<ControlesLeitura />);
    abrirLeitura();
    expect(within(grupoTamanho()).getByRole('button', { name: TEXTOS.leitura.diminuir })).toBeEnabled();
    expect(within(grupoTamanho()).getByRole('button', { name: TEXTOS.leitura.aumentar })).toBeEnabled();
  });
});
