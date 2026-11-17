import { describe, expect, it } from 'vitest';
import { distribuirFileiras, maiorMediaAbsoluta, nomearVelas, setoresPorPeriodo } from '../../lib/setores.js';

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

describe('distribuirFileiras', () => {
  it('cobre todos os cartões em fileiras de 3 ou 4, sem buraco', () => {
    expect(distribuirFileiras(8)).toEqual([4, 4]);
    expect(distribuirFileiras(9)).toEqual([3, 3, 3]);
    expect(distribuirFileiras(10)).toEqual([3, 3, 4]);
    expect(distribuirFileiras(7)).toEqual([3, 4]);
    expect(distribuirFileiras(6)).toEqual([3, 3]);
    expect(distribuirFileiras(5)).toEqual([2, 3]);
    expect(distribuirFileiras(4)).toEqual([4]);
    expect(distribuirFileiras(3)).toEqual([3]);
    expect(distribuirFileiras(2)).toEqual([2]);
    expect(distribuirFileiras(1)).toEqual([1]);
  });

  it('soma sempre n, com o máximo por fileira respeitado', () => {
    for (let n = 1; n <= 30; n += 1) {
      for (const maximo of [2, 3, 4]) {
        const fileiras = distribuirFileiras(n, maximo);
        expect(fileiras.reduce((soma, f) => soma + f, 0)).toBe(n);
        expect(Math.max(...fileiras)).toBeLessThanOrEqual(maximo);
      }
    }
  });

  it('com máximo 3 (tablet), 8 cartões ficam em [2, 3, 3]; sem cartões, nenhuma fileira', () => {
    expect(distribuirFileiras(8, 3)).toEqual([2, 3, 3]);
    expect(distribuirFileiras(0)).toEqual([]);
  });
});

describe('nomearVelas', () => {
  it('troca o nome bruto do setor pelo curto, sem setor nulo', () => {
    const lista = nomearVelas([{ setor: 'Petróleo, Gás e Biocombustíveis', vela: null }, { setor: null, vela: null }]);
    expect(lista.map((v) => v.setor)).toEqual(['Petróleo e gás']);
  });

  it('lista ausente vira []', () => {
    expect(nomearVelas(undefined)).toEqual([]);
  });
});
