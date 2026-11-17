import { describe, expect, it } from 'vitest';
import { mesesDoPacote } from '../../lib/series.js';

const mes = (mes_ref, variacao) => ({ mes_ref, variacao });
const ok = (valor) => ({ valor, status: 'ok' });

describe('mesesDoPacote', () => {
  it('ordena do mais antigo ao mais recente', () => {
    const r = mesesDoPacote([mes('2026-03', ok(0.004)), mes('2026-01', ok(0.001)), mes('2026-02', ok(0.002))]);
    expect(r).toEqual({ meses: ['2026-01', '2026-02', '2026-03'], valores: [0.001, 0.002, 0.004] });
  });

  it('corta nos 12 meses mais recentes', () => {
    const lista = Array.from({ length: 15 }, (_, i) => {
      const ano = 2025 + Math.floor(i / 12);
      return mes(`${ano}-${String((i % 12) + 1).padStart(2, '0')}`, ok(i));
    });
    const r = mesesDoPacote(lista.reverse());
    expect(r.meses).toHaveLength(12);
    expect(r.meses[0]).toBe('2025-04');
    expect(r.meses.at(-1)).toBe('2026-03');
  });

  it('variação sem status ok vira null, nunca 0', () => {
    const r = mesesDoPacote([mes('2026-01', ok(0.01)), mes('2026-02', { valor: 0, status: 'indisponivel' })]);
    expect(r).toEqual({ meses: ['2026-01', '2026-02'], valores: [0.01, null] });
  });

  it('mes_ref fora do formato AAAA-MM sai da lista', () => {
    const r = mesesDoPacote([mes('2026-01', ok(0.01)), mes('jan/2026', ok(0.5)), mes('2026-1', ok(0.6)), { variacao: ok(0.7) }]);
    expect(r).toEqual({ meses: ['2026-01'], valores: [0.01] });
  });

  it('campo ausente, lista vazia ou sem nenhum valor ok devolve null', () => {
    expect(mesesDoPacote(undefined)).toBeNull();
    expect(mesesDoPacote(null)).toBeNull();
    expect(mesesDoPacote([])).toBeNull();
    expect(mesesDoPacote([mes('2026-01', { valor: null, status: 'indisponivel' }), mes('2026-02', { valor: 0.1, status: 'calibracao_nao_conferida' })])).toBeNull();
  });
});
