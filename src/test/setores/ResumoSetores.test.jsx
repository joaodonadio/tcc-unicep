import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { ResumoSetores } from '../../components/setores/ResumoSetores.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS } from '../../lib/textos.js';

// Campos reais de setoresPorPeriodo: setor, media, n, subiram, cairam.
const s = (setor, media, n = 2, subiram = 1, cairam = 1) => ({ setor, media, n, subiram, cairam });

const lista = [s('Financeiro', 0.02), s('Saúde', -0.01), s('Tecnologia', null, 0, 0, 0)];

const linkDe = (nome) => screen.getByRole('link', { name: new RegExp(nome) });

describe('ResumoSetores', () => {
  it('lista um item por setor, sem canvas nem dica da cena 3D, e sem NaN ou undefined', () => {
    const { container } = renderizar(<ResumoSetores setores={lista} periodo="d1" />);

    const itens = within(screen.getByRole('list', { name: TEXTOS.setores.rankingLista })).getAllByRole('listitem');
    expect(itens).toHaveLength(3);
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.queryByText(TEXTOS.setores.cena3d.dica)).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('destaca a linha no hover e no foco, e tira o destaque ao sair', () => {
    renderizar(<ResumoSetores setores={lista} periodo="d1" />);

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
    const { container } = renderizar(<ResumoSetores setores={negativos} periodo="d1" />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('sem WebGL a lista segue completa e cada link aponta para o cartão do setor', () => {
    renderizar(<ResumoSetores setores={lista} periodo="d1" />);
    expect(linkDe('Financeiro').getAttribute('href')).toMatch(/^#/);
    expect(linkDe('Saúde').getAttribute('href')).toMatch(/^#/);
    expect(screen.queryByRole('button', { name: TEXTOS.setores.cena3d.verSetor })).toBeNull();
  });

  it('renderiza sem erro e sem NaN quando nenhum setor tem valor', () => {
    const nulos = [s('Financeiro', null, 0, 0, 0), s('Saúde', null, 0, 0, 0)];
    const { container } = renderizar(<ResumoSetores setores={nulos} periodo="d1" />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('mostra o selo "Calculado no site" com a explicação e o link para a conta na página Dados', () => {
    renderizar(<ResumoSetores setores={lista} periodo="d1" />);

    expect(screen.getByText(TEXTOS.contas.selo)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: TEXTOS.contas.comoFeito })).toHaveAttribute('href', '/dados#conta-mediaSetor');
  });

  it('sem semanaCalculada só o selo da média aparece; com ela, também o da semana, em versão curta', () => {
    const { unmount } = renderizar(<ResumoSetores setores={lista} periodo="s1" />);
    expect(screen.getAllByRole('link', { name: TEXTOS.contas.comoFeito })).toHaveLength(1);
    unmount();

    renderizar(<ResumoSetores setores={lista} periodo="s1" semanaCalculada />);
    const links = screen.getAllByRole('link', { name: TEXTOS.contas.comoFeito });
    expect(links).toHaveLength(2);
    expect(links[1]).toHaveAttribute('href', '/dados#conta-semana');
    expect(screen.getAllByText(TEXTOS.contas.selo)).toHaveLength(2);
  });
});
