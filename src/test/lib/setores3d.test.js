import { describe, expect, it } from 'vitest';
import {
  CHAVES_SETOR,
  GLB_DISPONIVEIS,
  TAU,
  alvoDoGiro,
  anguloDaFrente,
  chaveDoSetor,
  colunasDosSetores,
  encaixe,
  indiceDaFrente,
  menorDelta,
  passoDoAnel,
  posicaoDoPedestal,
  proximoIndice,
  urlDoGlb,
} from '../../lib/setores3d.js';

const setor = (nome, media) => ({ setor: nome, media });

describe('colunasDosSetores', () => {
  it('sinal pela variação: alta, queda e estável; a ordem da lista é preservada', () => {
    const colunas = colunasDosSetores([setor('Financeiro', 0.02), setor('Saúde', -0.01), setor('Tecnologia', 0)]);
    expect(colunas.map((c) => c.setor)).toEqual(['Financeiro', 'Saúde', 'Tecnologia']);
    expect(colunas.map((c) => c.sinal)).toEqual(['alta', 'queda', 'estavel']);
    expect(colunas[0]).toMatchObject({ chave: 'financeiro', media: 0.02, vazio: false });
  });

  it('sem dado: média null, vazio true e sinal estável, sem NaN', () => {
    const [, sem] = colunasDosSetores([setor('Financeiro', 0.05), setor('Saúde', null)]);
    expect(sem).toMatchObject({ media: null, vazio: true, sinal: 'estavel' });
    const [nan] = colunasDosSetores([setor('Saúde', Number.NaN)]);
    expect(nan.media).toBeNull();
  });

  it('subiram e n: ausentes viram null, nunca 0', () => {
    const [com, sem] = colunasDosSetores([
      { setor: 'Financeiro', media: 0.02, subiram: 3, n: 4 },
      { setor: 'Saúde', media: null, subiram: undefined, n: 0 },
    ]);
    expect(com).toMatchObject({ media: 0.02, subiram: 3, n: 4 });
    expect(sem.subiram).toBeNull();
    expect(sem.n).toBe(0);
  });

  it('lista vazia, undefined e null devolvem lista vazia', () => {
    expect(colunasDosSetores([])).toEqual([]);
    expect(colunasDosSetores(undefined)).toEqual([]);
    expect(colunasDosSetores(null)).toEqual([]);
  });
});

describe('chaveDoSetor', () => {
  it('mapeia nomes brutos e curtos para a chave do objeto', () => {
    expect(chaveDoSetor('Consumo não cíclico')).toBe('consumo-nao-ciclico');
    expect(chaveDoSetor('Consumo cíclico')).toBe('consumo-ciclico');
    expect(chaveDoSetor('Petróleo e gás')).toBe('petroleo');
    expect(chaveDoSetor('Petróleo, Gás e Biocombustíveis')).toBe('petroleo');
    expect(chaveDoSetor('Tecnologia da Informação')).toBe('tecnologia');
    expect(chaveDoSetor('Utilidade Pública')).toBe('utilidade-publica');
    expect(chaveDoSetor('Bens Industriais')).toBe('bens-industriais');
    expect(chaveDoSetor('Materiais básicos')).toBe('materiais-basicos');
    expect(chaveDoSetor('Saúde')).toBe('saude');
    expect(chaveDoSetor('Comunicações')).toBe('comunicacoes');
    expect(chaveDoSetor('Financeiro')).toBe('financeiro');
  });

  it('desconhecido e nulo viram outros', () => {
    expect(chaveDoSetor('Outro')).toBe('outros');
    expect(chaveDoSetor(null)).toBe('outros');
  });
});

describe('urlDoGlb e GLB_DISPONIVEIS', () => {
  it('monta a url do .glb da chave', () => {
    expect(urlDoGlb('saude').endsWith('modelos/setores/saude.glb')).toBe(true);
  });

  it('lista as 11 chaves de setor, uma por chave com .glb', () => {
    expect(GLB_DISPONIVEIS).toEqual(CHAVES_SETOR);
    expect(GLB_DISPONIVEIS).toHaveLength(11);
  });
});

describe('anel dos pedestais', () => {
  it('o passo é o ângulo cheio dividido pelo número de setores', () => {
    expect(passoDoAnel(10)).toBeCloseTo(TAU / 10, 12);
    expect(passoDoAnel(0)).toBe(0);
  });

  it('o pedestal 0 fica na frente (z positivo, x zero)', () => {
    const { x, z } = posicaoDoPedestal(0, 10, 3.4);
    expect(x).toBeCloseTo(0, 12);
    expect(z).toBeCloseTo(3.4, 12);
  });

  it('o próximo pedestal fica à direita da frente (x positivo): a seta Próximo o traz da direita', () => {
    const { x, z } = posicaoDoPedestal(1, 10, 3.4);
    expect(x).toBeGreaterThan(0);
    expect(z).toBeGreaterThan(0);
  });

  it('todos os pedestais ficam à mesma distância do eixo', () => {
    for (let i = 0; i < 10; i++) {
      const { x, z } = posicaoDoPedestal(i, 10, 3.4);
      expect(Math.hypot(x, z)).toBeCloseTo(3.4, 9);
    }
  });
});

describe('ângulo da frente e índice da frente', () => {
  it('o índice k vai para a frente com a rotação k · passo, e volta ao mesmo índice', () => {
    for (let k = 0; k < 10; k++) {
      expect(indiceDaFrente(anguloDaFrente(k, 10), 10)).toBe(k);
    }
  });

  it('uma rotação um pouco fora arredonda para o pedestal mais próximo', () => {
    const passo = passoDoAnel(10);
    expect(indiceDaFrente(3 * passo + passo * 0.4, 10)).toBe(3);
    expect(indiceDaFrente(3 * passo - passo * 0.4, 10)).toBe(3);
    expect(indiceDaFrente(3 * passo + passo * 0.6, 10)).toBe(4);
  });

  it('rotação negativa ou acumulada dá índice dentro do intervalo', () => {
    expect(indiceDaFrente(-passoDoAnel(10), 10)).toBe(9);
    expect(indiceDaFrente(TAU * 3 + passoDoAnel(10) * 2, 10)).toBe(2);
    expect(indiceDaFrente(1, 0)).toBe(0);
  });
});

describe('menorDelta e alvoDoGiro (menor caminho)', () => {
  it('escolhe o sentido mais curto, entre -π e π', () => {
    expect(menorDelta(0, 0.5)).toBeCloseTo(0.5, 12);
    expect(menorDelta(0, -0.5)).toBeCloseTo(-0.5, 12);
    expect(menorDelta(0, (3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2, 12);
    expect(menorDelta(0.1, 0.1 + TAU)).toBeCloseTo(0, 12);
  });

  it('alvoDoGiro anda pelo menor caminho a partir da rotação atual, sem dar a volta grande', () => {
    // do pedestal 0 ao 9 (vizinho pela volta) o caminho curto é de um passo para trás
    const alvo = alvoDoGiro(0, 9, 10);
    expect(alvo).toBeCloseTo(-passoDoAnel(10), 12);
    expect(indiceDaFrente(alvo, 10)).toBe(9);
    // do 0 ao 5 o caminho é o mesmo nos dois sentidos: a meia volta
    expect(Math.abs(alvoDoGiro(0, 5, 10))).toBeCloseTo(Math.PI, 9);
  });

  it('alvoDoGiro mantém a continuidade: a rotação resultante fica perto da atual', () => {
    const atual = 7.9 * TAU;
    const alvo = alvoDoGiro(atual, 2, 10);
    expect(Math.abs(alvo - atual)).toBeLessThanOrEqual(Math.PI + 1e-9);
    expect(indiceDaFrente(alvo, 10)).toBe(2);
  });
});

describe('encaixe', () => {
  it('encaixa no pedestal mais próximo da frente, pelo menor caminho', () => {
    const passo = passoDoAnel(10);
    const encaixado = encaixe(2 * passo + 0.3 * passo, 10);
    expect(encaixado).toBeCloseTo(2 * passo, 9);
  });

  it('encaixar uma rotação já encaixada não muda nada', () => {
    const passo = passoDoAnel(10);
    expect(encaixe(4 * passo, 10)).toBeCloseTo(4 * passo, 9);
  });
});

describe('proximoIndice (anterior e próximo, com volta)', () => {
  it('avança e recua um setor', () => {
    expect(proximoIndice(2, 1, 10)).toBe(3);
    expect(proximoIndice(2, -1, 10)).toBe(1);
  });

  it('dá a volta: depois do último vem o primeiro, e antes do primeiro vem o último', () => {
    expect(proximoIndice(9, 1, 10)).toBe(0);
    expect(proximoIndice(0, -1, 10)).toBe(9);
  });

  it('sem setores ou com um só, fica no índice 0', () => {
    expect(proximoIndice(0, 1, 0)).toBe(0);
    expect(proximoIndice(0, -1, 1)).toBe(0);
  });
});
