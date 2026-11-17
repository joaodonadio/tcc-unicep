import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { ManchetesPorTom } from '../../components/noticias/ManchetesPorTom.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS } from '../../lib/textos.js';

const tom = { total: 2, positivas: 1, neutras: 0, negativas: 1 };
const manchetes = {
  positivo: [
    {
      tag: 'PETR4',
      tom: 'positivo',
      titulo: 'Petrobras sobe forte',
      link: 'https://exemplo.com/petro',
      fonte: 'Valor · 22/10/2026 às 17h19',
    },
  ],
  negativo: [
    {
      tag: 'VALE3',
      tom: 'negativo',
      titulo: 'Vale cai no dia',
      link: 'https://exemplo.com/vale',
      fonte: 'G1 · 22/10/2026, sem horário',
    },
  ],
};

const linksPara = (href) => screen.getAllByRole('link').filter((a) => a.getAttribute('href') === href);
const aba = (rotulo) => screen.getByRole('tab', { name: new RegExp(rotulo) });
const painel = () => screen.getByRole('tabpanel');

describe('ManchetesPorTom: abas', () => {
  it('três abas na ordem Positivas, Neutras, Negativas, com aba inicial a primeira com manchetes', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={manchetes} />);

    const abas = screen.getAllByRole('tab');
    expect(abas.map((a) => a.textContent)).toEqual([
      expect.stringContaining(TEXTOS.dia.manchetesPositivas),
      expect.stringContaining(TEXTOS.dia.manchetesNeutras),
      expect.stringContaining(TEXTOS.dia.manchetesNegativas),
    ]);
    expect(aba(TEXTOS.dia.manchetesPositivas)).toHaveAttribute('aria-selected', 'true');
    expect(aba(TEXTOS.dia.manchetesNegativas)).toHaveAttribute('aria-selected', 'false');
    expect(aba(TEXTOS.dia.manchetesPositivas)).toHaveAttribute('tabindex', '0');
    expect(aba(TEXTOS.dia.manchetesNegativas)).toHaveAttribute('tabindex', '-1');
  });

  it('o painel é tabpanel ligado à aba escolhida', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={manchetes} />);

    const abaEscolhida = aba(TEXTOS.dia.manchetesPositivas);
    expect(painel()).toHaveAttribute('id', abaEscolhida.getAttribute('aria-controls'));
    expect(painel()).toHaveAttribute('aria-labelledby', abaEscolhida.id);
  });

  it('cada aba mostra a contagem do tom', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={manchetes} />);

    expect(within(aba(TEXTOS.dia.manchetesPositivas)).getByText('1')).toBeInTheDocument();
    expect(within(aba(TEXTOS.dia.manchetesNeutras)).getByText('0')).toBeInTheDocument();
    expect(within(aba(TEXTOS.dia.manchetesNegativas)).getByText('1')).toBeInTheDocument();
  });

  it('a contagem da aba é a das manchetes da lista, não o total do dia (que fica no termômetro)', () => {
    renderizar(<ManchetesPorTom tom={{ total: 900, positivas: 310, neutras: 300, negativas: 290 }} manchetes={manchetes} />);

    const abaPositiva = aba(TEXTOS.dia.manchetesPositivas);
    expect(within(abaPositiva).getByText('1')).toBeInTheDocument();
    expect(abaPositiva.textContent).not.toMatch(/310/);
  });

  it('cada aba traz o sinal no ícone pelo data-brilho do tom', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={manchetes} />);

    expect(aba(TEXTOS.dia.manchetesPositivas)).toHaveAttribute('data-brilho', 'alta');
    expect(aba(TEXTOS.dia.manchetesNeutras)).toHaveAttribute('data-brilho', 'aco');
    expect(aba(TEXTOS.dia.manchetesNegativas)).toHaveAttribute('data-brilho', 'queda');
  });

  it('sem manchete em nenhum tom, mostra só o aviso, sem abas', () => {
    const { container } = renderizar(<ManchetesPorTom tom={tom} manchetes={{}} />);

    expect(screen.queryByRole('tab')).toBeNull();
    expect(container.querySelector('.noticias-vazio')).not.toBeNull();
  });

  it('a aba inicial pula a lista vazia do primeiro tom', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={{ negativo: manchetes.negativo }} />);

    expect(aba(TEXTOS.dia.manchetesNegativas)).toHaveAttribute('aria-selected', 'true');
    expect(linksPara('https://exemplo.com/vale')).toHaveLength(1);
  });
});

describe('ManchetesPorTom: troca de aba', () => {
  it('clicar numa aba mostra só as manchetes desse tom', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={manchetes} />);

    expect(linksPara('https://exemplo.com/petro')).toHaveLength(1);
    expect(linksPara('https://exemplo.com/vale')).toHaveLength(0);

    fireEvent.click(aba(TEXTOS.dia.manchetesNegativas));

    expect(aba(TEXTOS.dia.manchetesNegativas)).toHaveAttribute('aria-selected', 'true');
    expect(linksPara('https://exemplo.com/petro')).toHaveLength(0);
    expect(linksPara('https://exemplo.com/vale')).toHaveLength(1);
  });

  it('lista vazia mostra o aviso do tom', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={manchetes} />);

    fireEvent.click(aba(TEXTOS.dia.manchetesNeutras));

    expect(screen.getByText(TEXTOS.dia.semManchetesTom)).toBeInTheDocument();
  });

  it('seta direita move a seleção e o foco para a aba seguinte', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={manchetes} />);

    const positivas = aba(TEXTOS.dia.manchetesPositivas);
    positivas.focus();
    fireEvent.keyDown(positivas, { key: 'ArrowRight' });

    expect(aba(TEXTOS.dia.manchetesNeutras)).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(aba(TEXTOS.dia.manchetesNeutras));
  });

  it('seta esquerda na primeira aba volta para a última; Home e End vão às pontas', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={manchetes} />);

    const positivas = aba(TEXTOS.dia.manchetesPositivas);
    fireEvent.keyDown(positivas, { key: 'ArrowLeft' });
    expect(aba(TEXTOS.dia.manchetesNegativas)).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(aba(TEXTOS.dia.manchetesNegativas), { key: 'Home' });
    expect(aba(TEXTOS.dia.manchetesPositivas)).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(aba(TEXTOS.dia.manchetesPositivas), { key: 'End' });
    expect(aba(TEXTOS.dia.manchetesNegativas)).toHaveAttribute('aria-selected', 'true');
  });
});

describe('ManchetesPorTom: lista de manchetes', () => {
  it('cada manchete tem um único link, no título, com aviso de nova aba', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={manchetes} />);

    const links = linksPara('https://exemplo.com/petro');
    expect(links).toHaveLength(1);
    expect(links[0].textContent).toContain('Petrobras sobe forte');
    expect(links[0].textContent).toContain(TEXTOS.dia.abreNovaAba);
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('a linha de baixo traz só a fonte e a data', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={manchetes} />);

    expect(screen.getByText('Valor · 22/10/2026 às 17h19')).toBeInTheDocument();
    expect(screen.queryByText(/PETR4/)).toBeNull();
  });
});

describe('ManchetesPorTom: mostrar todas', () => {
  const muitas = Array.from({ length: 10 }, (_, i) => ({
    tag: 'ABEV3',
    tom: 'neutro',
    titulo: `Manchete ${i + 1}`,
    link: `https://exemplo.com/m${i + 1}`,
    fonte: 'Fonte · 22/10/2026',
  }));

  it('mostra seis manchetes e o botão expande com aria-expanded e aria-controls', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={{ neutro: muitas }} />);

    fireEvent.click(aba(TEXTOS.dia.manchetesNeutras));

    const lista = within(painel()).getByRole('list');
    expect(within(lista).getAllByRole('link')).toHaveLength(6);

    const botao = within(painel()).getByRole('button', { name: TEXTOS.dia.mostrarTodasManchetes(10) });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(botao).toHaveAttribute('aria-controls', lista.id);

    fireEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(botao).toHaveTextContent(TEXTOS.dia.mostrarMenosManchetes);
    expect(within(lista).getAllByRole('link')).toHaveLength(10);
  });

  it('trocar de aba volta a lista ao recolhido', () => {
    renderizar(<ManchetesPorTom tom={tom} manchetes={{ neutro: muitas, negativo: manchetes.negativo }} />);

    fireEvent.click(aba(TEXTOS.dia.manchetesNeutras));
    fireEvent.click(within(painel()).getByRole('button', { name: TEXTOS.dia.mostrarTodasManchetes(10) }));
    expect(within(painel()).getAllByRole('link')).toHaveLength(10);

    fireEvent.click(aba(TEXTOS.dia.manchetesNegativas));
    fireEvent.click(aba(TEXTOS.dia.manchetesNeutras));

    expect(within(painel()).getAllByRole('link')).toHaveLength(6);
    expect(within(painel()).getByRole('button', { name: TEXTOS.dia.mostrarTodasManchetes(10) })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
