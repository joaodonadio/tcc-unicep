import { describe, expect, it } from 'vitest';
import { montarOpcao } from '../../components/graficos/opcoesGrafico.js';

const DATAS = ['2026-10-23', '2026-10-26', '2026-10-27'];
const BASE = {
  lista: [{ id: 'acao', rotulo: 'ACAO', cor: '#5fc9c0', valores: [1, 2, 3] }],
  rotulosEixo: DATAS,
  modo: 'linha',
  formatar: (v) => String(v),
  formatarData: (d) => d,
  eixo: true,
  rotulosX: true,
  animar: false,
};

describe('montarOpcao: marcas de evento', () => {
  it('com eventos, a primeira série leva um markLine vertical por evento', () => {
    const o = montarOpcao({ ...BASE, eventos: [{ indice: 1, marca: 'Eleição' }] });
    const [primeira] = o.series;
    expect(primeira.markLine.data).toHaveLength(1);
    expect(primeira.markLine.data[0]).toMatchObject({ xAxis: 1, label: { formatter: 'Eleição', position: 'end' } });
    expect(primeira.markLine.symbol).toBe('none');
    expect(primeira.markLine.silent).toBe(true);
  });

  it('com linha de zero e evento, os dois itens dividem o markLine da primeira série', () => {
    const o = montarOpcao({ ...BASE, linhaZero: true, eventos: [{ indice: 2, marca: 'Eleição' }] });
    const data = o.series[0].markLine.data;
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({ yAxis: 0 });
    expect(data[1]).toMatchObject({ xAxis: 2, label: { formatter: 'Eleição' } });
  });

  it('sem eventos, não há markLine de evento', () => {
    const o = montarOpcao({ ...BASE });
    expect(o.series[0].markLine).toBeUndefined();
  });
});
