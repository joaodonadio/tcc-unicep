import { describe, expect, it } from 'vitest';
import { normalizarHistorico, normalizarTop } from '../../services/experimento.js';
import fixture from '../fixtures/experimento_top.exemplo.json';

describe('normalizarTop', () => {
  it('devolve null quando não há resposta', () => {
    expect(normalizarTop(null)).toBeNull();
    expect(normalizarTop({})).toBeNull();
  });

  it('aceita ranking e top3 com a mesma lista', () => {
    const { top3, ...semTop3 } = fixture;
    const comRanking = { ...semTop3, ranking: top3 };
    expect(normalizarTop(comRanking).itens).toEqual(normalizarTop(fixture).itens);
  });

  it('aceita o envelope com registros[0]', () => {
    const envelope = { versao_contrato: '1.0', registros: [fixture] };
    expect(normalizarTop(envelope).itens).toEqual(normalizarTop(fixture).itens);
  });

  it('chance fica null quando exibir é false', () => {
    const [primeiro] = normalizarTop(fixture).itens;
    expect(primeiro.chance).toBeNull();
  });

  it('chance aparece com referencia 0.5 quando exibir é true', () => {
    const resp = {
      top3: [{ posicao: 1, ticker: 'PETR4', chance: { valor: 0.6, media: 0.5, exibir: true }, motivos: [] }],
    };
    expect(normalizarTop(resp).itens[0].chance).toEqual({ valor: 0.6, referencia: 0.5 });
  });

  it('efeito desconhecido vira neutro', () => {
    const resp = {
      top3: [{
        posicao: 1,
        ticker: 'PETR4',
        chance: { valor: null, exibir: false },
        motivos: [{ fator: 'x', valor: 1, efeito: 'desconhecido', texto: 'algo' }],
      }],
    };
    expect(normalizarTop(resp).itens[0].motivos[0].efeito).toBe('neutro');
  });

  it('normaliza o selo para "em avaliação"', () => {
    expect(normalizarTop({ ...fixture, selo: 'em_avaliacao' }).selo).toBe('em avaliação');
    expect(normalizarTop({ ...fixture, selo: 'em avaliação' }).selo).toBe('em avaliação');
  });

  it('ordena os itens pela posição', () => {
    const embaralhado = { top3: [...fixture.top3].reverse() };
    expect(normalizarTop(embaralhado).itens.map((i) => i.posicao)).toEqual([1, 2, 3]);
  });
});

describe('normalizarHistorico', () => {
  it('devolve null quando não há resposta', () => {
    expect(normalizarHistorico(null)).toBeNull();
  });

  it('monta o resumo e os dias', () => {
    const resp = {
      resumo: { n_dias: 10, taxa_acerto: 0.6, acaso_media: 0.5, acaso_faixa: [0.4, 0.6], nota: 'curto' },
      dias: [{ data_referencia: '2026-10-22' }],
    };
    expect(normalizarHistorico(resp)).toEqual({
      resumo: { nDias: 10, taxaAcerto: 0.6, acasoMedia: 0.5, acasoFaixa: [0.4, 0.6], nota: 'curto' },
      dias: [{ data_referencia: '2026-10-22' }],
    });
  });
});
