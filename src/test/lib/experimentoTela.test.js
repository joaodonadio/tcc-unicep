// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { resumoAcerto } from '../../lib/experimentoTela.js';
import { normalizarHistorico } from '../../services/experimento.js';

describe('resumoAcerto', () => {
  it('sem histórico ou sem dias, estado sem_dados', () => {
    expect(resumoAcerto(null)).toEqual({ estado: 'sem_dados' });
    expect(resumoAcerto(normalizarHistorico({ resumo: {}, dias: [] }))).toEqual({ estado: 'sem_dados' });
  });

  it('com dias, devolve taxa, acaso e se ficou acima do acaso', () => {
    const hist = normalizarHistorico({
      resumo: { n_dias: 4, taxa_acerto: 0.6, acaso_media: 0.5, acaso_faixa: [0.4, 0.6] },
      dias: [{ data: '2026-10-20' }, { data: '2026-10-21' }],
    });
    expect(resumoAcerto(hist)).toEqual({
      estado: 'dados',
      taxa: 0.6,
      acaso: 0.5,
      faixa: [0.4, 0.6],
      nDias: 4,
      acimaDoAcaso: true,
    });
  });

  it('acaso ausente vale 0,5', () => {
    const hist = normalizarHistorico({ resumo: { taxa_acerto: 0.3 }, dias: [{ data: '2026-10-20' }] });
    const r = resumoAcerto(hist);
    expect(r.acaso).toBe(0.5);
    expect(r.acimaDoAcaso).toBe(false);
  });

  it('taxa nula não vira zero: acimaDoAcaso é null', () => {
    const hist = normalizarHistorico({ resumo: { acaso_media: 0.5 }, dias: [{ data: '2026-10-20' }] });
    const r = resumoAcerto(hist);
    expect(r.taxa).toBeNull();
    expect(r.acimaDoAcaso).toBeNull();
  });
});
