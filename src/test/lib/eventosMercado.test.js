import { describe, expect, it } from 'vitest';
import { ariaDosEventos, eventosNaJanela, itensMarcaEvento, marcasDosEventos } from '../../lib/eventosMercado.js';

const JANELA = ['2026-10-23', '2026-10-26', '2026-10-27'];

describe('eventosNaJanela', () => {
  it('devolve o evento com a posição da data na janela', () => {
    expect(eventosNaJanela(JANELA)).toEqual([{ indice: 1, data: '2026-10-26', chave: 'eleicao2026' }]);
  });

  it('fora da janela, não devolve nada', () => {
    expect(eventosNaJanela(['2026-10-01', '2026-10-02'])).toEqual([]);
  });

  it('sem datas, devolve lista vazia', () => {
    expect(eventosNaJanela([])).toEqual([]);
    expect(eventosNaJanela(undefined)).toEqual([]);
  });
});

describe('marcasDosEventos e ariaDosEventos', () => {
  it('convertem eventos em marcas só quando a data está na janela', () => {
    const eventos = [{ data: '2026-10-26', chave: 'eleicao2026' }];
    expect(marcasDosEventos(eventos, JANELA)).toEqual([{ indice: 1, marca: 'Eleição' }]);
    expect(marcasDosEventos(eventos, ['2026-10-01'])).toEqual([]);
    expect(ariaDosEventos(eventos, JANELA)).toMatch(/26\/10\/2026/);
    expect(ariaDosEventos(eventos, ['2026-10-01'])).toBe('');
  });
});

describe('itensMarcaEvento', () => {
  it('cada marca vira uma linha vertical discreta com o rótulo', () => {
    const [item] = itensMarcaEvento([{ indice: 4, marca: 'Eleição' }], '#999');
    expect(item.xAxis).toBe(4);
    expect(item.label).toMatchObject({ formatter: 'Eleição', position: 'end' });
    expect(item.lineStyle).toMatchObject({ type: 'dashed', width: 1 });
  });
});
