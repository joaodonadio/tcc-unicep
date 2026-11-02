import { describe, expect, it } from 'vitest';
import { render, within } from '@testing-library/react';
import { GraficoInterativo } from '../../components/graficos/GraficoInterativo.jsx';
import { pct } from '../../lib/formato.js';
import { resolverCor } from '../../lib/temaGraficos.js';
import { TEXTOS } from '../../lib/textos.js';

const DATAS = ['2026-10-20', '2026-10-21', '2026-10-22'];

describe('GraficoInterativo', () => {
  it('uma série em R$: contêiner descrito e tabela com valores formatados', () => {
    const { getByRole } = render(<GraficoInterativo serie={[10, 11, 12]} datas={DATAS} />);
    expect(getByRole('img').getAttribute('aria-label')).toBe(
      TEXTOS.grafico.descricaoSerie('R$ 10,00', 'R$ 12,00'),
    );
    const tabela = getByRole('list', { name: TEXTOS.grafico.tabelaLegenda });
    expect(tabela.classList.contains('sr-only')).toBe(true);
    expect(within(tabela).getByText('21/10/2026').parentElement.textContent).toBe('21/10/2026: R$ 11,00');
  });

  it('descricao explícita vira o aria-label', () => {
    const { getByRole } = render(<GraficoInterativo serie={[1, 2]} datas={DATAS} descricao="Meu gráfico" />);
    expect(getByRole('img').getAttribute('aria-label')).toBe('Meu gráfico');
  });

  it('várias séries: legenda com rótulos, nota e marcação de tracejado', () => {
    const { container, getByText } = render(
      <GraficoInterativo
        datas={DATAS}
        series={[
          { id: 'acao', rotulo: 'PETR4', valores: [0.01, 0.02, 0.03] },
          { id: 'ibov', rotulo: 'Ibovespa', valores: [0.0, 0.01, 0.02], tracejada: true },
        ]}
        formatar={(v) => pct(v)}
        linhaZero
        notaLegenda="Setor no período: +3,2%"
      />,
    );
    const legenda = container.querySelector('.chart-legenda');
    expect(within(legenda).getByText('PETR4')).toBeTruthy();
    expect(within(legenda).getByText('Ibovespa')).toBeTruthy();
    expect(getByText('Setor no período: +3,2%')).toBeTruthy();
    expect(legenda.querySelector('i[data-tracejada]')).not.toBeNull();
  });

  it('valor ausente aparece como "sem dado" na tabela, nunca como zero', () => {
    const { getByRole } = render(
      <GraficoInterativo serie={[1, null, 2, 3]} datas={['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22']} formatar={(v) => `n${v}`} />,
    );
    const tabela = getByRole('list', { name: TEXTOS.grafico.tabelaLegenda });
    expect(tabela.textContent).toContain('20/10/2026: sem dado');
    expect(tabela.textContent).not.toContain('n0');
  });

  it('modo barrasHorizontais: uma linha por categoria', () => {
    const { getByRole } = render(
      <GraficoInterativo
        modo="barrasHorizontais"
        categorias={['Bancos', 'Energia', 'Varejo']}
        serie={[1.5, -0.8, 0.2]}
        formatar={(v) => pct(v / 100)}
      />,
    );
    const tabela = getByRole('list', { name: TEXTOS.grafico.tabelaLegenda });
    expect(tabela.querySelectorAll('li')).toHaveLength(3);
    expect(within(tabela).getByText('Energia')).toBeTruthy();
  });

  it('modo barras com corPorSinal renderiza sem quebrar', () => {
    const { getByRole } = render(
      <GraficoInterativo serie={[5, -6, 7]} datas={DATAS} modo="barras" corPorSinal />,
    );
    expect(getByRole('img')).toBeTruthy();
  });

  it('com 1 ponto só, mostra o skeleton', () => {
    const { container } = render(<GraficoInterativo serie={[5]} datas={['2026-10-22']} />);
    expect(container.querySelector('.esqueleto')).not.toBeNull();
  });

  it('a tabela guarda no máximo os últimos 60 pontos', () => {
    const datas = Array.from({ length: 100 }, (_, i) => `2026-01-${String((i % 28) + 1).padStart(2, '0')}`);
    const { getByRole } = render(<GraficoInterativo serie={datas.map((_, i) => i + 1)} datas={datas} />);
    expect(getByRole('list', { name: TEXTOS.grafico.tabelaLegenda }).querySelectorAll('li')).toHaveLength(60);
  });
});

describe('temaGraficos', () => {
  it('resolve var(--x) para a cor de reserva quando o token não existe', () => {
    expect(resolverCor('var(--cor-dado-1)')).toMatch(/^#|^rgb/);
    expect(resolverCor('var(--inexistente, #123456)')).toBe('#123456');
    expect(resolverCor('#abcdef')).toBe('#abcdef');
  });
});
