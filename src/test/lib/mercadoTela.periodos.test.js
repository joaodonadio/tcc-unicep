import { describe, expect, it } from 'vitest';
import { formatoDataDaJanela } from '../../lib/mercadoTela.js';

describe('formatoDataDaJanela: rótulo do rodapé por janela', () => {
  it('semana e mês usam dia e mês; 6 meses e 1 ano usam mês e ano', () => {
    expect(formatoDataDaJanela('1s')('2026-10-22')).toBe('22/10/2026');
    expect(formatoDataDaJanela('1m')('2026-10-22')).toBe('22/10');
    expect(formatoDataDaJanela('6m')('2026-10-22')).toBe('out/2026');
    expect(formatoDataDaJanela('1a')('2025-10-16')).toBe('out/2025');
  });

  it('janela desconhecida cai na data completa, sem quebrar', () => {
    expect(formatoDataDaJanela('xx')('2026-10-22')).toBe('22/10/2026');
  });
});
