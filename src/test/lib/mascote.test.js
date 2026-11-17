import { describe, expect, it } from 'vitest';
import { ACOES, HUMORES, humorDaVariacao, humorDoResumo, humorDoTom } from '../../lib/mascote.js';

describe('humorDoResumo: humor do Cotinha pelos motivos da ação', () => {
  it('atenção vence, mesmo com motivo forte', () => {
    expect(humorDoResumo({ forte: 2, atencao: 1, contexto: 0 })).toBe('atento');
  });

  it('motivo forte sem atenção deixa contente', () => {
    expect(humorDoResumo({ forte: 1, atencao: 0, contexto: 3 })).toBe('contente');
  });

  it('zeros ou só contexto ficam neutros', () => {
    expect(humorDoResumo({ forte: 0, atencao: 0, contexto: 2 })).toBe('neutro');
  });

  it('sem contagem, ou com campos que não são números, fica neutro', () => {
    expect(humorDoResumo(null)).toBe('neutro');
    expect(humorDoResumo(undefined)).toBe('neutro');
    expect(humorDoResumo({})).toBe('neutro');
    expect(humorDoResumo({ forte: '2', atencao: 'x' })).toBe('neutro');
    expect(humorDoResumo({ forte: NaN, atencao: NaN })).toBe('neutro');
  });
});

describe('listas do Cotinha', () => {
  it('tem os nove humores, com o neutro como padrão', () => {
    expect(HUMORES).toEqual([
      'neutro',
      'contente',
      'atento',
      'pensativo',
      'dormindo',
      'animado',
      'preocupado',
      'surpreso',
      'curioso',
    ]);
  });

  it('tem as ações ocioso, acenando, vivo e moeda (vivo vale para o Top 5)', () => {
    expect(ACOES).toEqual(['ocioso', 'acenando', 'vivo', 'moeda']);
  });
});

describe('humorDaVariacao: humor pela variação do dia (fração)', () => {
  it('ausente (null, undefined, NaN) fica pensativo', () => {
    expect(humorDaVariacao(null)).toBe('pensativo');
    expect(humorDaVariacao(undefined)).toBe('pensativo');
    expect(humorDaVariacao(NaN)).toBe('pensativo');
    expect(humorDaVariacao('0.01')).toBe('pensativo');
  });

  it('a partir de 2% para cima ou para baixo fica surpreso', () => {
    expect(humorDaVariacao(0.02)).toBe('surpreso');
    expect(humorDaVariacao(0.0345)).toBe('surpreso');
    expect(humorDaVariacao(-0.02)).toBe('surpreso');
    expect(humorDaVariacao(-0.05)).toBe('surpreso');
  });

  it('acima de 0,2% (até 2%) fica contente; abaixo de −0,2% preocupado', () => {
    expect(humorDaVariacao(0.0123)).toBe('contente');
    expect(humorDaVariacao(0.0021)).toBe('contente');
    expect(humorDaVariacao(-0.0123)).toBe('preocupado');
    expect(humorDaVariacao(-0.0021)).toBe('preocupado');
  });

  it('dentro de ±0,2% (e no próprio 0,2%) fica neutro', () => {
    expect(humorDaVariacao(0)).toBe('neutro');
    expect(humorDaVariacao(0.002)).toBe('neutro');
    expect(humorDaVariacao(-0.002)).toBe('neutro');
    expect(humorDaVariacao(0.0015)).toBe('neutro');
  });
});

describe('humorDoTom: humor pelo tom das notícias', () => {
  it('mais positivas fica contente; mais negativas, preocupado', () => {
    expect(humorDoTom({ positivas: 5, neutras: 2, negativas: 1 })).toBe('contente');
    expect(humorDoTom({ positivas: 1, neutras: 2, negativas: 5 })).toBe('preocupado');
  });

  it('empate fica curioso', () => {
    expect(humorDoTom({ positivas: 3, neutras: 0, negativas: 3 })).toBe('curioso');
    expect(humorDoTom({ positivas: 0, neutras: 4, negativas: 0 })).toBe('curioso');
  });

  it('sem dados, ausentes ou soma zero fica pensativo', () => {
    expect(humorDoTom(null)).toBe('pensativo');
    expect(humorDoTom(undefined)).toBe('pensativo');
    expect(humorDoTom({})).toBe('pensativo');
    expect(humorDoTom({ positivas: 2, neutras: 1 })).toBe('pensativo');
    expect(humorDoTom({ positivas: NaN, neutras: 0, negativas: 0 })).toBe('pensativo');
    expect(humorDoTom({ positivas: 0, neutras: 0, negativas: 0 })).toBe('pensativo');
  });
});
