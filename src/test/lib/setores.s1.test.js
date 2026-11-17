import { describe, expect, it } from 'vitest';
import { semanaNoResumo, variacaoDaAcao } from '../../lib/setores.js';

const campo = (valor, status = 'ok') => ({ valor, status });
const resumoComS1 = (s1) => ({ ticker: 'PETR4', variacao_preco: { s1 } });

// Série que daria outra variação (+10%) se fosse usada no lugar do campo pronto.
const SERIE = { datas: ['d1', 'd2', 'd3', 'd4', 'd5'], valores: { fechamento: [10, 10.5, 11, 10.8, 11] } };

describe('1 semana pelo resumo (variacao_preco.s1)', () => {
  it('campo ok vale mesmo com série disponível', () => {
    expect(variacaoDaAcao(resumoComS1(campo(0.02)), 's1', SERIE)).toEqual({ valor: 0.02, revisao: false });
  });

  it('campo indisponível vira null sem usar a série', () => {
    expect(variacaoDaAcao(resumoComS1(campo(null, 'indisponivel')), 's1', SERIE)).toEqual({ valor: null, revisao: false });
  });

  it('campo fora dos limites vai para revisão', () => {
    expect(variacaoDaAcao(resumoComS1(campo(3.5)), 's1', SERIE)).toEqual({ valor: null, revisao: true });
  });

  it('sem o campo s1, usa a série da semana', () => {
    const { valor, revisao } = variacaoDaAcao({ ticker: 'PETR4', variacao_preco: {} }, 's1', SERIE);
    expect(valor).toBeCloseTo(0.1);
    expect(revisao).toBe(false);
  });
});

describe('semanaNoResumo', () => {
  it('true quando todas as ações trazem variacao_preco.s1', () => {
    expect(semanaNoResumo([resumoComS1(campo(0.01)), resumoComS1(campo(null, 'indisponivel'))])).toBe(true);
  });

  it('false quando alguma ação não traz o campo', () => {
    expect(semanaNoResumo([resumoComS1(campo(0.01)), { ticker: 'VALE3', variacao_preco: {} }])).toBe(false);
  });

  it('false para lista vazia ou ausente', () => {
    expect(semanaNoResumo([])).toBe(false);
    expect(semanaNoResumo()).toBe(false);
    expect(semanaNoResumo(undefined)).toBe(false);
  });
});
