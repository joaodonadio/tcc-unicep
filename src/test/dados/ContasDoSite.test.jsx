import { describe, expect, it } from 'vitest';
import ContasDoSite from '../../components/dados/ContasDoSite.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { screen } from '@testing-library/react';
import { porNivel, TEXTOS } from '../../lib/textos.js';

describe('ContasDoSite', () => {
  it('renderiza todas as contas, cada uma com âncora conta-<chave>', () => {
    const { container } = renderizar(<ContasDoSite />);
    const chaves = Object.keys(TEXTOS.contas.itens);
    expect(chaves).toHaveLength(11);
    expect(container.querySelectorAll('li[id^="conta-"]')).toHaveLength(11);
    chaves.forEach((chave) => {
      expect(container.querySelector(`#conta-${chave}`)).not.toBeNull();
    });
  });

  it('cada conta tem os rótulos Usa, Como e Aparece em', () => {
    const { container } = renderizar(<ContasDoSite />);
    const termos = container.querySelectorAll('#conta-selic dt');
    expect([...termos].map((t) => t.textContent)).toEqual([
      TEXTOS.contas.rotuloUsa,
      TEXTOS.contas.rotuloComo,
      TEXTOS.contas.rotuloOnde,
    ]);
  });

  it('fecha a grade com o cartão das datas, no mesmo formato e fora das contas', () => {
    const { container } = renderizar(<ContasDoSite />);
    const cartao = container.querySelector('#datas-do-site');
    expect(cartao).not.toBeNull();
    expect(container.querySelector('.contas-lista').lastElementChild).toBe(cartao);
    expect(screen.getByText(porNivel(TEXTOS.contas.datas.como, 'simples'))).toBeInTheDocument();
    expect(cartao.querySelectorAll('dt')).toHaveLength(3);
  });
});
