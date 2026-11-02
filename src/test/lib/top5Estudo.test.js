import { describe, expect, it } from 'vitest';
import { dadosDosModelos, numerosChave, top5ParaEstudar } from '../../lib/top5Estudo.js';

const cartao = (ticker, forte, atencao, volume = null, extra = {}) => ({
  ticker,
  nome: `Empresa ${ticker}`,
  setor_nome: 'Setor',
  titulo: `${forte} a favor`,
  contagem: { forte, atencao, contexto: 0 },
  variacao_dia: 0.01,
  sinais: [
    ...Array.from({ length: forte }, (_, i) => ({ id: `f${i}`, tipo: 'forte', titulo: `Forte ${i}`, simples: 'ok' })),
    ...Array.from({ length: atencao }, (_, i) => ({ id: `a${i}`, tipo: 'atencao', titulo: `Atenção ${i}`, simples: 'cuidado' })),
  ],
  resumo_acao: {
    cotacao: { fechamento: { valor: 10, status: 'ok' } },
    volume: { relativo: volume == null ? { valor: null, status: 'indisponivel' } : { valor: volume, status: 'ok' } },
  },
  ...extra,
});

describe('top5ParaEstudar', () => {
  it('pelas regras: mais a favor primeiro, limitado a 5, posições 1 a 5', () => {
    const sugestoes = [cartao('A', 1, 0), cartao('B', 3, 0), cartao('C', 2, 0), cartao('D', 4, 0), cartao('E', 0, 0), cartao('F', 5, 0)];
    const { origem, itens } = top5ParaEstudar({ sugestoes });
    expect(origem).toBe('regras');
    expect(itens.map((i) => i.ticker)).toEqual(['F', 'D', 'B', 'C', 'A']);
    expect(itens.map((i) => i.posicao)).toEqual([1, 2, 3, 4, 5]);
  });

  it('desempata por menos atenção e depois por maior volume relativo; ausente por último', () => {
    const sugestoes = [cartao('A', 2, 1, 5), cartao('B', 2, 0, 1), cartao('C', 2, 0, 3), cartao('D', 2, 0, null)];
    const { itens } = top5ParaEstudar({ sugestoes });
    expect(itens.map((i) => i.ticker)).toEqual(['C', 'B', 'D', 'A']);
  });

  it('separa favor e atenção e deixa nulo o que falta, nunca zero', () => {
    const { itens } = top5ParaEstudar({ sugestoes: [cartao('A', 1, 1, null, { variacao_dia: null, resumo_acao: {} })] });
    expect(itens[0].favor).toHaveLength(1);
    expect(itens[0].atencao).toHaveLength(1);
    expect(itens[0].preco).toBeNull();
    expect(itens[0].variacao).toBeNull();
    expect(itens[0].chance).toBeNull();
  });

  it('usa o modelo quando ele traz chance, com os dados das regras', () => {
    const experimento = {
      itens: [
        { posicao: 1, ticker: 'B', chance: { valor: 0.56, referencia: 0.5 }, motivos: [] },
        { posicao: 2, ticker: 'Z', chance: { valor: 0.54, referencia: 0.5 }, motivos: [] },
      ],
    };
    const { origem, itens } = top5ParaEstudar({ experimento, sugestoes: [cartao('A', 3, 0), cartao('B', 1, 0)] });
    expect(origem).toBe('modelo');
    expect(itens.map((i) => i.ticker)).toEqual(['B', 'Z']);
    expect(itens[0].chance).toEqual({ valor: 0.56, referencia: 0.5 });
    expect(itens[0].empresa).toBe('Empresa B');
    expect(itens[1].empresa).toBeNull();
  });

  it('modelo sem chance exibível cai para as regras', () => {
    const experimento = { itens: [{ posicao: 1, ticker: 'B', chance: null, motivos: [] }] };
    expect(top5ParaEstudar({ experimento, sugestoes: [cartao('A', 1, 0)] }).origem).toBe('regras');
  });

  it('sem nada devolve lista vazia', () => {
    expect(top5ParaEstudar({})).toEqual({ origem: 'regras', itens: [] });
    expect(top5ParaEstudar({ experimento: null, sugestoes: null }).itens).toEqual([]);
  });
});

describe('numerosChave e dadosDosModelos', () => {
  const R = {
    pl: { valor: 8.5, status: 'ok', setor: { valor: 9, status: 'ok' } },
    dividend_yield: { valor: 0.05, status: 'ok', setor: { valor: 0.02, status: 'ok' } },
    variacao_preco: { m6: { valor: 0.1, status: 'ok' } },
    beta: { valor: 0.6, status: 'ok' },
    endividamento: { dl_ebitda: { valor: 1.2, status: 'ok' }, setor_dl_ebitda: { valor: 2, status: 'ok' } },
  };

  it('lê os números do resumo', () => {
    expect(numerosChave(R)).toEqual({ pl: 8.5, dy: 0.05, alta6m: 0.1 });
    expect(dadosDosModelos(R)).toEqual({
      balanca: { dlEbitda: 1.2, dlEbitdaSetor: 2 },
      moedas: { pl: 8.5, plSetor: 9 },
      cofrinho: { dy: 0.05, dySetor: 0.02 },
      pendulo: { beta: 0.6 },
    });
  });

  it('ausência vira null', () => {
    expect(numerosChave(null)).toEqual({ pl: null, dy: null, alta6m: null });
    expect(dadosDosModelos({ pl: { valor: null, status: 'indisponivel' } }).moedas).toEqual({ pl: null, plSetor: null });
  });
});
