import { describe, expect, it } from 'vitest';
import { larguraRotuloDeitado, montarOpcaoVelas, quebrarNome, velasDeitadas } from '../../components/graficos/opcoesVelas.js';
import { pct } from '../../lib/formato.js';
import { TEXTOS } from '../../lib/textos.js';

const T = TEXTOS.setores.velas;

const TEMA = {
  texto: '#f4f4f5',
  suave: '#b4b4bb',
  fonte: 'mono',
  fonteTexto: 'texto',
  superficie: '#222',
  borda: '#333',
  fio: '#444',
  fundo: '#242428',
  alta: '#7fd19a',
  queda: '#f08a8a',
};

const vela = (abertura, fechamento, maxima, minima) => ({ abertura, fechamento, maxima, minima });

const itens = [
  { rotulo: 'Setor Alfa', vela: vela(0, 0.032, 0.04, -0.001), n: 3, inicio: '2026-01-02', fim: '2026-01-30' },
  { rotulo: 'Setor Beta', vela: vela(0, -0.018, 0.005, -0.02), n: 2, inicio: null, fim: null },
];

const base = { itens, formatar: pct, tema: TEMA, animar: false };

describe('montarOpcaoVelas: orientação', () => {
  it('em tela larga, setores no eixo X (category) e valor no eixo Y', () => {
    const o = montarOpcaoVelas({ ...base, larguraPorItem: 120 });
    expect(o.xAxis.type).toBe('category');
    expect(o.xAxis.data).toEqual(['Setor Alfa', 'Setor Beta']);
    expect(o.yAxis.type).toBe('value');
    expect(o.series[0].markLine.data).toEqual([{ yAxis: 0 }]);
  });

  it('em tela estreita, setores no eixo Y (inverso) e valor no eixo X, com a coluna do nome', () => {
    const o = montarOpcaoVelas({ ...base, larguraPorItem: 60, largura: 300 });
    expect(o.yAxis.type).toBe('category');
    expect(o.yAxis.inverse).toBe(true);
    expect(o.xAxis.type).toBe('value');
    expect(o.series[0].markLine.data).toEqual([{ xAxis: 0 }]);
    // o nome quebra entre palavras na largura da coluna (larguraRotuloDeitado)
    expect(larguraRotuloDeitado(300)).toBe(102);
    expect(o.yAxis.axisLabel.formatter('Setor Alfa')).toContain('{nome|Setor Alfa}');
  });

  it('em nenhum dos dois layouts há truncate nem rotação', () => {
    for (const larguraPorItem of [120, 60]) {
      const o = montarOpcaoVelas({ ...base, larguraPorItem, largura: 300 });
      const eixo = o.xAxis.type === 'category' ? o.xAxis : o.yAxis;
      expect(JSON.stringify(o)).not.toContain('truncate');
      expect(eixo.axisLabel.rotate ?? 0).toBe(0);
      // a quebra é feita no formatador: a quebra automática do ECharts juntava a variação ao nome
      expect(eixo.axisLabel.overflow).toBeUndefined();
    }
  });
});

describe('quebrarNome', () => {
  it('quebra só entre palavras e a variação nunca é partida', () => {
    expect(quebrarNome('Consumo não cíclico', 12)).toEqual(['Consumo não', 'cíclico']);
    expect(quebrarNome('Saúde', 4)).toEqual(['Saúde']);
    expect(quebrarNome('Utilidade pública', 40)).toEqual(['Utilidade pública']);
  });

  it('o rótulo traz cada linha do nome e, por último, a variação inteira', () => {
    const o = montarOpcaoVelas({ ...base, larguraPorItem: 60, largura: 300 });
    const linhas = o.yAxis.axisLabel.formatter('Setor Alfa').split('\n');
    expect(linhas.at(-1)).toBe(`{alta|${pct(0.032)}}`);
  });
});

describe('montarOpcaoVelas: dados e rótulos', () => {
  it('série candlestick com a ordem abertura, fechamento, mínima, máxima', () => {
    const o = montarOpcaoVelas(base);
    expect(o.series[0].type).toBe('candlestick');
    expect(o.series[0].data[0]).toEqual([0, 0.032, -0.001, 0.04]);
  });

  it('rótulo do setor leva o nome e a variação com sinal, na classe de alta ou de queda', () => {
    const o = montarOpcaoVelas(base);
    const formatter = o.xAxis.axisLabel.formatter;
    expect(formatter('Setor Alfa')).toContain('{alta|');
    expect(formatter('Setor Alfa')).toContain(pct(0.032));
    expect(formatter('Setor Beta')).toContain('{queda|');
  });

  it('tooltip diz subiu ou caiu, traz a nota e, com datas, o período em dd/mm/aaaa', () => {
    const o = montarOpcaoVelas(base);
    const f = o.tooltip.formatter;
    expect(f([{ dataIndex: 0 }])).toContain('Subiu');
    expect(f([{ dataIndex: 0 }])).toContain(T.tooltip.nota);
    expect(f([{ dataIndex: 1 }])).toContain('Caiu');
    expect(f([{ dataIndex: 0 }])).toContain('02/01/2026');
    expect(f([{ dataIndex: 0 }])).toContain('30/01/2026');
  });

  it('cores de alta e queda vêm do tema', () => {
    const o = montarOpcaoVelas(base);
    expect(o.series[0].itemStyle.borderColor).toBe(TEMA.alta);
    expect(o.series[0].itemStyle.borderColor0).toBe(TEMA.queda);
  });
});

describe('velasDeitadas e tooltip', () => {
  it('deita abaixo de 96 px por setor', () => {
    expect(velasDeitadas(95)).toBe(true);
    expect(velasDeitadas(96)).toBe(false);
  });

  it('tooltip fica dentro da área e abre ao tocar na faixa do setor', () => {
    const o = montarOpcaoVelas(base);
    expect(o.tooltip.confine).toBe(true);
    expect(o.tooltip.triggerOn).toBe('mousemove|click');
    expect(o.tooltip.axisPointer.type).toBe('shadow');
  });
});
