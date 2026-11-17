import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useAlturaSuave } from '../../hooks/useAlturaSuave.js';

/** Lista de teste: a altura muda com o número de itens (aberta ou fechada). */
function Lista({ aberta }) {
  const ref = useRef(null);
  useAlturaSuave(ref, aberta);
  return (
    <ul ref={ref} data-testid="lista">
      <li>um</li>
      {aberta && <li>dois</li>}
    </ul>
  );
}

function Caso() {
  const [aberta, setAberta] = useState(false);
  return (
    <>
      <Lista aberta={aberta} />
      <button type="button" onClick={() => setAberta((v) => !v)}>alternar</button>
    </>
  );
}

/** Mede a altura a cada chamada: a primeira é a de antes, a segunda a de depois. */
function mockAlturas(valores) {
  let i = 0;
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    height: valores[Math.min(i++, valores.length - 1)],
    width: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON() {},
  }));
}

describe('useAlturaSuave', () => {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate');

  beforeEach(() => {
    document.documentElement.dataset.movimento = 'livre';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete document.documentElement.dataset.movimento;
    if (original) Object.defineProperty(HTMLElement.prototype, 'animate', original);
    else delete HTMLElement.prototype.animate;
  });

  it('sem el.animate (jsdom) não quebra e a troca de altura segue', () => {
    delete HTMLElement.prototype.animate;
    render(<Caso />);
    expect(() => fireEvent.click(screen.getByText('alternar'))).not.toThrow();
    expect(screen.getByText('dois')).toBeInTheDocument();
  });

  it('não anima na montagem', () => {
    const animate = vi.fn();
    HTMLElement.prototype.animate = animate;
    mockAlturas([40, 80]);
    render(<Caso />);
    expect(animate).not.toHaveBeenCalled();
  });

  it('com movimento reduzido não anima, mesmo com a altura mudando', () => {
    document.documentElement.dataset.movimento = 'reduzido';
    const animate = vi.fn();
    HTMLElement.prototype.animate = animate;
    mockAlturas([40, 80]);
    render(<Caso />);
    fireEvent.click(screen.getByText('alternar'));
    expect(animate).not.toHaveBeenCalled();
  });

  it('quando a dependência muda e a altura muda, anima de antes para depois', () => {
    const anim = { onfinish: null, oncancel: null, cancel: vi.fn() };
    const animate = vi.fn(() => anim);
    HTMLElement.prototype.animate = animate;
    mockAlturas([40, 80]);
    render(<Caso />);
    fireEvent.click(screen.getByText('alternar'));

    expect(animate).toHaveBeenCalledTimes(1);
    const [frames, opcoes] = animate.mock.calls[0];
    expect(frames).toEqual([{ height: '40px' }, { height: '80px' }]);
    expect(opcoes).toMatchObject({ duration: 280 });
    expect(screen.getByTestId('lista').style.overflow).toBe('hidden');

    act(() => anim.onfinish());
    expect(screen.getByTestId('lista').style.overflow).toBe('');
  });

  it('não anima quando a altura não muda', () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }));
    HTMLElement.prototype.animate = animate;
    mockAlturas([50, 50]);
    render(<Caso />);
    fireEvent.click(screen.getByText('alternar'));
    expect(animate).not.toHaveBeenCalled();
  });

  it('cancela a animação em curso quando vem outra e no desmonte', () => {
    const primeira = { cancel: vi.fn() };
    const segunda = { cancel: vi.fn() };
    const animate = vi.fn().mockReturnValueOnce(primeira).mockReturnValueOnce(segunda);
    HTMLElement.prototype.animate = animate;
    mockAlturas([40, 80, 80, 40]);
    const { unmount } = render(<Caso />);
    fireEvent.click(screen.getByText('alternar'));
    fireEvent.click(screen.getByText('alternar'));
    expect(primeira.cancel).toHaveBeenCalledTimes(1);
    unmount();
    expect(segunda.cancel).toHaveBeenCalledTimes(1);
  });
});
