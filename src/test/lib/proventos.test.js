// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { juntarPayout, listaPagamentos, proventosPorAno } from '../../lib/proventos.js';
import { brl } from '../../lib/formato.js';

/**
 * Proventos da ficha: confere a soma por ano com o resumo publicado
 * (proventos_por_ano) usando os dados reais de public/dados.
 */

const lerRegistros = (arquivo) => {
  const bruto = JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'dados', arquivo), 'utf8'));
  return Array.isArray(bruto) ? bruto : bruto.registros;
};

const proventosReais = lerRegistros('proventos.json').filter((p) => p.ticker === 'PETR4');
const resumoPetr4 = lerRegistros('resumo_acao.json').find((r) => r.ticker === 'PETR4');

const registro = (tipo, data_com, valor, extra = {}) => ({
  ticker: 'TEST3',
  tipo,
  data_com,
  data_pagamento: { valor: null, status: 'indisponivel' },
  valor_por_acao: { valor, status: 'ok' },
  ...extra,
});

describe('proventosPorAno com dados reais (PETR4)', () => {
  const linhas = proventosPorAno(proventosReais, { porAnoResumo: resumoPetr4.proventos_por_ano });

  it('devolve no máximo 5 anos, em ordem crescente', () => {
    expect(linhas.length).toBeGreaterThan(0);
    expect(linhas.length).toBeLessThanOrEqual(5);
    const anos = linhas.map((l) => l.ano);
    expect([...anos].sort((a, b) => a - b)).toEqual(anos);
  });

  it('o total por ano bate com o total do resumo quando ambos existem', () => {
    const comOsDois = linhas.filter((l) => l.total != null && l.total_resumo != null);
    expect(comOsDois.length).toBeGreaterThan(0);
    for (const l of comOsDois) {
      expect(l.total).toBeCloseTo(l.total_resumo, 6);
    }
  });
});

describe('proventosPorAno com registros sintéticos', () => {
  it('soma dividendo e JCP separados por ano da data-com', () => {
    const lista = [
      registro('DIVIDENDO', '2024-03-10', 0.5),
      registro('DIVIDENDO', '2024-09-10', 0.25),
      registro('JCP', '2024-06-10', 0.1),
    ];
    const [linha] = proventosPorAno(lista);
    expect(linha.ano).toBe(2024);
    expect(linha.dividendo).toBeCloseTo(0.75, 6);
    expect(linha.jcp).toBeCloseTo(0.1, 6);
    expect(linha.total).toBeCloseTo(0.85, 6);
  });

  it('ignora registro com valor que não está ok', () => {
    const lista = [
      registro('DIVIDENDO', '2024-03-10', 0.5),
      registro('DIVIDENDO', '2024-09-10', 0.25, { valor_por_acao: { valor: null, status: 'indisponivel' } }),
    ];
    const [linha] = proventosPorAno(lista);
    expect(linha.dividendo).toBeCloseTo(0.5, 6);
  });

  it('ano do resumo sem nenhum registro na lista fica com null, nunca 0', () => {
    const lista = [registro('DIVIDENDO', '2024-03-10', 0.5)];
    const linhas = proventosPorAno(lista, {
      porAnoResumo: [
        { ano: 2023, valor: 0, status: 'ok' },
        { ano: 2024, valor: 0.5, status: 'ok' },
      ],
    });
    const de2023 = linhas.find((l) => l.ano === 2023);
    expect(de2023.dividendo).toBeNull();
    expect(de2023.jcp).toBeNull();
    expect(de2023.total).toBeNull();
    expect(de2023.total_resumo).toBe(0);
  });

  it('anos limita aos anos mais novos', () => {
    const lista = [
      registro('DIVIDENDO', '2021-03-10', 1),
      registro('DIVIDENDO', '2022-03-10', 1),
      registro('DIVIDENDO', '2023-03-10', 1),
    ];
    const linhas = proventosPorAno(lista, { anos: 2 });
    expect(linhas.map((l) => l.ano)).toEqual([2022, 2023]);
  });
});

describe('listaPagamentos', () => {
  const lista = [
    registro('DIVIDENDO', '2023-03-10', 0.47156696, {
      data_pagamento: { valor: '2023-04-01', status: 'ok' },
    }),
    registro('JCP', '2024-06-10', 0.2, {
      data_pagamento: { valor: '9999-12-31', status: 'ok' },
    }),
    registro('DIVIDENDO', '2022-01-05', 0.3, {
      data_pagamento: { valor: null, status: 'indisponivel' },
    }),
    registro('DIVIDENDO', '2024-01-05', 0.1, { valor_por_acao: { valor: null, status: 'indisponivel' } }),
  ];
  const itens = listaPagamentos(lista);

  it('ordena do mais recente para o mais antigo pela data-com', () => {
    expect(itens.map((i) => i.data_com_texto)).toEqual(['10/06/2024', '05/01/2024', '10/03/2023', '05/01/2022']);
  });

  it('data de pagamento "9999-12-31" vira "a definir"', () => {
    expect(itens[0].pagamento_texto).toBe('a definir');
  });

  it('pagamento com status indisponível vira "não informada"', () => {
    expect(itens[3].pagamento_texto).toBe('não informada');
  });

  it('data de pagamento válida vira texto pt-BR', () => {
    expect(itens[2].pagamento_texto).toBe('01/04/2023');
  });

  it('valor pequeno usa 4 casas e valor ausente vira "—"', () => {
    expect(itens[2].valor_texto).toBe(brl(0.47156696, { casas: 4 }));
    expect(itens[1].valor_texto).toBe('—');
  });

  it('rotula o tipo em português', () => {
    expect(itens[0].tipo_rotulo).toBe('JCP');
    expect(itens[2].tipo_rotulo).toBe('Dividendo');
  });
});

describe('juntarPayout', () => {
  const linhas = proventosPorAno(proventosReais, { porAnoResumo: resumoPetr4.proventos_por_ano });
  const payoutReal = resumoPetr4.payout_por_ano;

  it('junta o payout real de cada ano, como fração, e deixa null o ano sem payout', () => {
    const juntadas = juntarPayout(linhas, payoutReal);
    expect(juntadas).toHaveLength(linhas.length);
    for (const l of juntadas) {
      const esperado = payoutReal.find((p) => p.ano === l.ano);
      if (esperado) {
        expect(l.payout).toBeCloseTo(esperado.valor, 9);
      } else {
        expect(l.payout).toBeNull();
      }
    }
  });

  it('ano sem payout com status ok fica null, nunca 0', () => {
    const juntadas = juntarPayout(
      [{ ano: 2023, total: null }, { ano: 2024, total: 0.5 }],
      [{ ano: 2024, valor: null, status: 'historico_insuficiente' }],
    );
    expect(juntadas[0].payout).toBeNull();
    expect(juntadas[1].payout).toBeNull();
  });

  it('payout 0 ok continua 0 e não vira null', () => {
    const [linha] = juntarPayout([{ ano: 2024 }], [{ ano: 2024, valor: 0, status: 'ok' }]);
    expect(linha.payout).toBe(0);
  });

  it('sem payout_por_ano, todas as linhas ficam com null', () => {
    const juntadas = juntarPayout([{ ano: 2024 }], undefined);
    expect(juntadas[0].payout).toBeNull();
  });
});
