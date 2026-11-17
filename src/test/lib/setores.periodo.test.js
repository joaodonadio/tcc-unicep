import { describe, expect, it } from 'vitest';
import { variacaoDaAcao } from '../../lib/setores.js';

const ok = (valor) => ({ valor, status: 'ok' });

describe('variacaoDaAcao: períodos com preço sem ajuste', () => {
  it('dia suspeito põe todos os períodos da ação em revisão', () => {
    const resumo = { variacao_preco: { d1: ok(89.33), m1: ok(80), m6: ok(60), a1: ok(40) } };
    expect(variacaoDaAcao(resumo, 'm1')).toEqual({ valor: null, revisao: true });
    expect(variacaoDaAcao(resumo, 'a1')).toEqual({ valor: null, revisao: true });
  });

  it('período além dos limites fica em revisão mesmo com o dia normal', () => {
    const resumo = { variacao_preco: { d1: ok(0.01), m6: ok(12.5), a1: ok(-0.95) } };
    expect(variacaoDaAcao(resumo, 'm6')).toEqual({ valor: null, revisao: true });
    expect(variacaoDaAcao(resumo, 'a1')).toEqual({ valor: null, revisao: true });
  });

  it('período possível passa como veio', () => {
    const resumo = { variacao_preco: { d1: ok(0.01), m1: ok(-0.09), a1: ok(0.32) } };
    expect(variacaoDaAcao(resumo, 'm1')).toEqual({ valor: -0.09, revisao: false });
    expect(variacaoDaAcao(resumo, 'a1')).toEqual({ valor: 0.32, revisao: false });
  });
});
