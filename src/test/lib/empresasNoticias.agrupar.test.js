import { describe, expect, it } from 'vitest';
import { agruparEmpresasPorNumeros } from '../../lib/empresasNoticias.js';

const registro = (ticker, quantidade, positivas, neutras, negativas) => ({
  ticker,
  quantidade,
  positivas,
  neutras,
  negativas,
});

describe('agruparEmpresasPorNumeros', () => {
  it('junta tickers da mesma empresa com os mesmos números num cartão só', () => {
    const empresas = [
      registro('PETR4', 129, 30, 43, 56),
      registro('PETR3', 129, 30, 43, 56),
      registro('VALE3', 50, 10, 20, 20),
    ];
    const nomes = new Map([
      ['PETR4', 'Petrobras'],
      ['PETR3', 'Petrobras'],
      ['VALE3', 'Vale'],
    ]);

    const grupos = agruparEmpresasPorNumeros(empresas, nomes);

    expect(grupos).toHaveLength(2);
    expect(grupos[0]).toMatchObject({ tickers: ['PETR4', 'PETR3'], nome: 'Petrobras', quantidade: 129 });
    expect(grupos[1]).toMatchObject({ tickers: ['VALE3'], nome: 'Vale' });
  });

  it('mesmos números em empresas diferentes não se juntam', () => {
    const empresas = [registro('ITUB4', 9, 3, 3, 3), registro('BBDC4', 9, 3, 3, 3)];
    const nomes = new Map([
      ['ITUB4', 'Itaú'],
      ['BBDC4', 'Bradesco'],
    ]);

    expect(agruparEmpresasPorNumeros(empresas, nomes)).toHaveLength(2);
  });

  it('sem nome conhecido, cada ticker fica sozinho', () => {
    const empresas = [registro('PETR4', 5, 1, 2, 2), registro('PETR3', 5, 1, 2, 2)];

    const grupos = agruparEmpresasPorNumeros(empresas);

    expect(grupos.map((g) => g.tickers)).toEqual([['PETR4'], ['PETR3']]);
    expect(grupos[0].nome).toBeNull();
  });

  it('números diferentes da mesma empresa não se juntam; ausência continua null', () => {
    const empresas = [registro('PETR4', 5, 1, 2, 2), registro('PETR3', 5, null, 2, 2)];
    const nomes = new Map([
      ['PETR4', 'Petrobras'],
      ['PETR3', 'Petrobras'],
    ]);

    const grupos = agruparEmpresasPorNumeros(empresas, nomes);

    expect(grupos).toHaveLength(2);
    expect(grupos[1].positivas).toBeNull();
  });

  it('lista vazia ou ausente devolve lista vazia', () => {
    expect(agruparEmpresasPorNumeros(undefined)).toEqual([]);
    expect(agruparEmpresasPorNumeros([])).toEqual([]);
  });
});
