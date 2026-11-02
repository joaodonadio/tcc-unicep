import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { PreferenciasProvider } from '../../context/PreferenciasProvider.jsx';
import { usePreferencias } from '../../context/contextos.js';

const CHAVE = 'painel-b3:preferencias';
const CONSULTA = '(prefers-reduced-motion: reduce)';

let reduzSistema;
let ouvintes;

/** matchMedia simulado: a preferência do sistema é `reduzSistema`, e mudá-la avisa os ouvintes. */
function mockarSistema(reduz) {
  reduzSistema = reduz;
  ouvintes = new Set();
  window.matchMedia = vi.fn((consulta) => ({
    media: consulta,
    get matches() {
      return consulta === CONSULTA && reduzSistema;
    },
    addEventListener: (_evento, fn) => ouvintes.add(fn),
    removeEventListener: (_evento, fn) => ouvintes.delete(fn),
  }));
}

function mudarSistema(reduz) {
  reduzSistema = reduz;
  act(() => ouvintes.forEach((fn) => fn({ matches: reduz })));
}

/** Mostra o movimento efetivo e oferece os três botões de preferência. */
function Sonda() {
  const { movimento, movimentoReduzido, definirMovimento } = usePreferencias();
  return (
    <div>
      <p aria-label="Movimento salvo">{movimento}</p>
      <p aria-label="Movimento efetivo">{movimentoReduzido ? 'reduzido' : 'livre'}</p>
      <button type="button" onClick={() => definirMovimento('sistema')}>
        pedir sistema
      </button>
      <button type="button" onClick={() => definirMovimento('ligadas')}>
        pedir ligadas
      </button>
      <button type="button" onClick={() => definirMovimento('desligadas')}>
        pedir desligadas
      </button>
    </div>
  );
}

const montar = () =>
  render(
    <PreferenciasProvider>
      <Sonda />
    </PreferenciasProvider>,
  );

const efetivo = () => screen.getByLabelText('Movimento efetivo').textContent;
const salvo = () => JSON.parse(localStorage.getItem(CHAVE));

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.movimento;
});

afterEach(() => {
  delete window.matchMedia;
});

describe('PreferenciasProvider: Animações', () => {
  it('o padrão segue o sistema: com movimento reduzido no sistema, o site fica parado', () => {
    mockarSistema(true);
    montar();
    expect(screen.getByLabelText('Movimento salvo')).toHaveTextContent('sistema');
    expect(efetivo()).toBe('reduzido');
    expect(document.documentElement.dataset.movimento).toBe('reduzido');
  });

  it('o padrão segue o sistema: sem pedido de menos movimento, o site fica livre', () => {
    mockarSistema(false);
    montar();
    expect(efetivo()).toBe('livre');
    expect(document.documentElement.dataset.movimento).toBe('livre');
  });

  it('a mudança do sistema com o site aberto vale no modo sistema', () => {
    mockarSistema(false);
    montar();
    mudarSistema(true);
    expect(efetivo()).toBe('reduzido');
    expect(document.documentElement.dataset.movimento).toBe('reduzido');
  });

  it('ligadas força o movimento livre, mesmo com o sistema pedindo menos', () => {
    mockarSistema(true);
    montar();
    fireEvent.click(screen.getByRole('button', { name: 'pedir ligadas' }));
    expect(efetivo()).toBe('livre');
    expect(document.documentElement.dataset.movimento).toBe('livre');
    mudarSistema(false);
    expect(efetivo()).toBe('livre');
  });

  it('desligadas força o movimento reduzido, mesmo com o sistema livre', () => {
    mockarSistema(false);
    montar();
    fireEvent.click(screen.getByRole('button', { name: 'pedir desligadas' }));
    expect(efetivo()).toBe('reduzido');
    expect(document.documentElement.dataset.movimento).toBe('reduzido');
  });

  it('a escolha persiste no localStorage, junto das outras preferências', () => {
    mockarSistema(false);
    const { unmount } = montar();
    fireEvent.click(screen.getByRole('button', { name: 'pedir desligadas' }));
    expect(salvo()).toMatchObject({ movimento: 'desligadas' });
    unmount();

    montar();
    expect(screen.getByLabelText('Movimento salvo')).toHaveTextContent('desligadas');
    expect(efetivo()).toBe('reduzido');
  });

  it('um valor inválido salvo volta para o padrão sistema', () => {
    localStorage.setItem(CHAVE, JSON.stringify({ nivel: 'tecnico', movimento: 'turbo' }));
    mockarSistema(false);
    montar();
    expect(screen.getByLabelText('Movimento salvo')).toHaveTextContent('sistema');
    expect(efetivo()).toBe('livre');
  });

  it('ao sair do provider, a marcação da raiz é removida', () => {
    mockarSistema(true);
    const { unmount } = montar();
    unmount();
    expect(document.documentElement.dataset.movimento).toBeUndefined();
  });
});

describe('PreferenciasProvider: sem matchMedia (ambiente de teste)', () => {
  it('não quebra e considera o movimento livre no padrão', () => {
    delete window.matchMedia;
    montar();
    expect(efetivo()).toBe('livre');
  });
});
