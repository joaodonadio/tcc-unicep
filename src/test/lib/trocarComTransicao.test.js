import { afterEach, describe, expect, it, vi } from 'vitest';
import { trocarComTransicao } from '../../lib/movimento.js';

describe('trocarComTransicao', () => {
  afterEach(() => {
    delete document.startViewTransition;
    delete document.documentElement.dataset.movimento;
    vi.restoreAllMocks();
  });

  it('sem a API de transição de vista, chama a função direto', () => {
    const fn = vi.fn();
    trocarComTransicao(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('com a API, passa a troca para startViewTransition', () => {
    const iniciar = vi.fn((cb) => cb());
    document.startViewTransition = iniciar;
    const fn = vi.fn();
    trocarComTransicao(fn);
    expect(iniciar).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('com movimento reduzido, não usa a transição mesmo com a API', () => {
    const iniciar = vi.fn((cb) => cb());
    document.startViewTransition = iniciar;
    document.documentElement.dataset.movimento = 'reduzido';
    const fn = vi.fn();
    trocarComTransicao(fn);
    expect(iniciar).not.toHaveBeenCalled();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
