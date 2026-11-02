import { describe, expect, it } from 'vitest';
import { maiorMediaAbsoluta, setoresPorPeriodo } from '../../lib/setores.js';

const campo = (valor) => (valor === undefined ? { valor: null, status: 'sem_dado' } : { valor, status: 'ok' });
const resumo = (ticker, d1, m1) => ({ ticker, variacao_preco: { d1: campo(d1), m1: campo(m1) } });
const acao = (ticker, setor) => ({ ticker, empresa: ticker, setor });

const acoes = [
  acao('A1', 'Financeiro'),
  acao('A2', 'Financeiro'),
  acao('A3', 'Financeiro'),
  acao('B1', 'Saúde'),
  acao('C1', 'Comunicações'),
];
const resumos = [
  resumo('A1', 0.04, 0.1),
  resumo('A2', -0.02, 0.2),
  resumo('A3', undefined, undefined),
  resumo('B1', -0.03, undefined),
  resumo('C1', undefined, undefined),
];

describe('setoresPorPeriodo', () => {
  it('faz a média simples só das ações com valor, sem tratar ausência como zero', () => {
    const lista = setoresPorPeriodo(resumos, acoes, 'd1');
    const fin = lista.find((s) => s.setor === 'Financeiro');

    expect(fin.media).toBeCloseTo(0.01);
    expect(fin.n).toBe(2);
    expect(fin.total).toBe(3);
    expect(fin.subiram).toBe(1);
    expect(fin.cairam).toBe(1);
  });

  it('escolhe a melhor e a pior ação do período', () => {
    const fin = setoresPorPeriodo(resumos, acoes, 'd1').find((s) => s.setor === 'Financeiro');

    expect(fin.melhor).toMatchObject({ ticker: 'A1', variacao: 0.04 });
    expect(fin.pior).toMatchObject({ ticker: 'A2', variacao: -0.02 });
    expect(fin.acoes.map((a) => a.ticker)).toEqual(['A1', 'A2', 'A3']);
    expect(fin.acoes[2].variacao).toBeNull();
  });

  it('setor sem nenhum valor fica null e vai para o fim', () => {
    const lista = setoresPorPeriodo(resumos, acoes, 'd1');
    const com = lista.find((s) => s.setor === 'Comunicações');

    expect(com.media).toBeNull();
    expect(com.melhor).toBeNull();
    expect(com.pior).toBeNull();
    expect(lista.at(-1).setor).toBe('Comunicações');
  });

  it('ordena do que mais subiu ao que mais caiu e muda com o período', () => {
    expect(setoresPorPeriodo(resumos, acoes, 'd1').map((s) => s.setor)).toEqual(['Financeiro', 'Saúde', 'Comunicações']);
    const m1 = setoresPorPeriodo(resumos, acoes, 'm1');
    expect(m1[0].setor).toBe('Financeiro');
    expect(m1[0].media).toBeCloseTo(0.15);
    expect(m1.find((s) => s.setor === 'Saúde').media).toBeNull();
  });

  it('aceita entradas vazias', () => {
    expect(setoresPorPeriodo(undefined, undefined, 'a1')).toEqual([]);
    expect(maiorMediaAbsoluta([])).toBe(0);
  });
});
