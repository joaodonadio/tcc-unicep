import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { DispersaoSetores } from '../../components/setores/DispersaoSetores.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS } from '../../lib/textos.js';

const setorComCinco = {
  setor: 'Setor Alfa',
  media: 3,
  n: 5,
  acoes: [1, 2, 3, 4, 5].map((v, i) => ({ ticker: `ALFA${i}`, empresa: `Alfa ${i}`, variacao: v / 100 })),
};

const setorComDuas = {
  setor: 'Setor Beta',
  media: 1.5,
  n: 2,
  acoes: [1, 2].map((v, i) => ({ ticker: `BETA${i}`, empresa: `Beta ${i}`, variacao: v / 100 })),
};

describe('DispersaoSetores', () => {
  it('mostra o título da seção e a lista de quartis dos setores com ações suficientes', () => {
    renderizar(<DispersaoSetores setores={[setorComCinco, setorComDuas]} periodo="d1" />);

    expect(screen.getByRole('heading', { level: 2, name: TEXTOS.setores.dispersao.titulo })).toBeInTheDocument();

    const lista = screen.getByRole('list', { name: TEXTOS.setores.dispersao.tabela });
    const linhaAlfa = within(lista)
      .getAllByRole('listitem')
      .find((li) => li.textContent.includes('Setor Alfa'));
    expect(linhaAlfa).toBeDefined();
    expect(linhaAlfa.textContent).toContain(TEXTOS.setores.dispersao.tooltip.mediana);
    expect(linhaAlfa.textContent).toContain('+3,0%');
    expect(linhaAlfa.textContent).not.toMatch(/NaN|undefined/);
  });

  it('avisa, numa nota, os setores com menos de 3 ações', () => {
    renderizar(<DispersaoSetores setores={[setorComCinco, setorComDuas]} periodo="d1" />);

    expect(screen.getByText(TEXTOS.setores.dispersao.semDados('Setor Beta'))).toBeInTheDocument();
  });

  it('não mostra a nota quando todos os setores têm dados suficientes', () => {
    renderizar(<DispersaoSetores setores={[setorComCinco]} periodo="d1" />);

    expect(screen.queryByText(/Sem ações suficientes/)).not.toBeInTheDocument();
  });
});
