import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { MapaPregao } from '../../components/acoes/MapaPregao.jsx';
import { percentualDoTom } from '../../lib/mapaPregao.js';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS } from '../../lib/textos.js';

const acao = (ticker, nome, setor_nome, variacao_dia, contagem = { forte: 0, atencao: 0, contexto: 0 }) => ({
  ticker,
  nome,
  setor_nome,
  variacao_dia,
  contagem,
  tipo: 'ON',
});

const ACOES = [
  acao('PETR4', 'Petrobras', 'Petróleo', -0.005, { forte: 2, atencao: 1, contexto: 0 }),
  acao('PRIO3', 'PetroRio', 'Petróleo', 0.03),
  acao('ITUB4', 'Itaú', 'Bancos', 0.012),
  acao('BBDC4', 'Bradesco', 'Bancos', null),
];

describe('percentualDoTom', () => {
  it('variação zero dá o tom mínimo (8%)', () => {
    expect(percentualDoTom(0)).toBe(8);
  });

  it('a partir de 4% em módulo satura em 45%, para alta e para queda', () => {
    expect(percentualDoTom(0.04)).toBe(45);
    expect(percentualDoTom(0.2)).toBe(45);
    expect(percentualDoTom(-0.04)).toBe(45);
    expect(percentualDoTom(-0.1)).toBe(45);
  });

  it('cresce de forma proporcional entre zero e o teto', () => {
    expect(percentualDoTom(0.02)).toBeCloseTo(26.5);
    expect(percentualDoTom(-0.02)).toBeCloseTo(26.5);
  });

  it('sem número devolve null, nunca um tom', () => {
    expect(percentualDoTom(null)).toBe(null);
    expect(percentualDoTom(undefined)).toBe(null);
    expect(percentualDoTom(Number.NaN)).toBe(null);
  });
});

describe('MapaPregao', () => {
  it('tem um link por ação, apontando para a ficha, com a variação no rótulo', () => {
    renderizar(<MapaPregao acoes={ACOES} />);

    const petr = screen.getByRole('link', { name: /^PETR4, Petrobras: /i });
    expect(petr).toHaveAttribute('href', '/acao/PETR4');
    expect(petr).toHaveAccessibleName('PETR4, Petrobras: −0,5% no dia. 2 regras a favor, 1 de atenção.');

    const prio = screen.getByRole('link', { name: /^PRIO3, PetroRio: /i });
    expect(prio).toHaveAccessibleName('PRIO3, PetroRio: +3,0% no dia.');
    expect(prio).toHaveAttribute('href', '/acao/PRIO3');

    // o selo "como é feito" também é link, mas não é de ação: conta só os links de ação
    expect(screen.getAllByRole('link').filter((l) => l.getAttribute('href')?.startsWith('/acao/'))).toHaveLength(ACOES.length);
    expect(screen.getByRole('link', { name: TEXTOS.contas.comoFeito })).toHaveAttribute('href', '/dados#conta-mediaSetor');
  });

  it('ação sem variação mostra "sem dado" no bloco e no rótulo, sem virar 0', () => {
    renderizar(<MapaPregao acoes={ACOES} />);

    const bbdc = screen.getByRole('link', { name: /^BBDC4, Bradesco: / });
    expect(bbdc).toHaveAccessibleName(`BBDC4, Bradesco: ${TEXTOS.dia.mapaSemDado}.`);
    expect(within(bbdc).getByText(TEXTOS.dia.mapaSemDado)).toBeInTheDocument();
  });

  it('cada setor aparece com a média e a contagem de quem subiu', () => {
    renderizar(<MapaPregao acoes={ACOES} />);

    const bancos = screen.getByText('Bancos').closest('li');
    // O total conta só as ações com variação crível: a de Bradesco (sem dado) fica fora da contagem.
    expect(within(bancos).getByText(/1 de 1 subiram/)).toBeInTheDocument();
    expect(within(bancos).getByText(TEXTOS.dia.mapaMedia('+1,2%'), { exact: false })).toBeInTheDocument();
  });

  it('setores ordenados pela variação média, do maior para o menor', () => {
    const { container } = renderizar(<MapaPregao acoes={ACOES} />);

    const nomes = [...container.querySelectorAll('.mapa-setor-nome')].map((el) => el.textContent);
    expect(nomes).toEqual(['Petróleo', 'Bancos']);
  });

  it('não mostra legenda de sinais; a escala de cor fica fora da leitura (aria-hidden)', () => {
    renderizar(<MapaPregao acoes={ACOES} />);

    expect(screen.queryByText(/Tem ponto/)).toBeNull();
    expect(screen.queryByText(/Sem sinal nas regras/)).toBeNull();

    const escala = screen.getByText(TEXTOS.dia.mapaEscala[0]).closest('ul');
    expect(escala).toHaveAttribute('aria-hidden', 'true');
    expect(escala.textContent).toContain(TEXTOS.dia.mapaEscala[4]);
  });

  it('o título é um h2 e a intro curta aparece', () => {
    renderizar(<MapaPregao acoes={ACOES} />);

    expect(screen.getByRole('heading', { level: 2, name: TEXTOS.dia.mapa })).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.dia.mapaIntro)).toBeInTheDocument();
  });
});
