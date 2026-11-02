// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { seriesDoBalanco } from '../../lib/balancos.js';
import { numeroCompacto } from '../../lib/formato.js';
import { acumuladoAlinhado, cortarJanela, JANELAS } from '../../lib/series.js';

/** Funções puras dos gráficos da ficha: balanço em séries e setor alinhado às datas da ação. */

const lerRegistros = (arquivo) =>
  JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'dados', arquivo), 'utf8')).registros;

const trimestre = (data, extra = {}) => ({ ticker: 'TESTE3', data_fim_periodo: data, ...extra });

describe('seriesDoBalanco', () => {
  it('ordena os trimestres do mais antigo para o mais recente', () => {
    const r = seriesDoBalanco([
      trimestre('2026-03-31', { receita_12m: { valor: 3, status: 'ok' } }),
      trimestre('2025-12-31', { receita_12m: { valor: 1, status: 'ok' } }),
      trimestre('2026-06-30', { receita_12m: { valor: 4, status: 'ok' } }),
    ]);
    expect(r.datas).toEqual(['2025-12-31', '2026-03-31', '2026-06-30']);
    expect(r.receita12m).toEqual([1, 3, 4]);
  });

  it('preserva a falta como null, na mesma posição do trimestre', () => {
    const r = seriesDoBalanco([
      trimestre('2025-12-31', {
        receita_12m: { valor: 10, status: 'ok' },
        lucro_liquido_12m: { valor: null, status: 'indisponivel' },
        dl_ebitda: { valor: -0.4, status: 'ok' },
      }),
      trimestre('2026-03-31', {
        receita_12m: { valor: null, status: 'indisponivel' },
        lucro_liquido_12m: { valor: 5, status: 'ok' },
        dl_ebitda: { valor: 1.2, status: 'historico_insuficiente' },
      }),
    ]);
    expect(r.receita12m).toEqual([10, null]);
    expect(r.lucro12m).toEqual([null, 5]);
    expect(r.dlEbitda).toEqual([-0.4, null]);
  });

  it('lista vazia ou ausente vira séries vazias', () => {
    expect(seriesDoBalanco([])).toEqual({ datas: [], receita12m: [], lucro12m: [], dlEbitda: [] });
    expect(seriesDoBalanco(undefined).datas).toEqual([]);
  });

  it('ignora registro sem data de fim do período', () => {
    const r = seriesDoBalanco([trimestre(undefined), trimestre('2025-12-31')]);
    expect(r.datas).toEqual(['2025-12-31']);
  });

  it('com dados reais (PETR4) devolve 8 trimestres em ordem crescente', () => {
    const doPetr4 = lerRegistros('fundamentos_trimestrais.json').filter((f) => f.ticker === 'PETR4');
    const r = seriesDoBalanco(doPetr4);
    expect(r.datas).toHaveLength(8);
    expect([...r.datas].sort()).toEqual(r.datas);
    expect(r.receita12m.every((v) => v == null || Number.isFinite(v))).toBe(true);
  });
});

describe('acumuladoAlinhado', () => {
  const base = {
    datas: ['d1', 'd2', 'd3', 'd4'],
    valores: { fechamento: [1, 1, 1, 1] },
  };

  it('alinha o setor às datas da ação e parte de 0 no primeiro valor presente', () => {
    const setor = {
      datas: ['d0', 'd2', 'd3', 'd4'],
      valores: { indice_retorno_total: [90, 100, 110, 121] },
    };
    const r = acumuladoAlinhado(base, setor, JANELAS['1m']);
    expect(r[0]).toBeNull();
    expect(r[1]).toBeCloseTo(0, 10);
    expect(r[2]).toBeCloseTo(0.1, 10);
    expect(r[3]).toBeCloseTo(0.21, 10);
  });

  it('data da ação sem valor no setor vira null', () => {
    const setor = { datas: ['d1', 'd3'], valores: { indice_retorno_total: [100, 105] } };
    const r = acumuladoAlinhado(base, setor, 4);
    expect(r[0]).toBeCloseTo(0, 10);
    expect(r[1]).toBeNull();
    expect(r[2]).toBeCloseTo(0.05, 10);
    expect(r[3]).toBeNull();
  });

  it('usa só os últimos n pregões da ação', () => {
    const setor = {
      datas: ['d1', 'd2', 'd3', 'd4'],
      valores: { indice_retorno_total: [100, 110, 120, 130] },
    };
    const r = acumuladoAlinhado(base, setor, 2);
    expect(r).toHaveLength(2);
    expect(r[0]).toBeCloseTo(0, 10);
    expect(r[1]).toBeCloseTo(130 / 120 - 1, 10);
  });

  it('sem série do setor, ou sem o campo de retorno total, devolve null', () => {
    expect(acumuladoAlinhado(base, null, 4)).toBeNull();
    expect(acumuladoAlinhado(base, { datas: ['d1'], valores: { fechamento: [1] } }, 4)).toBeNull();
    expect(acumuladoAlinhado(null, { datas: ['d1'], valores: { indice_retorno_total: [1] } }, 4)).toBeNull();
  });

  it('com dados reais: setor sem a PETR4 alinhado às datas da PETR4', () => {
    const registros = lerRegistros('series_diarias.json');
    const acao = registros.find((r) => r.ticker === 'PETR4');
    const setor = registros.find((r) => r.ticker === 'SETOR_SEM:PETR4');
    const n = JANELAS['1a'];
    const r = acumuladoAlinhado(acao, setor, n);
    expect(r).toHaveLength(cortarJanela(acao, n).datas.length);
    expect(r.some((v) => v != null)).toBe(true);
  });
});

describe('numeroCompacto', () => {
  it('abrevia com uma casa decimal em pt-BR', () => {
    expect(numeroCompacto(21700000)).toBe('21,7 mi');
    expect(numeroCompacto(1200)).toBe('1,2 mil');
    expect(numeroCompacto(850)).toBe('850');
  });

  it('nulo ou não numérico vira texto vazio, nunca 0', () => {
    expect(numeroCompacto(null)).toBe('');
    expect(numeroCompacto(undefined)).toBe('');
    expect(numeroCompacto(Number.NaN)).toBe('');
  });

  it('negativo usa o sinal de menos tipográfico', () => {
    expect(numeroCompacto(-3400000)).toBe('−3,4 mi');
  });
});
