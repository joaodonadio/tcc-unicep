import { describe, expect, it } from 'vitest';
import {
  acumuladoNaJanela,
  agruparIndices,
  periodosComNumero,
  resumoDeSerie,
  valorDoCard,
  alinharSeries,
  completarIndicadores,
  periodosDaSerie,
  celulaHoje,
  sinalDoTexto,
  taxaCdiDoDia,
  cdiAoAno,
  selicDoPacote,
  selicPeloCdi,
  selicPelaSerieCdi,
  textoPontos,
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

describe('cartões de índice', () => {
  const ibov = { label: 'Ibovespa (pontos)', valor: '165.529', delta: '-1,4%', sinal: 'down', periodos: [
    { rotulo: '1 mês', valor_texto: '−11,6%', sinal: 'down' },
    { rotulo: '6 meses', valor_texto: null, sinal: 'flat' },
    { rotulo: '1 ano', valor_texto: '+3,2%', sinal: 'up' },
  ] };
  const idiv = { label: 'IDIV', valor: '−0,9%', delta: 'variação do dia', sinal: 'flat', periodos: [
    { rotulo: '1 mês', valor_texto: 'Indisponível', sinal: 'flat' },
    { rotulo: '6 meses', valor_texto: 'Indisponível', sinal: 'flat' },
    { rotulo: '1 ano', valor_texto: 'Indisponível', sinal: 'flat' },
  ] };

  it('agrupa os índices em Bolsa, Juros e inflação e Câmbio e petróleo, sem grupo vazio', () => {
    const grupos = agruparIndices([ibov, idiv, { label: 'Dólar (R$)', valor: '5,03', delta: '+0,3%', sinal: 'up' }]);
    expect(grupos.map((g) => g.titulo)).toEqual(['Bolsa', 'Câmbio e petróleo']);
    expect(grupos[0].itens.map((i) => i.label)).toEqual(['Ibovespa (pontos)', 'IDIV']);
  });

  it('mostra só os períodos com número, sem "Indisponível" e sem 0', () => {
    expect(periodosComNumero(ibov)).toEqual([
      { rotulo: '1 mês', texto: '−11,6%', sinal: 'down', calculado: false },
      { rotulo: '1 ano', texto: '+3,2%', sinal: 'up', calculado: false },
    ]);
    expect(periodosComNumero(idiv)).toEqual([]);
    expect(periodosComNumero({ label: 'Brent' })).toEqual([]);
  });

  it('valor de hoje com a unidade e variação do dia em pílula quando o pacote traz o nível', () => {
    expect(valorDoCard(ibov)).toMatchObject({ grande: '165.529 pontos', dia: { texto: '-1,4%', sinal: 'down' }, sinalGrande: 'flat' });
    const dolar = { label: 'Dólar (R$)', valor: '5,03', delta: '+0,3%', sinal: 'up' };
    expect(valorDoCard(dolar).grande).toBe('R$ 5,03');
  });

  it('quando só há variação como valor (IDIV), o valor grande é ela, sem pílula, com a legenda do delta', () => {
    expect(valorDoCard(idiv)).toEqual({
      grande: '−0,9%',
      legenda: 'variação do dia',
      dia: null,
      sinalGrande: 'down',
      calculado: false,
    });
  });

  it('IPCA com legenda "até" separa o valor da data', () => {
    const ipca = { label: 'IPCA 12M', valor: '4,58% até set/2026', delta: 'inflação acumulada em 12 meses', sinal: 'flat' };
    expect(valorDoCard(ipca)).toMatchObject({ grande: '4,58%', legenda: 'até set/2026' });
  });

  it('valor ausente vira grande null, nunca 0', () => {
    expect(valorDoCard({ label: 'SMLL', valor: '—', delta: '—', sinal: 'flat' })).toMatchObject({ grande: null, legenda: null });
  });
});

describe('série do dólar e do CDI', () => {
  it('resumoDeSerie usa o primeiro e o último ponto com valor, e a variação entre eles', () => {
    const r = resumoDeSerie({ datas: ['2026-10-01', '2026-10-02', '2026-10-05'], valores: [null, 5, 5.5] });
    expect(r.inicio).toEqual({ data: '2026-10-02', valor: 5 });
    expect(r.fim).toEqual({ data: '2026-10-05', valor: 5.5 });
    expect(r.variacao).toBeCloseTo(0.1, 10);
  });

  it('série vazia ou sem valor não tem resumo', () => {
    expect(resumoDeSerie(null)).toBeNull();
    expect(resumoDeSerie({ datas: ['2026-10-01'], valores: [null] })).toBeNull();
  });
});

describe('cdiAoAno', () => {
  it('converte a taxa do dia para o ano em 252 dias úteis, com a data em dia e mês', () => {
    const r = cdiAoAno({ cdi_dia: { valor: 0.00050788, status: 'ok' }, cdi_data: '2026-10-21' });
    expect(r.texto).toBe('13,65%');
    expect(r.valor).toBeCloseTo(0.1365, 4);
    expect(r.data).toBe('21/10');
  });

  it('sem a taxa do dia devolve null (nunca 0), e sem data a data fica null', () => {
    expect(cdiAoAno({})).toBeNull();
    expect(cdiAoAno(null)).toBeNull();
    expect(cdiAoAno({ cdi_dia: { valor: null, status: 'erro' } })).toBeNull();
    expect(cdiAoAno({ cdi_dia: { valor: 0.0005, status: 'ok' } }).data).toBeNull();
  });
});

describe('selicPeloCdi', () => {
  it('soma 0,10 ponto ao CDI ao ano e arredonda ao múltiplo de 0,25', () => {
    const r = selicPeloCdi({ cdi_dia: { valor: 0.00050788, status: 'ok' }, cdi_data: '2026-10-21' });
    expect(r.texto).toBe('13,75%');
    expect(r.valor).toBeCloseTo(0.1375, 6);
    expect(r.cdi.texto).toBe('13,65%');
    expect(r.data).toBe('21/10');
  });

  it('sem CDI devolve null', () => {
    expect(selicPeloCdi({})).toBeNull();
    expect(selicPeloCdi(null)).toBeNull();
  });
});

describe('selicDoPacote', () => {
  it('lê a meta publicada (fração ao ano) e a data dela', () => {
    expect(selicDoPacote({ selic_meta: { valor: 0.1375, status: 'ok' }, selic_data: '2026-11-12' })).toEqual({
      status: 'ok',
      valor: 0.1375,
      data: '2026-11-12',
    });
  });

  it('desatualizada (status diferente de ok): indisponível, sem valor nem data', () => {
    expect(selicDoPacote({ selic_meta: { valor: null, status: 'indisponivel' }, selic_data: null })).toEqual({
      status: 'indisponivel',
      valor: null,
      data: null,
    });
  });

  it('registro antigo sem o campo: sem dado, nunca 0', () => {
    expect(selicDoPacote({ cdi_dia: { valor: 0.0005, status: 'ok' } })).toEqual({ status: 'sem_dado', valor: null, data: null });
    expect(selicDoPacote(undefined)).toEqual({ status: 'sem_dado', valor: null, data: null });
  });
});

describe('selicPelaSerieCdi', () => {
  // índice que rende o CDI de uma taxa ao ano, um dia útil por ponto
  const indice = (taxasAno) => {
    const valores = [100];
    for (const a of taxasAno) valores.push(valores.at(-1) * (1 + a) ** (1 / 252));
    return valores;
  };
  const datas = (n) => Array.from({ length: n }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);

  it('converte o juro de cada dia em Selic e marca a data de cada mudança', () => {
    const taxas = [0.149, 0.149, 0.149, 0.149, 0.1465, 0.1465, 0.1465, 0.1465];
    const r = selicPelaSerieCdi({ datas: datas(9), valores: { indice_retorno_total: indice(taxas) } });
    expect(r.valores).toEqual([0.15, 0.15, 0.15, 0.15, 0.1475, 0.1475, 0.1475, 0.1475]);
    expect(r.datas[0]).toBe('2026-01-01');
    expect(r.mudancas).toEqual([{ data: '2026-01-05', de: 0.15, para: 0.1475 }]);
  });

  it('um dia isolado com juro dobrado (feriado) não vira mudança', () => {
    const taxas = [0.149, 0.149, 0.149, 0.32, 0.149, 0.149, 0.149];
    const r = selicPelaSerieCdi({ datas: datas(8), valores: { indice_retorno_total: indice(taxas) } });
    expect(new Set(r.valores)).toEqual(new Set([0.15]));
    expect(r.mudancas).toEqual([]);
  });

  it('sem série ou com menos de dois dias de juro, null', () => {
    expect(selicPelaSerieCdi(null)).toBeNull();
    expect(selicPelaSerieCdi({ datas: datas(2), valores: { indice_retorno_total: [100, 100.05] } })).toBeNull();
    expect(selicPelaSerieCdi({ datas: datas(3), valores: { indice_retorno_total: [100, null, 100.1] } })).toBeNull();
  });
});

describe('textoPontos', () => {
  it('diferença em pontos, com sinal, singular abaixo de 2', () => {
    expect(textoPontos(-0.0125)).toBe('−1,25 ponto');
    expect(textoPontos(0.025)).toBe('+2,50 pontos');
    expect(textoPontos(null)).toBe('');
  });
});

describe('taxaCdiDoDia', () => {
  it('a fração do dia com quatro casas e o dia e mês da taxa', () => {
    expect(taxaCdiDoDia({ cdi_dia: { valor: 0.00050788, status: 'ok' }, cdi_data: '2026-10-21' })).toEqual({
      texto: '0,0508%',
      data: '21/10',
    });
  });

  it('sem o valor ok, null: a linha não aparece', () => {
    expect(taxaCdiDoDia({ cdi_dia: { valor: null, status: 'indisponivel' }, cdi_data: '2026-10-21' })).toBeNull();
    expect(taxaCdiDoDia({ cdi_data: '2026-10-21' })).toBeNull();
    expect(taxaCdiDoDia(undefined)).toBeNull();
  });

  it('sem a data, o texto da taxa fica e a data vira null', () => {
    expect(taxaCdiDoDia({ cdi_dia: { valor: 0.0005, status: 'ok' } })).toEqual({ texto: '0,0500%', data: null });
  });
});
