import { describe, expect, it } from 'vitest';
import {
  alturaVisivel,
  AMPLITUDE_MAXIMA,
  MEDIDAS_PENDULO,
  amplitudePendulo,
  blocosBalanca,
  compararComSetor,
  contarMoedasPl,
  contarMoedasProvento,
  dadosDoResumo,
  FRACAO_PERNA,
  fraseResposta,
  inclinacaoBalanca,
  medidasPernas,
  pilhaCortada,
  temDado,
} from '../../lib/modelos3d.js';

describe('moedas do P/L', () => {
  it('uma moeda por ano de lucro, entre 1 e 40', () => {
    expect(contarMoedasPl(7.9)).toBe(8);
    expect(contarMoedasPl(0.2)).toBe(1);
    expect(contarMoedasPl(120)).toBe(40);
    expect(pilhaCortada(120)).toBe(true);
    expect(pilhaCortada(12)).toBe(false);
  });
  it('sem número ou prejuízo, nenhuma moeda (nunca pilha zerada desenhada)', () => {
    expect(contarMoedasPl(null)).toBe(0);
    expect(contarMoedasPl(undefined)).toBe(0);
    expect(contarMoedasPl(NaN)).toBe(0);
    expect(contarMoedasPl(-3)).toBe(0);
  });
});

describe('moedas do cofrinho', () => {
  it('uma moeda por R$ 1 a cada R$ 100, até 20', () => {
    expect(contarMoedasProvento(0.085)).toBe(9);
    expect(contarMoedasProvento(0.5)).toBe(20);
    expect(contarMoedasProvento(null)).toBe(0);
    expect(contarMoedasProvento(0)).toBe(0);
  });
});

describe('balança', () => {
  it('inclina para o lado da dívida, com limite', () => {
    expect(inclinacaoBalanca(2)).toBeCloseTo(0.18);
    expect(inclinacaoBalanca(40)).toBeCloseTo(0.36);
    expect(inclinacaoBalanca(-40)).toBeCloseTo(-0.36);
    expect(inclinacaoBalanca(null)).toBe(0);
  });
  it('blocos: caixa líquido enche o prato do caixa; sem número nenhum', () => {
    expect(blocosBalanca(-1)).toEqual({ caixa: 9, divida: 0 });
    expect(blocosBalanca(2)).toEqual({ caixa: 1, divida: 3 });
    expect(blocosBalanca(0.1)).toEqual({ caixa: 1, divida: 1 });
    expect(blocosBalanca(100).divida).toBe(9);
    expect(blocosBalanca(null)).toEqual({ caixa: 0, divida: 0 });
  });
});

describe('pêndulo', () => {
  it('amplitude é beta vezes a da bolsa, entre 0,06 e a máxima', () => {
    expect(amplitudePendulo(1)).toBeCloseTo(0.32);
    expect(amplitudePendulo(0.01)).toBe(0.06);
    expect(amplitudePendulo(50)).toBe(AMPLITUDE_MAXIMA);
    expect(amplitudePendulo(null)).toBeNull();
  });

  it('o peso nunca passa da coluna, nem na soltura nem no maior beta', () => {
    const { haste, raio, eixo, coluna, meiaColuna, soltura } = MEDIDAS_PENDULO;
    const maior = Math.max(AMPLITUDE_MAXIMA, soltura);
    expect(eixo + haste * Math.sin(maior) + raio).toBeLessThanOrEqual(coluna - meiaColuna);
  });
});

describe('comparação com o setor', () => {
  it('menos, igual, mais e sem setor', () => {
    expect(compararComSetor(7.9, 11.4)).toBe('menos');
    expect(compararComSetor(11.5, 11.4)).toBe('igual');
    expect(compararComSetor(20, 11.4)).toBe('mais');
    expect(compararComSetor(5, null)).toBeNull();
  });
});

describe('frase-resposta', () => {
  it('moedas compara com o setor em linguagem simples', () => {
    const f = fraseResposta('moedas', { pl: 7.9, plSetor: 11.4 });
    expect(f.pergunta).toBe('Está cara?');
    expect(f.resposta).toBe('Mais barata que o setor: custa 7,9 anos de lucro; o setor custa 11,4.');
  });
  it('ausência não vira zero', () => {
    expect(fraseResposta('moedas', { pl: null }).resposta).toBe('Teve prejuízo, então não dá para medir.');
    expect(fraseResposta('balanca', {}).resposta).toMatch(/Sem número/);
    expect(fraseResposta('cofrinho', undefined).resposta).toMatch(/Sem número/);
    expect(fraseResposta('pendulo', { beta: null }).resposta).toMatch(/Sem número/);
  });
  it('balança com caixa líquido, cofrinho e pêndulo', () => {
    expect(fraseResposta('balanca', { dlEbitda: -0.5 }).resposta).toBe('Não. Tem mais caixa do que dívida.');
    expect(fraseResposta('balanca', { dlEbitda: 2, dlEbitdaSetor: 1 }).resposta).toMatch(/^Mais que o setor: 2,0 anos/);
    expect(fraseResposta('cofrinho', { dy: 0.085, dySetor: 0.06 }).resposta).toBe(
      'R$ 8,50 por ano a cada R$ 100; no setor, R$ 6,00.',
    );
    expect(fraseResposta('pendulo', { beta: 0.38 }).resposta).toBe('Menos que a bolsa: beta 0,38. A bolsa vale 1,00.');
  });
  it('sem setor, só o número da ação', () => {
    expect(fraseResposta('moedas', { pl: 5 }).resposta).toBe('Custa 5,0 anos de lucro.');
  });
});

describe('dados do resumo', () => {
  const R = {
    pl: { valor: 7.9, status: 'ok', setor: { valor: 11.4, status: 'ok' } },
    beta: { valor: 0.9, status: 'ok' },
    endividamento: { dl_ebitda: { valor: null, status: 'nao_se_aplica' }, setor_dl_ebitda: { valor: 1, status: 'ok' } },
    dividend_yield: { valor: 0.05, status: 'ok' },
  };
  it('lê os campos e deixa ausência como null', () => {
    expect(dadosDoResumo('moedas', R)).toEqual({ pl: 7.9, plSetor: 11.4 });
    expect(dadosDoResumo('balanca', R)).toEqual({ dlEbitda: null, dlEbitdaSetor: 1 });
    expect(dadosDoResumo('cofrinho', R)).toEqual({ dy: 0.05, dySetor: null });
    expect(dadosDoResumo('pendulo', R)).toEqual({ beta: 0.9 });
    expect(dadosDoResumo('pendulo', null)).toEqual({});
  });
  it('temDado só com número', () => {
    expect(temDado('balanca', { dlEbitda: null })).toBe(false);
    expect(temDado('balanca', { dlEbitda: 0 })).toBe(true);
    expect(temDado('moedas', { pl: -2 })).toBe(false);
  });
});

describe('alturaVisivel', () => {
  it('sem proximidade, mantém a altura do objeto ou a da largura, a que for maior', () => {
    expect(alturaVisivel({ altura: 10, largura: 4 }, 2)).toBe(10);
    expect(alturaVisivel({ altura: 10, largura: 4 }, 2)).toBe(alturaVisivel({ altura: 10, largura: 4, proximidade: 1 }, 2));
  });

  it('proximidade acima de 1 reduz a altura visível (objeto aparece maior)', () => {
    expect(alturaVisivel({ altura: 10, largura: 4, proximidade: 1.12 }, 2)).toBeCloseTo(10 / 1.12);
  });

  it('quadro estreito: a largura domina a altura visível', () => {
    expect(alturaVisivel({ altura: 10, largura: 30 }, 0.5)).toBe(60);
  });

  it('quadro estreito: a proximidade não corta as laterais do objeto', () => {
    expect(alturaVisivel({ altura: 10, largura: 30, proximidade: 1.12 }, 0.5)).toBe(60);
  });

  it('proximidade ausente ou zero conta como 1', () => {
    expect(alturaVisivel({ altura: 10, largura: 4, proximidade: 0 }, 2)).toBe(10);
  });
});

describe('pernas do porquinho', () => {
  const caixa = { min: { x: -1, y: 0, z: -2 }, max: { x: 1, y: 2, z: 2 } };

  it('dá quatro pernas, uma em cada canto, com a base abaixo do corpo', () => {
    const { raio, miolo, centros } = medidasPernas(caixa);
    expect(centros).toHaveLength(4);
    expect(new Set(centros.map(([x, , z]) => `${Math.sign(x)}/${Math.sign(z)}`)).size).toBe(4);
    expect(centros[0][1] - miolo / 2 - raio).toBeCloseTo(-2 * FRACAO_PERNA);
  });

  it('a perna entra no corpo, sem deixar fresta', () => {
    const { raio, miolo, centros } = medidasPernas(caixa);
    expect(centros[0][1] + miolo / 2 + raio).toBeGreaterThan(caixa.min.y);
    expect(miolo).toBeGreaterThan(0);
  });
});
