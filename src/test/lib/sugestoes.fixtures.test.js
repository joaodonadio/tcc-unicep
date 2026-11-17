import { describe, expect, it } from 'vitest';
import { gerarSugestoes, REGRAS, resumirCartao } from '../../lib/sugestoes.js';

/** Campo no formato {valor, status, ...} dos pacotes de dados. */
const c = (valor, status = 'ok', extra = {}) => ({ valor, status, ...extra });

const regra = (id) => REGRAS.find((r) => r.id === id);

/** Registro de resumo_acao sem nenhum sinal disparado. */
const neutro = (over = {}) => ({
  ticker: 'TST3',
  data_referencia: '2026-10-22',
  cotacao: { fechamento: c(10), variacao_dia: c(0) },
  rentabilidade: {
    m1: c(0),
    m6: c(0),
    a1: c(0),
    ibov: { d1: c(0), m1: c(0), m6: c(0), a1: c(0) },
    setor: { d1: c(0), m1: c(0), m6: c(0), a1: c(0) },
  },
  ...over,
});

const SEM_CONTRA = 'Nada nos dados de hoje pesa contra este ponto.';

const sinal = (cartao, id) => cartao.sinais.find((s) => s.id === id);

describe('limites exatos das regras', () => {
  it('volume relativo de 1,5 dispara e 1,4999 não dispara', () => {
    const com = (valor) => neutro({ volume: { relativo: c(valor, 'ok', { texto: 'x' }) } });
    expect(regra('volume_incomum').aplica(com(1.5))).toBe(true);
    expect(regra('volume_incomum').aplica(com(1.4999))).toBe(false);
  });

  it('queda de exatamente 3% no dia dispara e 2,99% não dispara', () => {
    const com = (valor) => neutro({ cotacao: { fechamento: c(10), variacao_dia: c(valor) } });
    expect(regra('queda_forte_dia').aplica(com(-0.03))).toBe(true);
    expect(regra('queda_forte_dia').aplica(com(-0.0299))).toBe(false);
  });

  it('payout de exatamente 100% não dispara e acima de 100% dispara', () => {
    expect(regra('payout_acima_lucro').aplica(neutro({ payout: c(1) }))).toBe(false);
    expect(regra('payout_acima_lucro').aplica(neutro({ payout: c(1.01) }))).toBe(true);
  });

  it('queda de exatamente 15% no mês dispara', () => {
    const com = (m1) => neutro({ rentabilidade: { ...neutro().rentabilidade, m1: c(m1) } });
    expect(regra('queda_forte_mes').aplica(com(-0.15))).toBe(true);
    expect(regra('queda_forte_mes').aplica(com(-0.1499))).toBe(false);
  });

  it('registro sem nenhum sinal não gera cartão', () => {
    expect(gerarSugestoes({ resumos: [neutro()] })).toEqual([]);
  });
});

describe('status diferente de ok não dispara regra', () => {
  it('volume com status historico_insuficiente não dispara, mesmo com valor alto', () => {
    const R = neutro({ volume: { relativo: c(3, 'historico_insuficiente') } });
    expect(regra('volume_incomum').aplica(R)).toBe(false);
  });

  it('valor nulo com status ok não vira zero e não dispara', () => {
    const R = neutro({ payout: c(null) });
    expect(regra('payout_acima_lucro').aplica(R)).toBe(false);
  });

  it('lucro negativo dispara o prejuízo e não dispara o P/L baixo', () => {
    const R = neutro({
      pl: c(null, 'lucro_negativo', { texto: 'Empresa com prejuízo nos últimos 12 meses', setor: c(8) }),
      roe: c(0.1, 'ok', { setor: c(0.05) }),
    });
    expect(regra('prejuizo_12m').aplica(R)).toBe(true);
    expect(regra('pl_baixo_roe_ok').aplica(R)).toBe(false);
  });

  it('notícias com menos de 5 itens não disparam o tom', () => {
    const N = { ticker: 'TST3', resumo: { quantidade: c(4), tom_medio: c(0.5) } };
    expect(regra('noticias_positivas').aplica(neutro(), N)).toBe(false);
  });
});

describe('caixa líquido e dívida', () => {
  it('dívida alta não dispara quando há caixa líquido', () => {
    const R = neutro({ endividamento: { dl_ebitda: c(4), caixa_liquido: { valor: true } } });
    expect(regra('divida_alta').aplica(R)).toBe(false);
    expect(regra('caixa_liquido').aplica(R)).toBe(true);
  });

  it('dívida alta dispara sem caixa líquido', () => {
    const R = neutro({ endividamento: { dl_ebitda: c(4), caixa_liquido: { valor: false } } });
    expect(regra('divida_alta').aplica(R)).toBe(true);
  });
});

describe('O que pesa contra', () => {
  it('ponto forte inclui o texto do ponto de atenção do mesmo cartão', () => {
    const R = neutro({
      pl: c(5, 'ok', { setor: c(10) }),
      roe: c(0.2, 'ok', { setor: c(0.1) }),
      endividamento: { dl_ebitda: c(4), caixa_liquido: { valor: false } },
    });
    const [cartao] = gerarSugestoes({ resumos: [R] });
    const r5 = sinal(cartao, 'pl_baixo_roe_ok');
    const r7 = sinal(cartao, 'divida_alta');

    expect(r5.tipo).toBe('forte');
    expect(r7.tipo).toBe('atencao');
    expect(r5.contra).toContain(r7.simples);
  });

  it('ponto forte sem atenção no cartão usa a frase de nada que pese contra', () => {
    const R = neutro({
      pl: c(5, 'ok', { setor: c(10) }),
      roe: c(0.2, 'ok', { setor: c(0.1) }),
    });
    const [cartao] = gerarSugestoes({ resumos: [R] });
    expect(sinal(cartao, 'pl_baixo_roe_ok').contra).toEqual([SEM_CONTRA]);
  });

  it('queda do dia é amenizada quando o mercado também caiu', () => {
    const R = neutro({
      cotacao: { fechamento: c(10), variacao_dia: c(-0.05) },
      rentabilidade: {
        ...neutro().rentabilidade,
        ibov: { d1: c(-0.02), m1: c(0), m6: c(0), a1: c(0) },
      },
    });
    const [cartao] = gerarSugestoes({ resumos: [R] });
    expect(sinal(cartao, 'queda_forte_dia').contra).toEqual(['o mercado também caiu no dia']);
  });

  it('queda do mês é amenizada quando em 6 meses a ação está acima do Ibovespa', () => {
    const R = neutro({
      rentabilidade: {
        m1: c(-0.2),
        m6: c(0.1),
        a1: c(0),
        ibov: { d1: c(0), m1: c(0), m6: c(0.05), a1: c(0) },
        setor: { d1: c(0), m1: c(0), m6: c(0), a1: c(0) },
      },
    });
    const [cartao] = gerarSugestoes({ resumos: [R] });
    expect(sinal(cartao, 'queda_forte_mes').contra).toEqual(['em 6 meses ainda está acima do Ibovespa']);
  });
});

describe('gerarSugestoes', () => {
  it('ordena por total de sinais (maior primeiro) e, em empate, por ticker', () => {
    const payout = { payout: c(1.5) };
    const queda = { rentabilidade: { ...neutro().rentabilidade, m1: c(-0.2) } };
    const resumos = [
      neutro({ ticker: 'DDD3', ...payout }),
      neutro({ ticker: 'CCC3', ...payout, ...queda }),
      neutro({ ticker: 'AAA3', ...payout }),
      neutro({ ticker: 'BBB3', ...payout, ...queda }),
    ];
    const cartoes = gerarSugestoes({ resumos });

    expect(cartoes.map((s) => s.ticker)).toEqual(['BBB3', 'CCC3', 'AAA3', 'DDD3']);
    expect(cartoes[0].contagem).toEqual({ forte: 0, atencao: 2, contexto: 0, total: 2 });
  });

  it('usa notícias e dados de acoes quando informados', () => {
    const R = neutro({ ticker: 'NEW3' });
    const N = { ticker: 'NEW3', resumo: { quantidade: c(5), tom_medio: c(0.25) } };
    const A = { ticker: 'NEW3', empresa: 'Nova S.A.', setor: 'Teste', ativo_no_universo: true };
    const [cartao] = gerarSugestoes({ resumos: [R], noticias: [N], acoes: [A] });

    expect(cartao).toMatchObject({ ticker: 'NEW3', empresa: 'Nova S.A.', setor: 'Teste', ativoNoUniverso: true });
    expect(sinal(cartao, 'noticias_positivas').tipo).toBe('forte');
  });
});

describe('resumirCartao', () => {
  it('monta a frase com plural e conjunção', () => {
    const cartao = { contagem: { forte: 2, atencao: 1, contexto: 0, total: 3 } };
    expect(resumirCartao(cartao)).toBe('2 pontos fortes nos dados e 1 ponto de atenção');
  });

  it('usa singular quando há um só ponto', () => {
    expect(resumirCartao({ contagem: { forte: 1, atencao: 0, contexto: 0, total: 1 } })).toBe(
      '1 ponto forte nos dados',
    );
  });
});

describe('período suspeito ou dia suspeito', () => {
  const com = (campos, dia = 0) =>
    neutro({
      cotacao: { fechamento: c(10), variacao_dia: c(dia) },
      rentabilidade: { ...neutro().rentabilidade, ...campos },
    });

  it('desempenho_6m dispara com período crível e não dispara com período ou dia suspeito', () => {
    expect(regra('desempenho_6m').aplica(com({ m6: c(0.2) }))).toBe(true);
    expect(regra('desempenho_6m').aplica(com({ m6: c(3.5) }))).toBe(false);
    expect(regra('desempenho_6m').aplica(com({ m6: c(0.2) }, 1.5))).toBe(false);
  });

  it('queda_forte_mes dispara com período crível e não dispara com período ou dia suspeito', () => {
    expect(regra('queda_forte_mes').aplica(com({ m1: c(-0.2) }))).toBe(true);
    expect(regra('queda_forte_mes').aplica(com({ m1: c(-0.9) }))).toBe(false);
    expect(regra('queda_forte_mes').aplica(com({ m1: c(-0.2) }, -0.8))).toBe(false);
  });
});
