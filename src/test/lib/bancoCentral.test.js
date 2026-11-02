import { describe, expect, it } from 'vitest';
import {
  caminhoSerie,
  caminhoUltimoAno,
  dataIso,
  diaMesIso,
  lerDolarPtax,
  lerNumero,
  lerSelic,
} from '../../lib/bancoCentral.js';

describe('caminhoSerie', () => {
  it('monta o caminho pelo proxy /bcb com o formato JSON', () => {
    expect(caminhoSerie(432, 1)).toBe('/bcb/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
    expect(caminhoSerie(1, 2)).toBe('/bcb/dados/serie/bcdata.sgs.1/dados/ultimos/2?formato=json');
  });
});

describe('lerNumero', () => {
  it('lê texto com ponto decimal', () => {
    expect(lerNumero('15.00')).toBe(15);
    expect(lerNumero('5.0333')).toBe(5.0333);
  });

  it('aceita número já pronto', () => {
    expect(lerNumero(14.25)).toBe(14.25);
  });

  it('ausente, vazio, zero ou inválido vira null, nunca 0', () => {
    expect(lerNumero(undefined)).toBeNull();
    expect(lerNumero(null)).toBeNull();
    expect(lerNumero('')).toBeNull();
    expect(lerNumero('   ')).toBeNull();
    expect(lerNumero('abc')).toBeNull();
    expect(lerNumero('0')).toBeNull();
    expect(lerNumero(0)).toBeNull();
    expect(lerNumero(NaN)).toBeNull();
    expect(lerNumero(Infinity)).toBeNull();
  });
});

describe('datas da SGS', () => {
  it('converte dd/mm/aaaa em ISO e rejeita outros formatos', () => {
    expect(dataIso('28/10/2026')).toBe('2026-10-28');
    expect(dataIso('2026-10-28')).toBeNull();
    expect(dataIso('')).toBeNull();
    expect(dataIso(undefined)).toBeNull();
  });

  it('gera dd/mm a partir de ISO', () => {
    expect(diaMesIso('2026-10-27')).toBe('27/10');
    expect(diaMesIso(null)).toBeNull();
    expect(diaMesIso('27/10/2026')).toBeNull();
  });
});

describe('lerSelic', () => {
  it('converte a meta em % ao ano para fração', () => {
    expect(lerSelic([{ data: '27/10/2026', valor: '15.00' }])).toEqual({ valor: 0.15, data: '2026-10-27' });
  });

  it('usa o último registro da lista', () => {
    const lista = [
      { data: '26/10/2026', valor: '14.75' },
      { data: '27/10/2026', valor: '15.00' },
    ];
    expect(lerSelic(lista).valor).toBe(0.15);
  });

  it('lista vazia, valor inválido ou data inválida vira null', () => {
    expect(lerSelic([])).toBeNull();
    expect(lerSelic(undefined)).toBeNull();
    expect(lerSelic([{ data: '27/10/2026', valor: '' }])).toBeNull();
    expect(lerSelic([{ data: '27/10/2026', valor: 'x' }])).toBeNull();
    expect(lerSelic([{ data: 'ontem', valor: '15.00' }])).toBeNull();
  });
});

describe('lerDolarPtax', () => {
  const dois = [
    { data: '27/10/2026', valor: '5.0000' },
    { data: '28/10/2026', valor: '5.1000' },
  ];

  it('valor é o do último registro, data ISO e variação sobre o penúltimo', () => {
    const r = lerDolarPtax(dois);
    expect(r.valor).toBe(5.1);
    expect(r.data).toBe('2026-10-28');
    expect(r.variacao).toBeCloseTo(0.02, 10);
  });

  it('variação negativa sai com sinal', () => {
    const r = lerDolarPtax([
      { data: '27/10/2026', valor: '5.1000' },
      { data: '28/10/2026', valor: '5.0000' },
    ]);
    expect(r.variacao).toBeCloseTo(-0.0196078, 6);
  });

  it('sem penúltimo válido a variação fica null e o valor continua', () => {
    expect(lerDolarPtax([{ data: '28/10/2026', valor: '5.1000' }])).toEqual({
      valor: 5.1,
      data: '2026-10-28',
      variacao: null,
    });
    const r = lerDolarPtax([
      { data: '27/10/2026', valor: '' },
      { data: '28/10/2026', valor: '5.1000' },
    ]);
    expect(r.valor).toBe(5.1);
    expect(r.variacao).toBeNull();
  });

  it('valor do último inválido vira null inteiro, nunca 0', () => {
    expect(lerDolarPtax([{ data: '27/10/2026', valor: '5.0' }, { data: '28/10/2026', valor: '' }])).toBeNull();
    expect(lerDolarPtax([])).toBeNull();
    expect(lerDolarPtax(null)).toBeNull();
  });
});

describe('caminhoUltimoAno', () => {
  it('pede um ano de dados por intervalo de datas, porque séries diárias recusam /ultimos/N acima de 20', () => {
    expect(caminhoUltimoAno(1, new Date(2026, 9, 29))).toBe(
      '/bcb/dados/serie/bcdata.sgs.1/dados?formato=json&dataInicial=29/10/2025&dataFinal=29/10/2026',
    );
  });
});
