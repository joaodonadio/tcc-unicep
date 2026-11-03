import { afterEach, describe, expect, it, vi } from 'vitest';
import { trazerParaVista } from '../../lib/movimento.js';

const FAIXA_QUE_ROLA = { scrollWidth: 600, clientWidth: 300 };

describe('trazerParaVista', () => {
  afterEach(() => {
    delete document.documentElement.dataset.movimento;
  });

  it('rola suave na faixa que rola', () => {
    document.documentElement.dataset.movimento = 'livre';
    const el = { scrollIntoView: vi.fn() };
    expect(trazerParaVista(el, FAIXA_QUE_ROLA)).toBe(true);
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  });

  it('com movimento reduzido, vai direto, sem rolagem suave', () => {
    document.documentElement.dataset.movimento = 'reduzido';
    const el = { scrollIntoView: vi.fn() };
    trazerParaVista(el, FAIXA_QUE_ROLA);
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
  });

  it('sem rolagem na faixa ou sem suporte, não faz nada', () => {
    const el = { scrollIntoView: vi.fn() };
    expect(trazerParaVista(el, { scrollWidth: 300, clientWidth: 300 })).toBe(false);
    expect(trazerParaVista(el, null)).toBe(false);
    expect(trazerParaVista({}, FAIXA_QUE_ROLA)).toBe(false);
    expect(el.scrollIntoView).not.toHaveBeenCalled();
  });
});
