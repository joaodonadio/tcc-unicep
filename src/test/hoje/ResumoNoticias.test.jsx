import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { ResumoNoticias } from '../../components/hoje/ResumoNoticias.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const TOM = { total: 1359, positivas: 375, neutras: 478, negativas: 506 };

describe('ResumoNoticias', () => {
  it('matriz de cem pontos descrita pelos percentuais, que também aparecem com a palavra', () => {
    const { container } = renderizar(<ResumoNoticias tom={TOM} sentimento="pessimista_moderado" />);
    // 375/478/506 de 1359: 27,6% / 35,2% / 37,2% -> 28 + 35 + 37 = 100
    expect(screen.getByRole('img', { name: TEXTOS.hoje.mini.tom('28%', '35%', '37%') })).toBeInTheDocument();
    const numeros = within(container.querySelector('.hoje-tom-numeros'));
    expect(numeros.getByText('28%')).toBeInTheDocument();
    expect(numeros.getByText('Negativas')).toBeInTheDocument();
  });

  it('contagem zero mostra 0%; contagem pequena que arredonda para zero mostra <1%', () => {
    const { container, unmount } = renderizar(<ResumoNoticias tom={{ total: 10, positivas: 7, neutras: 3, negativas: 0 }} />);
    expect(within(container.querySelector('.hoje-tom-numeros')).getByText('0%')).toBeInTheDocument();
    unmount();
    const outro = renderizar(<ResumoNoticias tom={{ total: 1000, positivas: 996, neutras: 1, negativas: 3 }} />);
    // 99,6 / 0,1 / 0,3 -> 100 / 0 / 0: neutras e negativas existem, então aparecem como <1%
    expect(within(outro.container.querySelector('.hoje-tom-numeros')).getAllByText('<1%')).toHaveLength(2);
  });

  it('frase-síntese visível e a explicação do tom no painel', () => {
    renderizar(<ResumoNoticias tom={TOM} sentimento="pessimista_moderado" />);
    expect(screen.getByText(porNivel(TEXTOS.hoje.sentimento.pessimista_moderado, 'simples'))).toBeInTheDocument();
    const botao = screen.getByRole('button', { name: TEXTOS.hoje.detalhes(porNivel(TEXTOS.hoje.noticiasTitulo, 'simples')) });
    const painel = document.getElementById(botao.getAttribute('aria-controls'));
    expect(painel).toHaveAttribute('inert');
    expect(within(painel).getByText(/manchetes classificadas/)).toBeInTheDocument();
    expect(within(painel).getByText('375 positivas, 478 neutras e 506 negativas.')).toBeInTheDocument();
  });
});
