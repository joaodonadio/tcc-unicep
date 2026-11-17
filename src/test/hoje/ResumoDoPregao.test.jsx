import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ResumoDoPregao } from '../../components/hoje/ResumoDoPregao.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const F = TEXTOS.hoje.fatos;
const rotulo = (chave) => porNivel(F[chave], 'simples');

const fatos = {
  ibov: { pontos: 165529, variacao: -0.014 },
  amplitude: { subiram: 25, cairam: 60, estaveis: 0, total: 85 },
  maior_alta: { ticker: 'PETR4', empresa: 'Petrobras PN', variacao: 0.052 },
  maior_queda: { ticker: 'VALE3', empresa: 'Vale ON', variacao: -0.031 },
  dolar: { valor: 5.4, variacao: 0.004, suspeito: false },
  brent: { valor: null, variacao: null },
};

describe('ResumoDoPregao', () => {
  it('frase-guia com pontos e variação sempre com sinal', () => {
    const { container } = renderizar(<ResumoDoPregao fatos={fatos} resumo="Texto antigo." />);

    expect(container.querySelector('.hoje-lead').textContent).toBe(
      'O Ibovespa fechou em 165.529 pontos, −1,4% no dia.',
    );
    expect(container.querySelector('.hoje-lead-var')).toHaveAttribute('data-sinal', 'down');
    expect(container.textContent).not.toContain('Texto antigo.');
  });

  it('subiram e caíram com a régua escondida de leitores de tela', () => {
    const { container } = renderizar(<ResumoDoPregao fatos={fatos} resumo="" />);

    expect(screen.getByText(rotulo('amplitude'))).toBeInTheDocument();
    expect(container.querySelector('.hoje-fato dd').textContent).toBe('25 subiram · 60 caíram');
    expect(container.querySelector('.hoje-fato-regua')).toHaveAttribute('aria-hidden', 'true');
  });

  it('maior alta com link para a ação e variação com sinal', () => {
    renderizar(<ResumoDoPregao fatos={fatos} resumo="" />);

    expect(screen.getByRole('link', { name: 'PETR4' })).toHaveAttribute('href', '/acao/PETR4');
    expect(screen.getByText('+5,2%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'VALE3' })).toHaveAttribute('href', '/acao/VALE3');
  });

  it('omite o dólar suspeito e o Brent sem variação', () => {
    const suspeito = { ...fatos, dolar: { valor: 9, variacao: 0.4, suspeito: true } };
    renderizar(<ResumoDoPregao fatos={suspeito} resumo="" />);

    expect(screen.queryByText(rotulo('dolar'))).toBeNull();
    expect(screen.queryByText(rotulo('brent'))).toBeNull();
  });

  it('mostra o dólar quando o dado é confiável', () => {
    renderizar(<ResumoDoPregao fatos={fatos} resumo="" />);

    expect(screen.getByText(rotulo('dolar'))).toBeInTheDocument();
    expect(screen.getByText('+0,4%')).toBeInTheDocument();
  });

  it('sem fatos, mostra o parágrafo do resumo', () => {
    const { container } = renderizar(<ResumoDoPregao fatos={undefined} resumo="Resumo em texto." />);

    expect(container.querySelector('.hoje-resumo').textContent).toBe('Resumo em texto.');
    expect(container.querySelector('.hoje-fatos')).toBeNull();
  });
});
