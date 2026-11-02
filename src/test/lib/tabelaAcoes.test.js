import { describe, expect, it } from 'vitest';
import { linhasDaTabela, ordenarTabela } from '../../lib/tabelaAcoes.js';

const ok = (valor) => ({ valor, status: 'ok' });
const semValor = (status = 'indisponivel', texto = null) => ({ valor: null, status, texto });

const linhas = [
  { ticker: 'AAAA3', pl: ok(10) },
  { ticker: 'BBBB3', pl: semValor() },
  { ticker: 'CCCC3', pl: ok(4) },
  { ticker: 'DDDD3', pl: ok(7) },
];

const tickers = (lista) => lista.map((l) => l.ticker);

describe('ordenarTabela', () => {
  it('ordena números de forma crescente e decrescente', () => {
    expect(tickers(ordenarTabela(linhas, 'pl', 'ascending'))).toEqual([
      'CCCC3',
      'DDDD3',
      'AAAA3',
      'BBBB3',
    ]);
    expect(tickers(ordenarTabela(linhas, 'pl', 'descending'))).toEqual([
      'AAAA3',
      'DDDD3',
      'CCCC3',
      'BBBB3',
    ]);
  });

  it('nulos ficam por último nas duas direções', () => {
    const cresc = ordenarTabela(linhas, 'pl', 'ascending');
    const desc = ordenarTabela(linhas, 'pl', 'descending');
    expect(cresc.at(-1).ticker).toBe('BBBB3');
    expect(desc.at(-1).ticker).toBe('BBBB3');
  });

  it('valor zero conta como número, não como ausência', () => {
    const com0 = [{ ticker: 'A', dia: ok(-0.02) }, { ticker: 'B', dia: ok(0) }, { ticker: 'C', dia: semValor() }];
    expect(tickers(ordenarTabela(com0, 'dia', 'descending'))).toEqual(['B', 'A', 'C']);
  });

  it('sem coluna ou direção válida mantém a ordem recebida', () => {
    expect(tickers(ordenarTabela(linhas))).toEqual(tickers(linhas));
    expect(tickers(ordenarTabela(linhas, 'pl', 'none'))).toEqual(tickers(linhas));
    expect(tickers(ordenarTabela(linhas, 'coluna_inexistente', 'ascending'))).toEqual(tickers(linhas));
  });

  it('não altera a lista recebida', () => {
    const antes = tickers(linhas);
    ordenarTabela(linhas, 'pl', 'ascending');
    expect(tickers(linhas)).toEqual(antes);
  });

  it('ordena o ticker como texto, em pt-BR', () => {
    const texto = [{ ticker: 'VALE3' }, { ticker: 'PETR4' }, { ticker: 'ITUB4' }];
    expect(tickers(ordenarTabela(texto, 'ticker', 'ascending'))).toEqual(['ITUB4', 'PETR4', 'VALE3']);
    expect(tickers(ordenarTabela(texto, 'ticker', 'descending'))).toEqual(['VALE3', 'PETR4', 'ITUB4']);
  });
});

describe('linhasDaTabela', () => {
  const acoesPregao = [
    { ticker: 'PETR4', nome: 'Petrobras', setor_nome: 'Petróleo e gás', fechamento: 38.5, variacao_dia: 0.012 },
    { ticker: 'VALE3', nome: 'Vale', setor_nome: 'Materiais básicos', fechamento: null, variacao_dia: null },
  ];

  it('usa o resumo de resumo_acao para os múltiplos e as variações', () => {
    const resumos = [
      {
        ticker: 'PETR4',
        variacao_preco: { m1: ok(0.08), a1: ok(-0.1) },
        pl: ok(8.5),
        pvp: semValor('lucro_negativo', 'Prejuízo'),
        roe: ok(0.19),
        dividend_yield: ok(0.05),
        endividamento: { dl_ebitda: ok(-0.5) },
        volume: { relativo: ok(1.4) },
      },
    ];
    const [petr] = linhasDaTabela(acoesPregao, [], resumos);
    expect(petr.nome).toBe('Petrobras');
    expect(petr.setor).toBe('Petróleo e gás');
    expect(petr.preco).toEqual({ valor: 38.5, status: 'ok' });
    expect(petr.dia).toEqual({ valor: 0.012, status: 'ok' });
    expect(petr.m1.valor).toBe(0.08);
    expect(petr.a1.valor).toBe(-0.1);
    expect(petr.pl.valor).toBe(8.5);
    expect(petr.pvp.status).toBe('lucro_negativo');
    expect(petr.dl_ebitda.valor).toBe(-0.5);
    expect(petr.volume.valor).toBe(1.4);
  });

  it('sem resumo, cai no cartão de sugestoes e, sem nada, fica ausente (nunca 0)', () => {
    const sugestoes = [{ ticker: 'PETR4', resumo_acao: { pl: ok(6) } }];
    const [petr, vale] = linhasDaTabela(acoesPregao, sugestoes, []);
    expect(petr.pl.valor).toBe(6);
    expect(vale.pl.valor).toBeNull();
    expect(vale.preco.valor).toBeNull();
    expect(vale.dy.valor).toBeNull();
  });

  it('mantém a ordem recebida', () => {
    expect(tickers(linhasDaTabela(acoesPregao, [], []))).toEqual(['PETR4', 'VALE3']);
  });
});
