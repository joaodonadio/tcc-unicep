// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { resumoAcerto } from '../../lib/experimentoTela.js';
import { normalizarHistorico } from '../../services/experimento.js';

describe('resumoAcerto', () => {
  it('sem histórico ou sem dias, estado sem_dados', () => {
    expect(resumoAcerto(null)).toEqual({ estado: 'sem_dados' });
    expect(resumoAcerto(normalizarHistorico({ resumo: {}, dias: [] }))).toEqual({ estado: 'sem_dados' });
  });

  it('com dias, devolve taxa, acaso e a comparação com a faixa', () => {
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
      comparacao: 'dentro',
    });
  });

  it('1 pregão com taxa 0,6 e faixa [0, 0,8] fica dentro da faixa do acaso', () => {
    const hist = normalizarHistorico({
      resumo: { n_dias: 1, taxa_acerto: 0.6, acaso_media: 0.3874, acaso_faixa: [0, 0.8] },
      dias: [{ data: '2026-10-20' }],
    });
    expect(resumoAcerto(hist).comparacao).toBe('dentro');
  });

  it('acima e abaixo da faixa', () => {
    const faixa = [0.3, 0.5];
    const mk = (t) => normalizarHistorico({ resumo: { n_dias: 9, taxa_acerto: t, acaso_media: 0.4, acaso_faixa: faixa }, dias: [{ data: '2026-10-20' }] });
    expect(resumoAcerto(mk(0.6)).comparacao).toBe('acima');
    expect(resumoAcerto(mk(0.2)).comparacao).toBe('abaixo');
  });

  it('acaso ausente fica null, sem o 0,5 inventado, e comparacao fica null', () => {
    const hist = normalizarHistorico({ resumo: { taxa_acerto: 0.3 }, dias: [{ data: '2026-10-20' }] });
    const r = resumoAcerto(hist);
    expect(r.acaso).toBeNull();
    expect(r.comparacao).toBeNull();
  });

  it('n_dias zero (pacote sem pregões) é sem_dados, mesmo com dia nulo', () => {
    const hist = normalizarHistorico({
      registros: [{ dia: null, resumo: { n_dias: 0, taxa_acerto: { valor: null, status: 'indisponivel' } } }],
    });
    expect(resumoAcerto(hist)).toEqual({ estado: 'sem_dados' });
  });

  it('taxa nula não vira zero: comparacao é null', () => {
    const hist = normalizarHistorico({ resumo: { acaso_media: 0.5 }, dias: [{ data: '2026-10-20' }] });
    const r = resumoAcerto(hist);
    expect(r.taxa).toBeNull();
    expect(r.comparacao).toBeNull();
  });
});
