import { describe, expect, it } from 'vitest';
import { dataBR, dataExtenso, dataHoraBR, diaMes, diaSemanaCurto, hojeISO, horaBR, mesAno, mesExtenso, quandoPublicada, rotuloTrimestre } from '../../lib/datas.js';

describe('datas puras (AAAA-MM-DD) sem fuso', () => {
  it('dataBR', () => {
    expect(dataBR('2026-10-22')).toBe('22/10/2026');
  });

  it('diaMes', () => {
    expect(diaMes('2026-10-22')).toBe('22/10');
  });

  it('dataExtenso informa o dia da semana correto', () => {
    expect(dataExtenso('2026-10-22')).toContain('quinta-feira');
    expect(dataExtenso('2026-10-22')).toBe('quinta-feira, 22 de outubro de 2026');
  });

  it('mesExtenso com inicial maiúscula; mês inválido vira vazio', () => {
    expect(mesExtenso('2026-11')).toBe('Novembro de 2026');
    expect(mesExtenso('2027-01')).toBe('Janeiro de 2027');
    expect(mesExtenso('2026-13')).toBe('');
    expect(mesExtenso('')).toBe('');
  });

  it('mesAno', () => {
    expect(mesAno('2026-09')).toBe('set/2026');
  });
});

describe('instantes com horário, no fuso de São Paulo', () => {
  it('dataHoraBR', () => {
    expect(dataHoraBR('2026-10-24T23:25:33-03:00')).toBe('24/10/2026 às 23h25');
  });

  it('horaBR', () => {
    expect(horaBR('2026-10-24T23:25:33-03:00')).toBe('23h25');
  });

  it('dataHoraBR e horaBR devolvem vazio para ausência (nunca 1969)', () => {
    expect(dataHoraBR(null)).toBe('');
    expect(dataHoraBR(undefined)).toBe('');
    expect(dataHoraBR('')).toBe('');
    expect(horaBR(null)).toBe('');
  });

  it('quandoPublicada com horário, sem horário e sem nada', () => {
    expect(quandoPublicada({ publicado_em: '2026-10-22T17:19:00-03:00' })).toBe('22/10/2026 às 17h19');
    expect(quandoPublicada({ publicado_em: null, data_publicacao: '2026-10-22' })).toBe('22/10/2026, sem horário');
    expect(quandoPublicada({ publicado_em: null, data_publicacao: null })).toBe('sem horário');
  });

  it('hojeISO usa o dia civil de São Paulo', () => {
    expect(hojeISO(new Date('2026-10-27T02:00:00Z'))).toBe('2026-10-26');
  });
});

describe('texto de data único das telas', () => {
  it('diaSemanaCurto', () => {
    expect(diaSemanaCurto('2026-10-26')).toBe('segunda');
    expect(diaSemanaCurto('2026-10-25')).toBe('domingo');
    expect(diaSemanaCurto(null)).toBe('');
  });

  it('rotuloTrimestre', () => {
    expect(rotuloTrimestre('2026-06-30')).toBe('2T26');
    expect(rotuloTrimestre('2024-12-31')).toBe('4T24');
    expect(rotuloTrimestre('2025-03-31')).toBe('1T25');
    expect(rotuloTrimestre('')).toBe('');
  });
});
