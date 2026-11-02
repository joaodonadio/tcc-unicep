import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { Setores3D } from '../../components/setores/Setores3D.jsx';
import { colunasDosSetores } from '../../lib/setores3d.js';
import { pct } from '../../lib/formato.js';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS } from '../../lib/textos.js';

// jsdom não tem WebGL: o palco vira um stub e a legenda, as setas e as teclas são testadas sozinhas.
const webgl = vi.hoisted(() => ({ ok: true }));
vi.mock('../../components/modelos3d/suporte.js', () => ({
  suportaWebGL: () => webgl.ok,
  reduzMovimento: () => true,
}));
vi.mock('../../components/setores/PalcoSetores.jsx', () => ({ default: () => null }));

const colunas = colunasDosSetores([
  { setor: 'Financeiro', media: 0.02, subiram: 3, n: 4 },
  { setor: 'Saúde', media: -0.01, subiram: 1, n: 4 },
  { setor: 'Tecnologia', media: null, subiram: null, n: 0 },
]);

const regiao = () => screen.getByRole('region', { name: TEXTOS.setores.cena3d.palco });

afterEach(() => {
  webgl.ok = true;
});

describe('Setores3D: legenda, setas e teclas (sem WebGL no jsdom)', () => {
  it('a legenda mostra o setor da frente, a variação, a contagem e a dica, sem canvas', () => {
    const { container } = renderizar(<Setores3D colunas={colunas} destaque={null} aoEscolher={() => {}} />);
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
    expect(screen.getByText(pct(0.02))).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.setores.subiramDe(3, 4))).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.setores.cena3d.dica)).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();
  });

  it('o botão Próximo setor troca a legenda para o seguinte', () => {
    renderizar(<Setores3D colunas={colunas} destaque={null} aoEscolher={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: TEXTOS.setores.cena3d.proximo }));
    expect(screen.getByText('Saúde')).toBeInTheDocument();
    expect(screen.getByText(pct(-0.01))).toBeInTheDocument();
  });

  it('Setor anterior dá a volta: do primeiro vai para o último', () => {
    renderizar(<Setores3D colunas={colunas} destaque={null} aoEscolher={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: TEXTOS.setores.cena3d.anterior }));
    expect(screen.getByText('Tecnologia')).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.setores.semDado)).toBeInTheDocument();
    expect(screen.queryByText(TEXTOS.setores.subiramDe(0, 0))).toBeNull();
  });

  it('as setas do teclado mudam o setor quando o palco está focado', () => {
    renderizar(<Setores3D colunas={colunas} destaque={null} aoEscolher={() => {}} />);
    const palco = regiao();
    palco.focus();
    expect(palco).toHaveFocus();
    fireEvent.keyDown(palco, { key: 'ArrowRight' });
    expect(screen.getByText('Saúde')).toBeInTheDocument();
    fireEvent.keyDown(palco, { key: 'ArrowLeft' });
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
  });

  it('a linha da lista em destaque põe o setor na frente da legenda', () => {
    renderizar(<Setores3D colunas={colunas} destaque="Saúde" aoEscolher={() => {}} />);
    expect(screen.getByText('Saúde')).toBeInTheDocument();
    expect(screen.queryByText('Financeiro')).toBeNull();
  });

  it('o palco tem nome, papel de carrossel e descrição pela dica', () => {
    renderizar(<Setores3D colunas={colunas} destaque={null} aoEscolher={() => {}} />);
    const palco = regiao();
    expect(palco).toHaveAttribute('aria-roledescription', TEXTOS.setores.cena3d.papel);
    expect(palco).toHaveAttribute('tabindex', '0');
    expect(palco.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(palco.getAttribute('aria-describedby'))).toHaveTextContent(TEXTOS.setores.cena3d.dica);
  });

  it('"Ver o setor" avisa o setor da frente', () => {
    const aoEscolher = vi.fn();
    renderizar(<Setores3D colunas={colunas} destaque={null} aoEscolher={aoEscolher} />);
    fireEvent.click(screen.getByRole('button', { name: TEXTOS.setores.cena3d.verSetor }));
    expect(aoEscolher).toHaveBeenCalledWith('Financeiro');
  });

  it('sem WebGL não renderiza nada (a lista continua na página)', () => {
    webgl.ok = false;
    const { container } = renderizar(<Setores3D colunas={colunas} destaque={null} aoEscolher={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('sem setores não renderiza nada', () => {
    const { container } = renderizar(<Setores3D colunas={[]} destaque={null} aoEscolher={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
