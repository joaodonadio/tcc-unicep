import { describe, expect, it } from 'vitest';
import { velasDoDia, velasPorSetor } from '../../lib/velasSetores.js';

const DATAS = Array.from({ length: 30 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
const serie = (datas, fechamentos) => ({ datas, valores: { fechamento: fechamentos } });
const acao = (ticker, setor) => ({ ticker, setor });

describe('velasPorSetor', () => {
  it('setor sem nenhuma ação com série: vela null, n 0, sem zero no lugar do vazio', () => {
    const [setor] = velasPorSetor([acao('A', 'Gama')], new Map([['A', null]]), 'a1');
    expect(setor.vela).toBeNull();
    expect(setor.n).toBe(0);
    expect(setor.total).toBe(1);
  });

  it('salto de escala fica em emRevisao e fora da conta do setor', () => {
    const series = new Map([
      ['A', serie(DATAS.slice(0, 5), [10, 10, 30, 31, 32])],
      ['C', serie(DATAS.slice(0, 5), [10, 11, 12, 13, 14])],
    ]);
    const [setor] = velasPorSetor([acao('A', 'Alfa'), acao('C', 'Alfa')], series, 's1');
    expect(setor.emRevisao).toEqual(['A']);
    expect(setor.n).toBe(1);
    expect(setor.total).toBe(2);
    expect(setor.vela.fechamento).toBeCloseTo(0.4, 10);
  });

  it('alta termina com fechamento positivo; queda, negativo', () => {
    const series = new Map([
      ['U', serie(DATAS.slice(0, 5), [10, 11, 12, 13, 14])],
      ['D', serie(DATAS.slice(0, 5), [10, 9, 8, 7, 6])],
    ]);
    const lista = velasPorSetor([acao('U', 'Alta'), acao('D', 'Queda')], series, 's1');
    expect(lista.find((v) => v.setor === 'Alta').vela.fechamento).toBeGreaterThan(0);
    expect(lista.find((v) => v.setor === 'Queda').vela.fechamento).toBeLessThan(0);
  });

  it('invariante: abertura 0 e o corpo dentro do pavio', () => {
    const casos = [
      [10, 11, 12, 13, 14],
      [10, 9, 8, 7, 6],
      [10, 12, 9, 11, 8],
    ];
    for (const fech of casos) {
      const series = new Map([['A', serie(DATAS.slice(0, 5), fech)]]);
      const { vela } = velasPorSetor([acao('A', 'Alfa')], series, 's1')[0];
      expect(vela.abertura).toBe(0);
      expect(vela.maxima).toBeGreaterThanOrEqual(Math.max(vela.abertura, vela.fechamento));
      expect(Math.min(vela.abertura, vela.fechamento)).toBeGreaterThanOrEqual(vela.minima);
    }
  });

  it('média simples do retorno acumulado: índice [0, 0.05, 0]', () => {
    const series = new Map([
      ['A', serie(DATAS.slice(0, 3), [10, 12, 11])],
      ['B', serie(DATAS.slice(0, 3), [10, 9, 9])],
    ]);
    const [setor] = velasPorSetor([acao('A', 'Alfa'), acao('B', 'Alfa')], series, 'a1');
    expect(setor.vela.fechamento).toBeCloseTo(0, 10);
    expect(setor.vela.maxima).toBeCloseTo(0.05, 10);
    expect(setor.vela.minima).toBeCloseTo(0, 10);
  });

  it('falta no meio repete o fechamento anterior; falta no 1º dia tira a ação de n sem marcar revisão', () => {
    const meio = new Map([
      ['A', serie([DATAS[0], DATAS[2]], [10, 12])],
      ['B', serie(DATAS.slice(0, 3), [10, 11, 12])],
    ]);
    const [caso1] = velasPorSetor([acao('A', 'Alfa'), acao('B', 'Beta')], meio, 's1').filter((v) => v.setor === 'Alfa');
    expect(caso1.vela.maxima).toBeCloseTo(0.2, 10);
    expect(caso1.vela.minima).toBe(0);

    const inicio = new Map([
      ['A', serie([DATAS[1], DATAS[2]], [10, 12])],
      ['B', serie(DATAS.slice(0, 3), [10, 11, 12])],
    ]);
    const [caso2] = velasPorSetor([acao('A', 'Alfa'), acao('B', 'Alfa')], inicio, 's1');
    expect(caso2.n).toBe(1);
    expect(caso2.emRevisao).toEqual([]);
  });

  it('s1 usa só os últimos 6 pontos (5 pregões de variação)', () => {
    const fech = Array.from({ length: 30 }, (_, i) => i + 1);
    const series = new Map([['A', serie(DATAS, fech)]]);
    const [setor] = velasPorSetor([acao('A', 'Alfa')], series, 's1');
    expect(setor.inicio).toBe(DATAS[24]);
    expect(setor.fim).toBe(DATAS[29]);
  });

  it('ordem: fechamento decrescente e vela null por último', () => {
    const series = new Map([
      ['U', serie(DATAS.slice(0, 5), [10, 11, 12, 13, 14])],
      ['D', serie(DATAS.slice(0, 5), [10, 9, 8, 7, 6])],
      ['N', null],
    ]);
    const lista = velasPorSetor(
      [acao('D', 'Beta'), acao('U', 'Alfa'), acao('N', 'Gama')],
      series,
      's1',
    );
    expect(lista.map((v) => v.setor)).toEqual(['Alfa', 'Beta', 'Gama']);
    expect(lista.at(-1).vela).toBeNull();
  });
});

describe('velasDoDia', () => {
  it('média null dá vela null; média positiva e negativa geram corpo e pavio certos', () => {
    const [nula, positiva, negativa] = velasDoDia([
      { setor: 'X', media: null, n: 0, total: 2 },
      { setor: 'Y', media: 0.02, n: 2, total: 2 },
      { setor: 'Z', media: -0.01, n: 2, total: 2 },
    ]);
    expect(nula.vela).toBeNull();
    expect(positiva.vela).toEqual({ abertura: 0, fechamento: 0.02, maxima: 0.02, minima: 0 });
    expect(negativa.vela.minima).toBe(-0.01);
    expect(negativa.vela.maxima).toBe(0);
  });
});
