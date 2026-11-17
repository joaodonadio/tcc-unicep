import { describe, expect, it } from 'vitest';
import { resumoProventos } from '../../lib/proventosTela.js';

const HOJE = '2026-11-02';
const ev = (ticker, data_pagamento, valor_texto = 'R$ 0,30') => ({ ticker, data_pagamento, valor_texto, tipo: 'DIVIDENDO' });

describe('resumoProventos', () => {
  it('o próximo pagamento é o primeiro com data igual ou depois de hoje, com dias corridos', () => {
    const futuros = [ev('VALE3', '2026-12-01'), ev('PETR4', '2026-11-05', 'R$ 0,50'), ev('ITSA4', '2026-11-05', 'R$ 0,40')];
    const { proximo } = resumoProventos(futuros, [], HOJE, []);
    expect(proximo).toEqual({ ticker: 'ITSA4', valor: 'R$ 0,40', data: '2026-11-05', dias: 3 });
  });

  it('valor ausente vira null e nunca 0 ou texto inventado', () => {
    const { proximo } = resumoProventos([ev('ITSA4', '2026-11-05', '')], [], HOJE, []);
    expect(proximo.valor).toBeNull();
  });

  it('data a definir e datas passadas não contam como próximo pagamento', () => {
    const futuros = [ev('AAAA3', '9999-12-31'), ev('BBBB3', '2026-10-30'), ev('CCCC3', '2026-11-20')];
    const { proximo } = resumoProventos(futuros, [], HOJE, []);
    expect(proximo.ticker).toBe('CCCC3');
  });

  it('sem nenhum pagamento futuro o próximo é null, mas o total continua sendo 0 (dado real)', () => {
    const { proximo, marcados, mesPico } = resumoProventos([], [], HOJE, []);
    expect(proximo).toBeNull();
    expect(marcados).toEqual({ total: 0, aDefinir: 0 });
    expect(mesPico).toBeNull();
  });

  it('conta os marcados e os a definir, sem inventar número quando a lista não chegou', () => {
    const futuros = [ev('A', '2026-11-05'), ev('B', '2026-12-05')];
    expect(resumoProventos(futuros, [{ ticker: 'C' }], HOJE, []).marcados).toEqual({ total: 2, aDefinir: 1 });
    expect(resumoProventos(futuros, undefined, HOJE, []).marcados).toEqual({ total: 2, aDefinir: null });
    expect(resumoProventos(undefined, undefined, HOJE, []).marcados).toBeNull();
  });

  it('o mês de pico é o de mais pagamentos; empate vale o mais cedo', () => {
    const futuros = [ev('A', '2026-12-03'), ev('B', '2026-12-10'), ev('C', '2026-11-20'), ev('D', '2026-11-25')];
    expect(resumoProventos(futuros, [], HOJE, []).mesPico).toEqual({ mes: '2026-11', qtd: 2 });
    const pico = resumoProventos([ev('A', '2026-12-03'), ev('B', '2026-12-10'), ev('C', '2026-12-11')], [], HOJE, []);
    expect(pico.mesPico).toEqual({ mes: '2026-12', qtd: 3 });
  });

  it('o topo é o primeiro do ranking; sem ranking o bloco fica null', () => {
    const ranking = [{ posicao: 1, ticker: 'CCCC3', dy: 0.12 }, { posicao: 2, ticker: 'DDDD3', dy: 0.08 }];
    expect(resumoProventos([], [], HOJE, ranking).topo).toEqual({ ticker: 'CCCC3', dy: 0.12 });
    expect(resumoProventos([], [], HOJE, []).topo).toBeNull();
    expect(resumoProventos([], [], HOJE, undefined).topo).toBeNull();
  });

  it('com data de hoje inválida não há próximo nem pico, mas o total segue', () => {
    const r = resumoProventos([ev('A', '2026-12-03')], [], '', []);
    expect(r.proximo).toBeNull();
    expect(r.mesPico).toBeNull();
    expect(r.marcados.total).toBe(1);
  });
});
