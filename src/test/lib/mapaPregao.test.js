import { describe, expect, it } from 'vitest';
import { SEM_SETOR, agruparPorSetor, direcaoDe, intensidadeDe } from '../../lib/mapaPregao.js';

const acao = (ticker, setor_nome, variacao_dia) => ({ ticker, setor_nome, variacao_dia });

describe('direcaoDe', () => {
  it('trata variação abaixo do limite como estável', () => {
    expect(direcaoDe(0.0001)).toBe('flat');
    expect(direcaoDe(0.02)).toBe('up');
    expect(direcaoDe(-0.02)).toBe('down');
  });

  it('sem número não tem direção', () => {
    expect(direcaoDe(null)).toBe(null);
    expect(direcaoDe(Number.NaN)).toBe(null);
  });
});

describe('intensidadeDe', () => {
  it('é proporcional a |variação| até o teto, e não passa de 1', () => {
    expect(intensidadeDe(0.02)).toBe(0.5);
    expect(intensidadeDe(-0.08)).toBe(1);
    expect(intensidadeDe(0.01, 0.02)).toBe(0.5);
  });

  it('sem número a intensidade é 0', () => {
    expect(intensidadeDe(null)).toBe(0);
  });
});

describe('agruparPorSetor', () => {
  it('agrupa e ordena os setores pela variação média, do maior para o menor', () => {
    const grupos = agruparPorSetor([
      acao('AAA1', 'Setor A', 0.02),
      acao('AAA2', 'Setor A', 0.04),
      acao('BBB1', 'Setor B', -0.01),
      acao('CCC1', 'Setor C', 0.005),
    ]);

    expect(grupos.map((g) => g.setor)).toEqual(['Setor A', 'Setor C', 'Setor B']);
    expect(grupos[0].variacao_media).toBeCloseTo(0.03);
    expect(grupos[0].subiram).toBe(2);
    expect(grupos[0].cairam).toBe(0);
    expect(grupos[2].cairam).toBe(1);
  });

  it('usa os dados do setor no dia quando houver', () => {
    const grupos = agruparPorSetor(
      [acao('AAA1', 'Setor A', -0.02), acao('BBB1', 'Setor B', 0.01)],
      [{ setor: 'Setor A', variacao: 5, subiram: 3, caíram: 1 }],
    );

    expect(grupos[0].setor).toBe('Setor A');
    expect(grupos[0].variacao_media).toBeCloseTo(0.05);
    expect(grupos[0].subiram).toBe(3);
    expect(grupos[0].cairam).toBe(1);
  });

  it('usa a média dos membros quando o setor não está em setoresDoDia', () => {
    const grupos = agruparPorSetor(
      [acao('AAA1', 'Setor A', 0.02), acao('AAA2', 'Setor A', null)],
      [{ setor: 'Outro', variacao: 9, subiram: 1, caíram: 0 }],
    );

    expect(grupos[0].variacao_media).toBeCloseTo(0.02);
  });

  it('setor sem nenhuma variação fica com média null, e null vai por último', () => {
    const grupos = agruparPorSetor([
      acao('AAA1', 'Setor A', null),
      acao('BBB1', 'Setor B', -0.03),
    ]);

    expect(grupos.map((g) => g.setor)).toEqual(['Setor B', 'Setor A']);
    expect(grupos[1].variacao_media).toBe(null);
  });

  it('SEM_SETOR fica no fim, mesmo com a maior variação', () => {
    const grupos = agruparPorSetor([
      acao('ZZZ1', undefined, 0.09),
      acao('AAA1', 'Setor A', -0.01),
    ]);

    expect(grupos.map((g) => g.setor)).toEqual(['Setor A', SEM_SETOR]);
  });

  it('ordena as ações do grupo por variação, com null por último e ticker no empate', () => {
    const grupos = agruparPorSetor([
      acao('CCC1', 'Setor A', null),
      acao('BBB1', 'Setor A', 0.01),
      acao('DDD1', 'Setor A', 0.03),
      acao('AAA1', 'Setor A', 0.01),
    ]);

    expect(grupos[0].acoes.map((a) => a.ticker)).toEqual(['DDD1', 'AAA1', 'BBB1', 'CCC1']);
  });
});
