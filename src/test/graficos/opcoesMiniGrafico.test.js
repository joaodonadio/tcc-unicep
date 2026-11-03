import { describe, expect, it } from 'vitest';
import { montarOpcaoMini, temDadosMini } from '../../components/graficos/opcoesMiniGrafico.js';

const BASE = { cor: '#5fc9c0', fundo: '#0b0b0c', suave: '#b4b4bb', animar: false };
const CORES = ['#00ff00', '#999999', '#ff0000'];

describe('temDadosMini', () => {
  it('área e barras precisam de 2 valores finitos; pontos, de um grupo positivo', () => {
    expect(temDadosMini('area', [1, null, 2])).toBe(true);
    expect(temDadosMini('area', [1, null])).toBe(false);
    expect(temDadosMini('barras', undefined)).toBe(false);
    expect(temDadosMini('pontos', [0, null, 3])).toBe(true);
    expect(temDadosMini('pontos', [0, 0, 0])).toBe(false);
  });
});

describe('montarOpcaoMini: área', () => {
  it('eixos escondidos, degradê, brilho, base tracejada e ponto no último valor finito', () => {
    const o = montarOpcaoMini({ ...BASE, tipo: 'area', valores: [1, 2, 3, null] });
    expect(o.xAxis.show).toBe(false);
    expect(o.yAxis.show).toBe(false);
    expect(o.animation).toBe(false);
    const [linha, ponto, base] = o.series;
    expect(linha.areaStyle.color.colorStops[0].color).toBe('rgba(95,201,192,0.38)');
    expect(linha.lineStyle.shadowBlur).toBe(10);
    expect(linha.lineStyle.shadowColor).toBe('rgba(95,201,192,0.6)');
    expect(ponto.data).toEqual([[2, 3]]);
    expect(base.data).toEqual([1, 1, 1, 1]);
    expect(base.lineStyle.type).toEqual([3, 4]);
  });

  it('com movimento, o ponto final pulsa e a linha leva 1100 ms; sem movimento, ponto parado', () => {
    const animado = montarOpcaoMini({ ...BASE, tipo: 'area', valores: [1, 2], animar: true });
    expect(animado.series[1].type).toBe('effectScatter');
    expect(animado.series[1].rippleEffect.scale).toBe(3);
    expect(animado.animationDuration).toBe(1100);
    expect(montarOpcaoMini({ ...BASE, tipo: 'area', valores: [1, 2] }).series[1].type).toBe('scatter');
  });
});

describe('montarOpcaoMini: barras', () => {
  it('valor inválido vira null, nunca 0; a última é cheia e brilha, as outras ficam a 45%', () => {
    const dados = montarOpcaoMini({ ...BASE, tipo: 'barras', valores: [0.004, Number.NaN, -0.001] }).series[0].data;
    expect(dados.map((d) => d.value)).toEqual([0.004, null, -0.001]);
    expect(dados[2].itemStyle.color).toBe('#5fc9c0');
    expect(dados[2].itemStyle.shadowBlur).toBe(10);
    expect(dados[0].itemStyle.color).toBe('rgba(95,201,192,0.45)');
    expect(dados[0].itemStyle.borderRadius).toBe(999);
  });

  it('base no zero, sem rótulos, e crescimento em sequência quando anima', () => {
    const o = montarOpcaoMini({ ...BASE, tipo: 'barras', valores: [1, 2, 3], animar: true });
    expect(o.xAxis.axisLine.onZero).toBe(true);
    expect(o.xAxis.axisLabel.show).toBe(false);
    expect(o.yAxis.scale).toBe(false);
    expect(o.series[0].animationDelay(2)).toBe(90);
  });
});

describe('montarOpcaoMini: pontos', () => {
  it('um ponto por ação, na ordem dos grupos, coluna a coluna em 5 linhas', () => {
    const o = montarOpcaoMini({ ...BASE, tipo: 'pontos', valores: [6, 2, 4], cores: CORES });
    const pontos = o.series[0].data;
    expect(pontos).toHaveLength(12);
    expect(o.xAxis.data).toHaveLength(3);
    expect(o.yAxis.data).toHaveLength(5);
    expect(pontos[0].value).toEqual([0, 0]);
    expect(pontos[5].value).toEqual([1, 0]);
    expect(pontos[0].itemStyle.color).toBe('#00ff00');
    expect(pontos[6].itemStyle.color).toBe('rgba(153,153,153,0.55)');
    expect(pontos[11].itemStyle.color).toBe('#ff0000');
  });

  it('grupo ausente (null) não vira ponto', () => {
    expect(montarOpcaoMini({ ...BASE, tipo: 'pontos', valores: [3, null, 2], cores: CORES }).series[0].data).toHaveLength(5);
  });

  it('tamanho do ponto pela largura medida; sem largura, 7px', () => {
    expect(montarOpcaoMini({ ...BASE, tipo: 'pontos', valores: [85, 0, 0] }).series[0].symbolSize).toBe(7);
    // 85 ações = 17 colunas; 170px dá passo 10 (menor que 72/5) e ponto de 6px
    expect(montarOpcaoMini({ ...BASE, tipo: 'pontos', valores: [85, 0, 0], largura: 170 }).series[0].symbolSize).toBe(6);
  });

  it('aparecem em sequência quando anima', () => {
    const o = montarOpcaoMini({ ...BASE, tipo: 'pontos', valores: [3, 0, 0], animar: true });
    expect(o.series[0].animationDelay(10)).toBe(60);
  });
});

describe('montarOpcaoMini: inclinação', () => {
  it('dois pontos, base no anterior, ponto anterior vazado e ponto de hoje no fim', () => {
    const o = montarOpcaoMini({ ...BASE, tipo: 'inclinacao', valores: [5.02, 5.03] });
    const [linha, hoje, antes, base] = o.series;
    expect(linha.data).toEqual([5.02, 5.03]);
    expect(linha.lineStyle.shadowBlur).toBe(10);
    expect(hoje.type).toBe('scatter');
    expect(hoje.data).toEqual([[1, 5.03]]);
    expect(antes.data).toEqual([[0, 5.02]]);
    expect(antes.itemStyle.color).toBe(BASE.fundo);
    expect(base.data).toEqual([5.02, 5.02]);
  });

  it('faixa fixa: movimento pequeno não vai de canto a canto; 2% enche a altura', () => {
    const pequeno = montarOpcaoMini({ ...BASE, tipo: 'inclinacao', valores: [100, 100.3] });
    expect(pequeno.yAxis.min).toBeLessThan(100);
    expect(pequeno.yAxis.max).toBeGreaterThan(100.3);
    const grande = montarOpcaoMini({ ...BASE, tipo: 'inclinacao', valores: [100, 102] });
    expect(grande.yAxis.min).toBeCloseTo(100);
    expect(grande.yAxis.max).toBeCloseTo(102);
  });

  it('com animação, o ponto de hoje pulsa', () => {
    const o = montarOpcaoMini({ ...BASE, animar: true, tipo: 'inclinacao', valores: [1, 2] });
    expect(o.series[1].type).toBe('effectScatter');
  });

  it('precisa de dois valores finitos', () => {
    expect(temDadosMini('inclinacao', [5, null])).toBe(false);
    expect(temDadosMini('inclinacao', [5.02, 5.03])).toBe(true);
  });
});

describe('montarOpcaoMini: área compacta e faixa exata', () => {
  it('abaixo de 48px: margens pequenas e ponto parado mesmo com animação', () => {
    const o = montarOpcaoMini({ ...BASE, animar: true, tipo: 'area', valores: [1, 2, 3], altura: 32 });
    expect(o.grid.top).toBe(4);
    expect(o.series[1].type).toBe('scatter');
    expect(o.series[1].symbolSize).toBe(5);
  });

  it('faixaExata prende o eixo y na mínima e na máxima', () => {
    const o = montarOpcaoMini({ ...BASE, tipo: 'area', valores: [1, 2, 3], altura: 240, faixaExata: true });
    expect(o.yAxis.min).toBe('dataMin');
    expect(o.yAxis.max).toBe('dataMax');
    expect(o.grid.top).toBe(o.grid.bottom);
  });
});
