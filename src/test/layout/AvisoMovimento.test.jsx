import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderizar } from '../apoio/renderizar.jsx';
import AvisoMovimento from '../../components/layout/AvisoMovimento.jsx';
import { TEXTOS } from '../../lib/textos.js';

const CHAVE_PREFERENCIAS = 'painel-b3:preferencias';
const CHAVE_AVISO = 'painel-b3:aviso-movimento';
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

const aviso = () => screen.queryByRole('region', { name: TEXTOS.leitura.avisoTitulo });

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.movimento;
});

afterEach(() => {
  delete window.matchMedia;
});

describe('AvisoMovimento', () => {
  it('aparece quando o sistema pede movimento reduzido e ainda não houve resposta', () => {
    mockarSistema(true);
    renderizar(<AvisoMovimento />);

    expect(aviso()).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.leitura.avisoTitulo)).toBeVisible();
    expect(screen.getByText(TEXTOS.leitura.avisoFrase)).toBeVisible();
    expect(screen.getByRole('button', { name: TEXTOS.leitura.avisoLigar })).toBeVisible();
    expect(screen.getByRole('button', { name: TEXTOS.leitura.avisoManter })).toBeVisible();
  });

  it('Ligar neste site define as animações como ligadas, grava a resposta e some', () => {
    mockarSistema(true);
    renderizar(<AvisoMovimento />);

    fireEvent.click(screen.getByRole('button', { name: TEXTOS.leitura.avisoLigar }));

    expect(aviso()).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(CHAVE_PREFERENCIAS))).toMatchObject({ movimento: 'ligadas' });
    expect(localStorage.getItem(CHAVE_AVISO)).toBe('1');
  });

  it('Manter desligadas define as animações como desligadas, grava a resposta e some', () => {
    mockarSistema(true);
    renderizar(<AvisoMovimento />);

    fireEvent.click(screen.getByRole('button', { name: TEXTOS.leitura.avisoManter }));

    expect(aviso()).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(CHAVE_PREFERENCIAS))).toMatchObject({ movimento: 'desligadas' });
    expect(localStorage.getItem(CHAVE_AVISO)).toBe('1');
  });

  it('não aparece quando já houve resposta salva', () => {
    mockarSistema(true);
    localStorage.setItem(CHAVE_AVISO, '1');
    renderizar(<AvisoMovimento />);

    expect(aviso()).not.toBeInTheDocument();
  });

  it('não aparece quando o sistema não pede movimento reduzido', () => {
    mockarSistema(false);
    renderizar(<AvisoMovimento />);

    expect(aviso()).not.toBeInTheDocument();
  });
});
