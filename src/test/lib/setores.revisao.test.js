import { describe, expect, it } from 'vitest';
import { setoresPorPeriodo, variacaoDaAcao } from '../../lib/setores.js';
import { maisNegociadaPorSetor } from '../../lib/listaAcoes.js';

const campo = (valor) => ({ valor, status: 'ok' });
const resumo = (ticker, d1, volume = 1000) => ({
  ticker,
  variacao_preco: { d1: campo(d1) },
  volume: { total: campo(volume) },
});
const acao = (ticker, setor = 'Financeiro') => ({ ticker, empresa: ticker, setor });

// RAIZ4 com grupamento não ajustado: +8.933% no dia (fração 89,33) — registro suspeito.
const RAIZ4 = resumo('RAIZ4', 89.33);
const ACOES = [acao('RAIZ4', 'Petróleo, Gás e Biocombustíveis'), acao('PETR4', 'Petróleo, Gás e Biocombustíveis')];

describe('ação suspeita fora das contas do setor', () => {
  it('no dia, a suspeita não entra na média, na contagem nem nos valores do setor', () => {
    const [setor] = setoresPorPeriodo([RAIZ4, resumo('PETR4', 0.01)], ACOES, 'd1');

    expect(setor.media).toBeCloseTo(0.01);
    expect(setor.n).toBe(1);
    expect(setor.total).toBe(2);
    expect(setor.subiram).toBe(1);
    expect(setor.emRevisao).toEqual(['RAIZ4']);
    expect(setor.acoes.find((a) => a.ticker === 'RAIZ4').variacao).toBeNull();
  });

  it('variacaoDaAcao no dia: suspeita vira valor null com revisao true; crível passa', () => {
    expect(variacaoDaAcao(RAIZ4, 'd1')).toEqual({ valor: null, revisao: true });
    expect(variacaoDaAcao(resumo('X3', 0.02), 'd1')).toEqual({ valor: 0.02, revisao: false });
  });

  it('1 semana: janela com salto de escala fica de fora e vai para revisão', () => {
    const serie = {
      datas: ['d1', 'd2', 'd3', 'd4', 'd5'],
      valores: { fechamento: [0.3, 27.1, 27.2, 27.0, 27.3] },
    };
    const petr = { datas: ['d1', 'd2'], valores: { fechamento: [10, 10.1] } };
    const series = new Map([['RAIZ4', serie], ['PETR4', petr]]);
    const [setor] = setoresPorPeriodo([RAIZ4, resumo('PETR4', 0.01)], ACOES, 's1', series);

    expect(setor.emRevisao).toEqual(['RAIZ4']);
    expect(setor.n).toBe(1);
    expect(setor.media).toBeCloseTo(0.01);
  });

  it('1 semana: série sem salto dá a variação de fechamento do primeiro ao último pregão', () => {
    const serie = { datas: ['d1', 'd2', 'd3', 'd4', 'd5'], valores: { fechamento: [10, 10.5, 11, 10.8, 11] } };
    const { valor, revisao } = variacaoDaAcao(null, 's1', serie);
    expect(valor).toBeCloseTo(0.1);
    expect(revisao).toBe(false);
  });

  it('1 semana sem série: valor null (nunca 0), sem revisão', () => {
    expect(variacaoDaAcao(null, 's1', undefined)).toEqual({ valor: null, revisao: false });
  });
});

describe('maisNegociadaPorSetor', () => {
  it('escolhe a ação de maior volume de cada setor', () => {
    const resumos = [resumo('PETR4', 0.01, 500), resumo('PRIO3', 0.02, 900), resumo('VBBR3', 0.0, 300)];
    const acoes = [
      { ticker: 'PETR4', setor_nome: 'Petróleo e gás' },
      { ticker: 'PRIO3', setor_nome: 'Petróleo e gás' },
      { ticker: 'VBBR3', setor_nome: 'Petróleo e gás' },
    ];
    expect([...maisNegociadaPorSetor(acoes, resumos)]).toEqual(['PRIO3']);
  });

  it('ação sem volume não concorre; sem dados devolve conjunto vazio', () => {
    const acoes = [{ ticker: 'A1', setor_nome: 'Bancos' }];
    expect(maisNegociadaPorSetor(acoes, [{ ticker: 'A1' }]).size).toBe(0);
    expect(maisNegociadaPorSetor(undefined, undefined).size).toBe(0);
  });
});
