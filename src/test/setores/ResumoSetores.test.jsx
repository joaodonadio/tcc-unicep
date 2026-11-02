import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ResumoSetores } from '../../components/setores/ResumoSetores.jsx';
import { TEXTOS } from '../../lib/textos.js';

// Campos reais de setoresPorPeriodo: setor, media, n, subiram, cairam.
const s = (setor, media, n = 2, subiram = 1, cairam = 1) => ({ setor, media, n, subiram, cairam });

const lista = [s('Financeiro', 0.02), s('Saúde', -0.01), s('Tecnologia', null, 0, 0, 0)];

const linkDe = (nome) => screen.getByRole('link', { name: new RegExp(nome) });

describe('ResumoSetores', () => {
  it('lista um item por setor, sem canvas nem dica da cena 3D, e sem NaN ou undefined', () => {
    const { container } = render(<ResumoSetores setores={lista} periodo="d1" />);

    const itens = within(screen.getByRole('list', { name: TEXTOS.setores.rankingLista })).getAllByRole('listitem');
    expect(itens).toHaveLength(3);
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.queryByText(TEXTOS.setores.cena3d.dica)).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('destaca a linha no hover e no foco, e tira o destaque ao sair', () => {
    render(<ResumoSetores setores={lista} periodo="d1" />);

    expect(linkDe('Financeiro')).not.toHaveAttribute('data-destaque');
    expect(linkDe('Saúde')).not.toHaveAttribute('data-destaque');

    fireEvent.mouseEnter(linkDe('Financeiro'));
    expect(linkDe('Financeiro')).toHaveAttribute('data-destaque', 'true');
    expect(linkDe('Saúde')).not.toHaveAttribute('data-destaque');

    fireEvent.mouseLeave(linkDe('Financeiro'));
    expect(linkDe('Financeiro')).not.toHaveAttribute('data-destaque');

    fireEvent.focus(linkDe('Saúde'));
    expect(linkDe('Saúde')).toHaveAttribute('data-destaque', 'true');
    expect(linkDe('Financeiro')).not.toHaveAttribute('data-destaque');

    fireEvent.blur(linkDe('Saúde'));
    expect(linkDe('Saúde')).not.toHaveAttribute('data-destaque');
  });

  it('renderiza sem erro e sem NaN quando todos os setores caíram', () => {
    const negativos = [s('Financeiro', -0.04, 2, 0, 2), s('Saúde', -0.01, 2, 0, 2)];
    const { container } = render(<ResumoSetores setores={negativos} periodo="d1" />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('sem WebGL a lista segue completa e cada link aponta para o cartão do setor', () => {
    render(<ResumoSetores setores={lista} periodo="d1" />);
    expect(linkDe('Financeiro').getAttribute('href')).toMatch(/^#/);
    expect(linkDe('Saúde').getAttribute('href')).toMatch(/^#/);
    expect(screen.queryByRole('button', { name: TEXTOS.setores.cena3d.verSetor })).toBeNull();
  });

  it('renderiza sem erro e sem NaN quando nenhum setor tem valor', () => {
    const nulos = [s('Financeiro', null, 0, 0, 0), s('Saúde', null, 0, 0, 0)];
    const { container } = render(<ResumoSetores setores={nulos} periodo="d1" />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });
});
