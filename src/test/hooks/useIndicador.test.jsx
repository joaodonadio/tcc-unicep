import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useIndicador } from '../../hooks/useIndicador.js';

function Trilho({ escolhido }) {
  const { trilhoRef, indicadorRef } = useIndicador(escolhido);
  return (
    <div ref={trilhoRef} data-testid="trilho">
      <span ref={indicadorRef} data-testid="indicador" />
      {['a', 'b'].map((k, i) => (
        <button
          key={k}
          type="button"
          data-x={i * 100}
          data-y={i * 50}
          data-indicador-alvo={k === escolhido ? 'true' : undefined}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

// medidas falsas: só os botões (com data-x) têm tamanho
const MEDIDAS = {
  offsetLeft() {
    return Number(this.dataset?.x ?? 0);
  },
  offsetTop() {
    return Number(this.dataset?.y ?? 0);
  },
  offsetWidth() {
    return this.dataset?.x != null ? 80 : 0;
  },
  offsetHeight() {
    return this.dataset?.x != null ? 40 : 0;
  },
};

describe('useIndicador', () => {
  it('sem medida (jsdom), fica desligado', () => {
    render(<Trilho escolhido="a" />);
    expect(screen.getByTestId('trilho')).not.toHaveAttribute('data-indicador');
    expect(screen.getByTestId('indicador').style.transform).toBe('');
  });

  describe('com medida', () => {
    const originais = {};
    beforeEach(() => {
      for (const [nome, get] of Object.entries(MEDIDAS)) {
        originais[nome] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, nome);
        Object.defineProperty(HTMLElement.prototype, nome, { configurable: true, get });
      }
    });
    afterEach(() => {
      for (const [nome, descritor] of Object.entries(originais)) {
        Object.defineProperty(HTMLElement.prototype, nome, descritor);
      }
    });

    it('fica sobre o escolhido e vai junto quando a escolha muda', () => {
      const { rerender } = render(<Trilho escolhido="a" />);
      const indicador = screen.getByTestId('indicador');
      expect(screen.getByTestId('trilho')).toHaveAttribute('data-indicador', 'ligado');
      expect(indicador.style.transform).toBe('translate(0px, 0px)');
      expect(indicador.style.width).toBe('80px');
      expect(indicador.style.transition).toBe('');

      rerender(<Trilho escolhido="b" />);
      expect(indicador.style.transform).toBe('translate(100px, 50px)');
    });
  });
});
