import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { mesSeguinte, variacoesMensais } from '../../lib/series.js';

const CAMPO = 'indice_retorno_total';
const serie = (pares) => ({ datas: pares.map((p) => p[0]), valores: { [CAMPO]: pares.map((p) => p[1]) } });
const ler = (arquivo) => JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'dados', arquivo), 'utf8')).registros;

describe('variacoesMensais', () => {
  it('último valor do mês sobre o último do mês anterior, menos 1; o primeiro mês só serve de base', () => {
    const r = variacoesMensais(
      serie([['2026-01-20', 100], ['2026-01-30', 101], ['2026-02-10', 102], ['2026-02-27', 103.02], ['2026-03-02', 104.0502]]),
      CAMPO,
    );
    expect(r.meses).toEqual(['2026-02', '2026-03']);
    expect(r.valores[0]).toBeCloseTo(0.02, 10);
    expect(r.valores[1]).toBeCloseTo(0.01, 10);
  });

  it('semUltimoMes tira o mês da última data; ateMes corta os meses depois dele', () => {
    const s = serie([['2026-01-30', 100], ['2026-02-27', 110], ['2026-03-31', 121], ['2026-04-10', 125]]);
    expect(variacoesMensais(s, CAMPO, { semUltimoMes: true }).meses).toEqual(['2026-02', '2026-03']);
    expect(variacoesMensais(s, CAMPO, { ateMes: '2026-02' }).meses).toEqual(['2026-02']);
  });

  it('guarda só os meses mais recentes', () => {
    const pares = Array.from({ length: 15 }, (_, i) => [new Date(Date.UTC(2025, i, 10)).toISOString().slice(0, 10), 100 + i]);
    const r = variacoesMensais(serie(pares), CAMPO, { meses: 12 });
    expect(r.meses).toHaveLength(12);
    expect(r.meses[11]).toBe('2026-03');
  });

  it('mês faltando no meio vira null, nunca 0', () => {
    const r = variacoesMensais(serie([['2026-01-30', 100], ['2026-02-27', null], ['2026-03-31', 121]]), CAMPO);
    expect(r).toEqual({ meses: ['2026-03'], valores: [null] });
  });

  it('sem série ou sem o campo: listas vazias', () => {
    expect(variacoesMensais(null, CAMPO)).toEqual({ meses: [], valores: [] });
    expect(variacoesMensais({ datas: ['2026-01-01'], valores: {} }, CAMPO)).toEqual({ meses: [], valores: [] });
  });

  it('IPCA real: 12 meses até o mês seguinte a ipca_ate; o último bate com o m1 e o produto com os 12 meses', () => {
    const ipca = ler('series_diarias.json').find((r) => r.ticker === 'IPCA');
    const mercado = ler('mercado_dia.json')[0];
    const { valores } = variacoesMensais(ipca, CAMPO, { ateMes: mesSeguinte(mercado.ipca_ate.valor) });
    expect(valores).toHaveLength(12);
    expect(valores[11]).toBeCloseTo(mercado.indices.IPCA.m1.valor, 8);
    expect(valores.reduce((p, v) => p * (1 + v), 1) - 1).toBeCloseTo(mercado.ipca_12m.valor, 8);
  });
});

describe('mesSeguinte', () => {
  it('avança um mês e vira o ano em dezembro; formato inválido dá null', () => {
    expect(mesSeguinte('2026-09')).toBe('2026-10');
    expect(mesSeguinte('2026-12')).toBe('2027-01');
    expect(mesSeguinte('x')).toBeNull();
    expect(mesSeguinte(null)).toBeNull();
  });
});
