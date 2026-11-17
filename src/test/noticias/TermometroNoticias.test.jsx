import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { TermometroNoticias } from '../../components/noticias/TermometroNoticias.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const tom = (total) => ({ total, positivas: total, neutras: 0, negativas: 0 });
const TOM = { total: 1482, positivas: 328, neutras: 473, negativas: 681 };

describe('TermometroNoticias com poucas manchetes', () => {
  it('avisa quando há menos de 20 manchetes classificadas', () => {
    renderizar(<TermometroNoticias tom={tom(7)} totalEmpresas={3} sentimento="neutro" />);
    expect(screen.getByText(porNivel(TEXTOS.paginas.poucasManchetes, 'simples')(7, 3))).toBeInTheDocument();
  });

  it('não avisa com 20 ou mais', () => {
    renderizar(<TermometroNoticias tom={tom(20)} totalEmpresas={9} sentimento="neutro" />);
    expect(screen.queryByText(/classificou só/)).not.toBeInTheDocument();
  });
});

describe('TermometroNoticias: legenda e total', () => {
  it('mostra o total de manchetes lidas com o número em destaque', () => {
    renderizar(<TermometroNoticias tom={TOM} totalEmpresas={20} sentimento="pessimista" />);
    expect(screen.getByText('1.482')).toHaveClass('num');
    expect(screen.getByText(TEXTOS.dia.palavraLidas(1482), { exact: false })).toBeInTheDocument();
  });

  it('cada tom na legenda traz palavra, número e porcentagem', () => {
    const { container } = renderizar(<TermometroNoticias tom={TOM} totalEmpresas={20} sentimento="pessimista" />);
    const positivas = container.querySelector('.noticias-legenda [data-contagem="positivas"]');
    expect(positivas.textContent).toContain(TEXTOS.dia.manchetesPositivas);
    expect(positivas.textContent).toContain('328');
    expect(positivas.textContent).toContain('22%');
    // ícone decorativo: o sinal é a palavra e o ícone não é lido
    expect(positivas.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('a barra é decorativa (aria-hidden) e tem uma fatia por tom', () => {
    const { container } = renderizar(<TermometroNoticias tom={TOM} totalEmpresas={20} sentimento="pessimista" />);
    const barra = container.querySelector('.noticias-barra');
    expect(barra).toHaveAttribute('aria-hidden', 'true');
    expect(barra.querySelectorAll('span')).toHaveLength(3);
  });

  it('contagem ausente vira traço com aviso de indisponível, sem barra e sem 0', () => {
    const { container } = renderizar(
      <TermometroNoticias tom={{ ...TOM, neutras: null }} totalEmpresas={20} sentimento="neutro" />,
    );
    const neutras = container.querySelector('.noticias-legenda [data-contagem="neutras"]');
    expect(neutras.textContent).toContain('—');
    expect(within(neutras).getByText('Indisponível')).toBeInTheDocument();
    expect(neutras.textContent).not.toMatch(/\b0\b/);
    expect(container.querySelector('.noticias-barra')).toBeNull();
  });

  it('a nota do FinBERT aparece em linha curta e simples', () => {
    renderizar(<TermometroNoticias tom={TOM} totalEmpresas={20} sentimento="neutro" />);
    expect(screen.getByText(porNivel(TEXTOS.dia.noticiasNota, 'simples'))).toBeInTheDocument();
  });
});

describe('TermometroNoticias: cor e frase do sentimento', () => {
  it('pessimista usa a cor de queda e a frase do sentimento', () => {
    const { container } = renderizar(<TermometroNoticias tom={TOM} totalEmpresas={20} sentimento="pessimista" />);
    expect(container.querySelector('.noticias-termometro')).toHaveAttribute('data-brilho', 'queda');
    expect(screen.getByText(porNivel(TEXTOS.dia.sentimento.pessimista, 'simples'))).toBeInTheDocument();
  });

  it('sem sentimento, a frase é indisponível e a cor é a neutra', () => {
    const { container } = renderizar(<TermometroNoticias tom={null} totalEmpresas={0} sentimento={null} />);
    expect(container.querySelector('.noticias-termometro')).toHaveAttribute('data-brilho', 'aco');
    expect(container.querySelector('.noticias-frase').textContent).toBe('Indisponível');
  });
});
