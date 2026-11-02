import { describe, expect, it } from 'vitest';
import {
  acumuladoNaJanela,
  alinharSeries,
  buscarLinhas,
  completarIndicadores,
  destaquePorSetor,
  linhasDeVolume,
  periodosDaSerie,
  celulaHoje,
  geometriaBarra,
  sinalDoTexto,
  tomDoSaldo,
  ultimoValor,
} from '../../lib/mercadoTela.js';

const datasDe = (n) => Array.from({ length: n }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);

describe('acumuladoNaJanela', () => {
  it('mede a rentabilidade a partir do primeiro valor finito e mantém null nas faltas', () => {
    const datas = datasDe(5);
    const serie = {
      datas,
      valores: { indice_retorno_total: [null, 100, null, 110, 105] },
    };

    const r = acumuladoNaJanela(serie, 5);

    expect(r.datas).toEqual(datas);
    expect(r.valores[0]).toBeNull();
    expect(r.valores[1]).toBeCloseTo(0, 10);
    expect(r.valores[2]).toBeNull();
    expect(r.valores[3]).toBeCloseTo(0.1, 10);
    expect(r.valores[4]).toBeCloseTo(0.05, 10);
  });

  it('usa só os últimos n pregões da série', () => {
    const datas = datasDe(10);
    const valores = [50, 50, 50, 50, 50, 100, 110, 120, 130, 140];
    const r = acumuladoNaJanela({ datas, valores: { indice_retorno_total: valores } }, 5);

    expect(r.datas).toEqual(datas.slice(-5));
    expect(r.valores[0]).toBeCloseTo(0, 10);
    expect(r.valores[4]).toBeCloseTo(0.4, 10);
  });

  it('janela curta (série com menos pregões que n) devolve null', () => {
    const serie = { datas: datasDe(5), valores: { indice_retorno_total: [1, 2, 3, 4, 5] } };
    expect(acumuladoNaJanela(serie, 22)).toBeNull();
  });

  it('janela inválida ou com menos de 2 pontos finitos devolve null', () => {
    const datas = datasDe(4);
    expect(acumuladoNaJanela({ datas, valores: { indice_retorno_total: [1, 2, 3, 4] } }, 1)).toBeNull();
    expect(acumuladoNaJanela({ datas, valores: { indice_retorno_total: [null, null, 5, null] } }, 4)).toBeNull();
    expect(acumuladoNaJanela(null, 22)).toBeNull();
  });
});

describe('ultimoValor', () => {
  it('devolve o último valor finito, pulando faltas no fim', () => {
    expect(ultimoValor({ valores: [0, 0.02, null] })).toBeCloseTo(0.02, 10);
    expect(ultimoValor({ valores: [null, null] })).toBeNull();
    expect(ultimoValor(null)).toBeNull();
  });
});

describe('alinharSeries', () => {
  it('alinha pelas datas da primeira série e põe null onde a data falta', () => {
    const base = { datas: ['2026-01-01', '2026-01-02', '2026-01-05'], valores: [0, 0.01, 0.02] };
    const outra = { datas: ['2026-01-02', '2026-01-05'], valores: [0.5, 0.6] };

    const [b, o] = alinharSeries([base, outra]);

    expect(b).toEqual([0, 0.01, 0.02]);
    expect(o).toEqual([null, 0.5, 0.6]);
  });

  it('com as mesmas datas devolve os valores como estão', () => {
    const datas = datasDe(3);
    const a = { datas, valores: [0, 1, 2] };
    const b = { datas, valores: [3, null, 5] };
    expect(alinharSeries([a, b])).toEqual([
      [0, 1, 2],
      [3, null, 5],
    ]);
  });

  it('lista vazia devolve lista vazia', () => {
    expect(alinharSeries([])).toEqual([]);
  });
});

describe('celulas e barras', () => {
  it('Hoje usa a variação do dia quando ela existe e o valor quando o indicador só traz variação', () => {
    expect(celulaHoje({ valor: '128.345', delta: '+1,2%', sinal: 'up' })).toEqual({
      texto: '+1,2%',
      sinal: 'up',
      nivel: '128.345',
    });
    expect(celulaHoje({ valor: '+0,5%', delta: 'variação do dia', sinal: 'flat' })).toEqual({
      texto: '+0,5%',
      sinal: 'up',
      nivel: null,
    });
    expect(celulaHoje({ valor: '—', delta: '—', sinal: 'flat' }).texto).toBe('—');
  });

  it('a barra sai do meio para o lado do sinal, com largura proporcional até 50', () => {
    expect(geometriaBarra(-2, 4)).toEqual({ lado: 'queda', largura: 25 });
    expect(geometriaBarra(4, 4)).toEqual({ lado: 'alta', largura: 50 });
    expect(geometriaBarra(0, 4)).toEqual({ lado: null, largura: 0 });
    expect(geometriaBarra(null, 4)).toEqual({ lado: null, largura: 0 });
  });

  it('sinal do texto e tom do saldo', () => {
    expect(sinalDoTexto('+1,0%')).toBe('up');
    expect(sinalDoTexto('−1,0%')).toBe('down');
    expect(sinalDoTexto('4,5%')).toBe('flat');
    expect(tomDoSaldo(0.3)).toBe('positivas');
    expect(tomDoSaldo(-0.3)).toBe('negativas');
    expect(tomDoSaldo(0.05)).toBe('equilibrado');
    expect(tomDoSaldo(null)).toBeNull();
  });
});

describe('periodosDaSerie', () => {
  const serie = (n, f = (i) => 100 + i) => ({
    datas: Array.from({ length: n }, (_, i) => `d${i}`),
    valores: { indice_retorno_total: Array.from({ length: n }, (_, i) => f(i)) },
  });

  it('calcula dia, 1 mês, 6 meses e 1 ano pelos pregões', () => {
    const p = periodosDaSerie(serie(253));
    expect(p.d1).toBeCloseTo(352 / 351 - 1, 10);
    expect(p.m1).toBeCloseTo(352 / 331 - 1, 10);
    expect(p.m6).toBeCloseTo(352 / 226 - 1, 10);
    expect(p.a1).toBeCloseTo(352 / 100 - 1, 10);
  });

  it('história curta deixa null o que não dá para calcular, nunca 0', () => {
    expect(periodosDaSerie(serie(30))).toEqual({ d1: expect.any(Number), m1: expect.any(Number), m6: null, a1: null });
    expect(periodosDaSerie(undefined)).toEqual({ d1: null, m1: null, m6: null, a1: null });
  });

  it('sem retorno total usa o fechamento', () => {
    const p = periodosDaSerie({ datas: ['a', 'b'], valores: { fechamento: [100, 110] } });
    expect(p.d1).toBeCloseTo(0.1, 10);
  });
});

describe('completarIndicadores', () => {
  const calc = { d1: 0.01, m1: 0.02, m6: null, a1: 0.3 };

  it('o valor do pacote tem prioridade e a série só completa o que falta', () => {
    const [idiv] = completarIndicadores(
      [{ label: 'IDIV', valor: 'Indisponível', delta: 'variação do dia', sinal: 'flat', periodos: [
        { rotulo: '1 mês', valor_texto: '+9,0%', sinal: 'up' },
        { rotulo: '6 meses', valor_texto: null, sinal: 'flat' },
        { rotulo: '1 ano', valor_texto: null, sinal: 'flat' },
      ] }],
      { IDIV: calc },
    );
    expect(idiv.valor).toBe('+1,0%');
    expect(idiv.calculado.hoje).toBe(true);
    expect(idiv.periodos[0]).toEqual({ rotulo: '1 mês', valor_texto: '+9,0%', sinal: 'up' });
    expect(idiv.periodos[1].valor_texto).toBeNull();
    expect(idiv.periodos[2]).toMatchObject({ valor_texto: '+30,0%', calculado: true });
  });

  it('linha sem série (Brent) continua igual', () => {
    const brent = { label: 'Petróleo Brent (US$)', valor: '80', delta: '—', sinal: 'flat' };
    expect(completarIndicadores([brent], { IDIV: calc })).toEqual([brent]);
  });
});

describe('volume por ação', () => {
  const resumos = [
    { ticker: 'AAA3', volume: { total: { valor: 10, status: 'ok' } }, cotacao: {} },
    { ticker: 'BBB3', volume: { total: { valor: 50, status: 'ok' } }, cotacao: {} },
    { ticker: 'CCC3', volume: { total: { valor: 30, status: 'ok' } }, cotacao: {} },
    { ticker: 'DDD3', cotacao: {} },
  ];
  const acoes = [
    { ticker: 'AAA3', empresa: 'Alfa Ação', setor: 'Financeiro' },
    { ticker: 'BBB3', empresa: 'Beta', setor: 'Financeiro' },
    { ticker: 'CCC3', empresa: 'Gama', setor: 'Saúde' },
    { ticker: 'DDD3', empresa: 'Delta', setor: 'Saúde' },
  ];

  it('ordena pelo maior volume e deixa sem volume no fim', () => {
    expect(linhasDeVolume(resumos, acoes).map((l) => l.ticker)).toEqual(['BBB3', 'CCC3', 'AAA3', 'DDD3']);
  });

  it('o destaque de cada setor é o de maior volume, ordenado por volume', () => {
    expect(destaquePorSetor(linhasDeVolume(resumos, acoes)).map((l) => l.ticker)).toEqual(['BBB3', 'CCC3']);
  });

  it('a busca ignora acento e caixa, em ticker e empresa', () => {
    const linhas = linhasDeVolume(resumos, acoes);
    expect(buscarLinhas(linhas, 'ACAO').map((l) => l.ticker)).toEqual(['AAA3']);
    expect(buscarLinhas(linhas, 'bbb').map((l) => l.ticker)).toEqual(['BBB3']);
    expect(buscarLinhas(linhas, '')).toHaveLength(4);
  });
});
