import { describe, expect, it } from 'vitest';
import { estiloDoIndicador, posicaoDoIndicador } from '../../lib/indicador.js';

describe('indicador de seleção', () => {
  it('lê a posição e o tamanho do item', () => {
    const alvo = { offsetLeft: 12, offsetTop: 80, offsetWidth: 240, offsetHeight: 72 };
    expect(posicaoDoIndicador(alvo)).toEqual({ x: 12, y: 80, largura: 240, altura: 72 });
  });

  it('sem medida utilizável (jsdom, oculto), null', () => {
    expect(posicaoDoIndicador(null)).toBeNull();
    expect(posicaoDoIndicador({ offsetLeft: 0, offsetTop: 0, offsetWidth: 0, offsetHeight: 0 })).toBeNull();
    expect(posicaoDoIndicador({ offsetLeft: 0, offsetTop: 0, offsetWidth: 10 })).toBeNull();
  });

  it('estilo: tamanho direto e posição por transform', () => {
    expect(estiloDoIndicador({ x: 12, y: 80, largura: 240, altura: 72 })).toEqual({
      width: '240px',
      height: '72px',
      transform: 'translate(12px, 80px)',
    });
    expect(estiloDoIndicador(null)).toBeNull();
  });
});
