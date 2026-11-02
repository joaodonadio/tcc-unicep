import { describe, expect, it } from 'vitest';
import { lerSerieHistorica } from '../../lib/bancoCentral.js';

describe('lerSerieHistorica', () => {
  it('converte as datas em ISO e os valores em número, na mesma ordem', () => {
    const serie = lerSerieHistorica([
      { data: '26/10/2026', valor: '14.75' },
      { data: '27/10/2026', valor: '15.00' },
    ]);
    expect(serie).toEqual({ datas: ['2026-10-26', '2026-10-27'], valores: [14.75, 15] });
  });

  it('valor ausente, vazio, zero ou inválido vira null na mesma posição, nunca 0', () => {
    const serie = lerSerieHistorica([
      { data: '01/10/2026', valor: 'x' },
      { data: '02/10/2026', valor: '' },
      { data: '05/10/2026', valor: '0' },
      { data: '06/10/2026', valor: '5.25' },
    ]);
    expect(serie.datas).toHaveLength(4);
    expect(serie.valores).toEqual([null, null, null, 5.25]);
  });

  it('registro com data inválida sai da lista, sem deslocar os outros', () => {
    const serie = lerSerieHistorica([
      { data: 'ontem', valor: '5.00' },
      { data: '27/10/2026', valor: '5.10' },
    ]);
    expect(serie).toEqual({ datas: ['2026-10-27'], valores: [5.1] });
  });

  it('entrada ausente ou que não é lista devolve séries vazias', () => {
    expect(lerSerieHistorica(undefined)).toEqual({ datas: [], valores: [] });
    expect(lerSerieHistorica(null)).toEqual({ datas: [], valores: [] });
    expect(lerSerieHistorica({})).toEqual({ datas: [], valores: [] });
  });
});
