import { describe, expect, it } from 'vitest';
import {
  dadosDosModelos,
  fechamentoSeisMeses,
  motivoPrincipal,
  motivosDoItem,
  numerosChave,
  resumoDosMotivos,
  tituloDoSinal,
  top5ParaEstudar,
} from '../../lib/top5Estudo.js';
import { REGRAS } from '../../lib/sugestoes.js';
import { TEXTOS } from '../../lib/textos.js';

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

  it('separa os sinais de contexto', () => {
    const c = cartao('A', 1, 0, null, {
      sinais: [
        { id: 'f0', tipo: 'forte', titulo: 'F', simples: 'f' },
        { id: 'c0', tipo: 'contexto', titulo: 'C', simples: 'c' },
      ],
    });
    const { itens } = top5ParaEstudar({ sugestoes: [c] });
    expect(itens[0].contexto).toEqual([{ id: 'c0', titulo: 'C', simples: 'c', tecnico: null }]);
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

  it('modelo sem chance exibível usa a ordem do modelo, não as regras', () => {
    const experimento = {
      itens: [
        { posicao: 1, ticker: 'Z', chance: null, motivos: [] },
        { posicao: 2, ticker: 'A', chance: null, motivos: [] },
      ],
    };
    const { origem, itens } = top5ParaEstudar({ experimento, sugestoes: [cartao('A', 3, 0), cartao('B', 1, 0)] });
    expect(origem).toBe('modelo');
    expect(itens.map((i) => i.ticker)).toEqual(['Z', 'A']);
    expect(itens.every((i) => i.chance === null)).toBe(true);
  });

  it('motivos do modelo viram favor, atenção e contexto, com a contagem certa', () => {
    const experimento = {
      itens: [
        {
          posicao: 1,
          ticker: 'B',
          chance: null,
          motivos: [
            { fator: 'tom_noticias', texto: 'Notícias positivas', efeito: 'ajudou' },
            { fator: 'volume', texto: 'Volume alto', efeito: 'ajudou' },
            { fator: 'dolar', texto: 'Dólar subiu', efeito: 'atrapalhou' },
            { fator: 'beta', texto: 'Beta perto de 1', efeito: 'neutro' },
          ],
        },
      ],
    };
    const { itens } = top5ParaEstudar({ experimento, sugestoes: [cartao('B', 9, 9)] });
    const [item] = itens;
    expect(item.favor.map((s) => s.id)).toEqual(['modelo:tom_noticias', 'modelo:volume']);
    expect(item.atencao.map((s) => s.id)).toEqual(['modelo:dolar']);
    expect(item.contexto.map((s) => s.id)).toEqual(['modelo:beta']);
    expect(item.favor[0]).toEqual({
      id: 'modelo:tom_noticias',
      titulo: 'Notícias positivas',
      simples: TEXTOS.top5Hoje.motivoModelo.ajudou.simples,
      tecnico: TEXTOS.top5Hoje.motivoModelo.ajudou.tecnico,
    });
    expect(item.contagem).toEqual({ forte: 2, atencao: 1, contexto: 1 });
    // o preço e o resumo continuam vindo do cartão de sugestões
    expect(item.empresa).toBe('Empresa B');
    expect(item.preco).toBe(10);
  });

  it('o selo e os avisos do modelo passam para o resultado; sem modelo, vêm vazios', () => {
    const experimento = {
      selo: 'em avaliação',
      avisos: ['Dados de hoje parciais'],
      itens: [{ posicao: 1, ticker: 'B', chance: null, motivos: [] }],
    };
    const r = top5ParaEstudar({ experimento, sugestoes: [cartao('B', 1, 0)] });
    expect(r.selo).toBe('em avaliação');
    expect(r.avisos).toEqual(['Dados de hoje parciais']);

    const semModelo = top5ParaEstudar({ sugestoes: [cartao('A', 1, 0)] });
    expect(semModelo.selo).toBeNull();
    expect(semModelo.avisos).toEqual([]);
  });

  it('sem nada devolve lista vazia', () => {
    expect(top5ParaEstudar({})).toEqual({ origem: 'regras', selo: null, avisos: [], itens: [] });
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

describe('fechamentoSeisMeses', () => {
  it('corta os últimos 127 pregões e devolve as pontas', () => {
    const fechamento = Array.from({ length: 130 }, (_, i) => 100 + i);
    const r = fechamentoSeisMeses({ datas: fechamento.map(String), valores: { fechamento } });
    expect(r.valores).toHaveLength(127);
    expect(r.primeiro).toBe(103);
    expect(r.ultimo).toBe(229);
  });

  it('pula vazios nas pontas e pede ao menos 2 valores', () => {
    expect(fechamentoSeisMeses({ datas: ['a', 'b', 'c'], valores: { fechamento: [null, 10, 12] } })).toEqual({
      valores: [null, 10, 12],
      primeiro: 10,
      ultimo: 12,
    });
    expect(fechamentoSeisMeses({ datas: ['a', 'b'], valores: { fechamento: [null, 10] } })).toBeNull();
    expect(fechamentoSeisMeses({ datas: [], valores: {} })).toBeNull();
    expect(fechamentoSeisMeses(null)).toBeNull();
  });
});

describe('motivos do item', () => {
  const item = {
    favor: [{ id: 'f0', titulo: 'F0', simples: 'f' }],
    atencao: [{ id: 'a0', titulo: 'A0', simples: 'a' }],
    contexto: [{ id: 'c0', titulo: 'C0', simples: 'c' }],
  };

  it('ordem a favor, atenção e contexto, cada um com o tom', () => {
    expect(motivosDoItem(item).map((s) => `${s.tom}:${s.id}`)).toEqual(['forte:f0', 'atencao:a0', 'contexto:c0']);
    expect(motivosDoItem({})).toEqual([]);
  });

  it('motivo principal: 1º a favor, senão 1º de atenção, senão null', () => {
    expect(motivoPrincipal(item)).toMatchObject({ id: 'f0', tom: 'forte' });
    expect(motivoPrincipal({ ...item, favor: [] })).toMatchObject({ id: 'a0', tom: 'atencao' });
    expect(motivoPrincipal({ favor: [], atencao: [], contexto: item.contexto })).toBeNull();
  });
});

describe('tituloDoSinal', () => {
  it('simples do mapa, técnico no nível técnico e, sem mapa, o título do sinal', () => {
    const s = { id: 'dy_alto', titulo: 'Dividend yield alto para o setor' };
    expect(tituloDoSinal(s, 'simples')).toBe(TEXTOS.top5Hoje.tituloSinal.dy_alto.simples);
    expect(tituloDoSinal(s, 'tecnico')).toBe('Dividend yield alto para o setor');
    expect(tituloDoSinal({ id: 'regra_nova', titulo: 'Título do sinal' }, 'simples')).toBe('Título do sinal');
  });

  it('toda regra tem título simples, diferente do técnico', () => {
    for (const regra of REGRAS) {
      const t = TEXTOS.top5Hoje.tituloSinal[regra.id];
      expect(t, regra.id).toBeDefined();
      expect(t.simples, regra.id).not.toBe(t.tecnico);
    }
  });
});

describe('resumoDosMotivos', () => {
  it('conta em palavras, com singular, plural e "nenhum"', () => {
    expect(resumoDosMotivos({ forte: 2, atencao: 0, contexto: 0 })).toBe('2 pontos a favor e nenhum ponto de atenção.');
    expect(resumoDosMotivos({ forte: 1, atencao: 1, contexto: 1 })).toBe(
      '1 ponto a favor, 1 ponto de atenção e 1 informação para saber.',
    );
    expect(resumoDosMotivos({ forte: 0, atencao: 3, contexto: 2 })).toBe(
      'Nenhum ponto a favor, 3 pontos de atenção e 2 informações para saber.',
    );
  });

  it('sem contagem de favor e atenção, null', () => {
    expect(resumoDosMotivos(null)).toBeNull();
    expect(resumoDosMotivos({ forte: 1 })).toBeNull();
  });
});
