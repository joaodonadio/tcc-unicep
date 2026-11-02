import { describe, expect, it } from 'vitest';
import { maioresPagadoras, pagamentosPorMes } from '../../lib/proventosTela.js';

const evento = (data_pagamento) => ({ data_pagamento, ticker: 'PETR4', tipo: 'DIVIDENDO' });

describe('pagamentosPorMes', () => {
  it('devolve os próximos meses a partir do mês de hoje, em ordem', () => {
    const { datas } = pagamentosPorMes([], '2026-10-29', 4);
    expect(datas).toEqual(['2026-10-01', '2026-11-01', '2026-12-01', '2027-01-01']);
  });

  it('o padrão são 6 meses e a virada de ano segue a sequência', () => {
    const { datas } = pagamentosPorMes([], '2026-10-29');
    expect(datas).toHaveLength(6);
    expect(datas.at(-1)).toBe('2027-03-01');
  });

  it('mês sem pagamento vale 0, porque é contagem de eventos', () => {
    const futuros = [evento('2026-10-23'), evento('2026-10-26'), evento('2026-12-03')];
    const { valores } = pagamentosPorMes(futuros, '2026-10-29', 4);
    expect(valores).toEqual([2, 0, 1, 0]);
  });

  it('conta só os eventos dos meses da janela e ignora data nula', () => {
    const futuros = [evento('2026-11-05'), evento('2027-06-01'), evento(null), evento('2026-09-30')];
    const { valores } = pagamentosPorMes(futuros, '2026-10-29', 3);
    expect(valores).toEqual([0, 1, 0]);
  });

  it('sem lista de pagamentos (dados não carregados) os valores são null, nunca 0', () => {
    const { valores } = pagamentosPorMes(undefined, '2026-10-29', 3);
    expect(valores).toEqual([null, null, null]);
  });

  it('data de hoje inválida devolve janela vazia', () => {
    expect(pagamentosPorMes([], '', 6)).toEqual({ datas: [], valores: [] });
  });
});

describe('maioresPagadoras', () => {
  const resumos = [
    { ticker: 'AAAA3', dividend_yield: { valor: 0.05, status: 'ok' } },
    { ticker: 'BBBB3', dividend_yield: { valor: null, status: 'indisponivel' } },
    { ticker: 'CCCC3', dividend_yield: { valor: 0.12, status: 'ok' } },
    { ticker: 'DDDD3', dividend_yield: { valor: 0.08, status: 'ok' } },
    { ticker: 'EEEE3' },
  ];
  const acoes = [
    { ticker: 'AAAA3', empresa: 'Alfa' },
    { ticker: 'CCCC3', empresa: 'Gama' },
    { ticker: 'DDDD3', empresa: 'Delta' },
  ];

  it('ordena do maior para o menor dividend yield e numera as posições', () => {
    const ranking = maioresPagadoras(resumos, acoes);
    expect(ranking.map((r) => r.ticker)).toEqual(['CCCC3', 'DDDD3', 'AAAA3']);
    expect(ranking.map((r) => r.posicao)).toEqual([1, 2, 3]);
  });

  it('ignora dividend yield nulo ou ausente, sem tratar como 0', () => {
    const ranking = maioresPagadoras(resumos, acoes);
    expect(ranking.find((r) => r.ticker === 'BBBB3')).toBeUndefined();
    expect(ranking.find((r) => r.ticker === 'EEEE3')).toBeUndefined();
    expect(ranking).toHaveLength(3);
  });

  it('corta no limite n e a proporção é relativa ao maior', () => {
    const ranking = maioresPagadoras(resumos, acoes, 2);
    expect(ranking).toHaveLength(2);
    expect(ranking[0].proporcao).toBe(1);
    expect(ranking[1].proporcao).toBeCloseTo(0.08 / 0.12, 10);
  });

  it('traz a empresa de acoes e devolve null quando não há cadastro', () => {
    const ranking = maioresPagadoras(resumos, acoes);
    expect(ranking.find((r) => r.ticker === 'CCCC3').empresa).toBe('Gama');
    const semCadastro = maioresPagadoras([{ ticker: 'ZZZZ3', dividend_yield: { valor: 0.03, status: 'ok' } }], []);
    expect(semCadastro[0].empresa).toBeNull();
  });

  it('o padrão é o top 10', () => {
    const muitas = Array.from({ length: 15 }, (_, i) => ({
      ticker: `T${String(i).padStart(2, '0')}3`,
      dividend_yield: { valor: 0.01 * (i + 1), status: 'ok' },
    }));
    expect(maioresPagadoras(muitas, [])).toHaveLength(10);
  });

  it('sem resumos devolve lista vazia', () => {
    expect(maioresPagadoras(undefined, acoes)).toEqual([]);
  });
});
