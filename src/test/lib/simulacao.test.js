import { describe, expect, it } from 'vitest';
import { aproximarProventos, escolherPorSemente, serieDolarSimulada, sorteador, variarNoticia } from '../../lib/simulacao.js';

describe('simulação: semente fixa', () => {
  it('o mesmo sorteador repete a sequência, dentro de [0, 1)', () => {
    const a = sorteador('x');
    const b = sorteador('x');
    const lista = Array.from({ length: 5 }, () => a());
    expect(lista).toEqual(Array.from({ length: 5 }, () => b()));
    expect(lista.every((v) => v >= 0 && v < 1)).toBe(true);
  });
  it('escolherPorSemente não depende da ordem', () => {
    expect([...escolherPorSemente(['A', 'B', 'C', 'D'], 2)].sort()).toEqual([...escolherPorSemente(['D', 'C', 'B', 'A'], 2)].sort());
  });
});

describe('serieDolarSimulada', () => {
  const datas = Array.from({ length: 30 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
  it('termina no fechamento e respeita a variação do dia', () => {
    const v = serieDolarSimulada({ datas, fechamento: 5.0333, variacao: 0.0026 });
    expect(v).toHaveLength(30);
    expect(v.at(-1)).toBeCloseTo(5.0333, 4);
    expect(v.at(-1) / v.at(-2) - 1).toBeCloseTo(0.0026, 3);
  });
  it('janela menor é o fim da maior', () => {
    const longa = serieDolarSimulada({ datas, fechamento: 5, variacao: 0.001 });
    const curta = serieDolarSimulada({ datas: datas.slice(-10), fechamento: 5, variacao: 0.001 });
    expect(curta).toEqual(longa.slice(-10));
  });
  it('sem fechamento ou sem datas: null', () => {
    expect(serieDolarSimulada({ datas, fechamento: null, variacao: 0 })).toBeNull();
    expect(serieDolarSimulada({ datas: [], fechamento: 5, variacao: 0 })).toBeNull();
  });
});

describe('variarNoticia e aproximarProventos', () => {
  it('as três contagens somam a quantidade', () => {
    const r = variarNoticia({ ticker: 'AAAA3', resumo: { quantidade: { valor: 29, status: 'ok' }, positivas: { valor: 4 }, neutras: { valor: 11 }, negativas: { valor: 14 } } });
    expect(r.resumo.positivas.valor + r.resumo.neutras.valor + r.resumo.negativas.valor).toBe(29);
  });
  it('hoje inválido devolve a lista intacta', () => {
    const lista = [{ ticker: 'A', data_com: '2020-01-01' }];
    expect(aproximarProventos(lista, null)).toBe(lista);
  });
});
