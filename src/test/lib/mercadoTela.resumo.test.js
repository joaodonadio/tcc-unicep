import { describe, expect, it } from 'vitest';
import {
  comPeriodosIbovespa,
  frasesDoResumo,
  pontoHaMeses,
  rentabilidadeIbovDos,
  ROTULO_IBOVESPA,
  ultimoPonto,
} from '../../lib/mercadoTela.js';
import { TEXTOS } from '../../lib/textos.js';

const ok = (valor) => ({ valor, status: 'ok' });

describe('rentabilidadeIbovDos', () => {
  it('usa o primeiro resumo que tem algum valor do Ibovespa', () => {
    const resumos = [
      { ticker: 'AAAA3', rentabilidade: { ibov: { m1: { valor: null, status: 'indisponivel' } } } },
      { ticker: 'BBBB3', rentabilidade: { ibov: { m1: ok(0.089), m6: ok(0.066), a1: ok(0.435) } } },
    ];
    expect(rentabilidadeIbovDos(resumos)).toEqual({ m1: 0.089, m6: 0.066, a1: 0.435 });
  });

  it('sem nenhum valor (ou sem resumos) devolve null', () => {
    expect(rentabilidadeIbovDos([{ rentabilidade: { ibov: { m1: { valor: null, status: 'x' } } } }])).toBeNull();
    expect(rentabilidadeIbovDos([])).toBeNull();
    expect(rentabilidadeIbovDos(undefined)).toBeNull();
  });
});

describe('comPeriodosIbovespa', () => {
  const indicadores = [
    { label: 'Dólar (R$)', valor: '5,30', delta: '+0,4%', sinal: 'up' },
    { label: ROTULO_IBOVESPA, valor: '130.000', delta: '+0,5%', sinal: 'up' },
  ];

  it('preenche 1 mês, 6 meses e 1 ano só na linha do Ibovespa, com a fração em %', () => {
    const [, ibov] = comPeriodosIbovespa(indicadores, { m1: 0.089, m6: 0.0666, a1: 0.435 });
    expect(ibov.periodos).toEqual([
      { rotulo: TEXTOS.mercado.periodos['1m'], valor_texto: '+8,9%', sinal: 'up' },
      { rotulo: TEXTOS.mercado.periodos['6m'], valor_texto: '+6,7%', sinal: 'up' },
      { rotulo: TEXTOS.mercado.periodos['1a'], valor_texto: '+43,5%', sinal: 'up' },
    ]);
    expect(indicadores[0].periodos).toBeUndefined();
  });

  it('período sem valor fica com texto nulo (nunca 0%)', () => {
    const [, ibov] = comPeriodosIbovespa(indicadores, { m1: null, m6: -0.02, a1: null });
    expect(ibov.periodos[0].valor_texto).toBeNull();
    expect(ibov.periodos[1]).toMatchObject({ valor_texto: '−2,0%', sinal: 'down' });
    expect(ibov.periodos[2].valor_texto).toBeNull();
  });

  it('sem rentabilidade devolve a lista como está', () => {
    expect(comPeriodosIbovespa(indicadores, null)).toBe(indicadores);
  });
});

describe('ultimoPonto e pontoHaMeses', () => {
  const serie = {
    datas: ['2025-10-27', '2025-10-28', '2026-10-26', '2026-10-27', '2026-10-28'],
    valores: [14.25, 14.5, 14.75, null, 15],
  };

  it('ultimoPonto pula faltas no fim', () => {
    expect(ultimoPonto(serie)).toEqual({ data: '2026-10-28', valor: 15 });
    expect(ultimoPonto({ datas: ['2026-10-27'], valores: [null] })).toBeNull();
  });

  it('pontoHaMeses pega o último ponto de até 12 meses antes', () => {
    expect(pontoHaMeses(serie, 12)).toEqual({ data: '2025-10-28', valor: 14.5 });
  });

  it('sem ponto tão antigo devolve null', () => {
    const curta = { datas: ['2026-06-01', '2026-10-27'], valores: [14, 15] };
    expect(pontoHaMeses(curta, 12)).toBeNull();
  });
});

describe('frasesDoResumo', () => {
  it('junta o número de ações e o estado do dia, só com fatos', () => {
    expect(frasesDoResumo({ ativos_analisados: 85 }, 'volatil')).toBe('85 ações acompanhadas. Dia volátil.');
    expect(frasesDoResumo({ ativos_analisados: 1 }, 'estavel')).toBe('1 ação acompanhada. Dia estável.');
  });

  it('o que faltar some da frase; sem dado nenhum, vazio', () => {
    expect(frasesDoResumo({ ativos_analisados: 85 }, null)).toBe('85 ações acompanhadas.');
    expect(frasesDoResumo(undefined, 'estavel')).toBe('Dia estável.');
    expect(frasesDoResumo({ ativos_analisados: 'x' }, undefined)).toBe('');
    expect(frasesDoResumo(undefined, undefined)).toBe('');
  });
});
