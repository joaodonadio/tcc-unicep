// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { brl } from '../../lib/formato.js';
import {
  alertasDeProventos,
  calendarioDoMes,
  DATA_A_DEFINIR,
  diasEntre,
  MAX_PROXIMOS,
  mesesDosPagamentos,
  montarAgenda,
  somarMeses,
  tipoDoProvento,
} from '../../lib/agenda.js';

const HOJE = '2026-10-22';
const acoes = [
  { ticker: 'PETR4', empresa: 'Petrobras' },
  { ticker: 'VALE3', empresa: 'Vale' },
  { ticker: 'ITSA4', empresa: 'Itaú' },
];

const pagar = (ticker, tipo, dataCom, pagamento, valor) => ({
  ticker,
  tipo,
  data_com: dataCom,
  data_pagamento: { valor: pagamento, status: 'ok' },
  valor_por_acao: { valor, status: 'ok' },
});

describe('tipoDoProvento', () => {
  it('traduz DIVIDENDO e JCP, com explicação só para JCP', () => {
    expect(tipoDoProvento('DIVIDENDO')).toEqual({ rotulo: 'Dividendo', explica: null });
    expect(tipoDoProvento('JCP')).toEqual({ rotulo: 'JCP', explica: 'juros sobre capital próprio' });
  });

  it('tipo desconhecido vira texto legível; sem tipo vira "Provento"', () => {
    expect(tipoDoProvento('RENDIMENTO_EXTRA')).toEqual({ rotulo: 'Rendimento extra', explica: null });
    expect(tipoDoProvento(null)).toEqual({ rotulo: 'Provento', explica: null });
  });
});

describe('montarAgenda', () => {
  it('sem hoje devolve agenda vazia', () => {
    expect(montarAgenda({ proventos: [pagar('PETR4', 'DIVIDENDO', '2026-10-01', '2026-11-01', 0.5)] })).toEqual({
      proximos: [],
      futuros: [],
      a_definir: [],
      total_futuros: 0,
    });
  });

  it('deixa de fora pagamentos passados e pagamento que não é texto', () => {
    const proventos = [
      pagar('PETR4', 'DIVIDENDO', '2026-09-01', '2026-10-10', 0.5),
      pagar('VALE3', 'DIVIDENDO', '2026-10-01', null, 0.5),
      { ticker: 'ITSA4', tipo: 'DIVIDENDO', data_com: '2026-10-01', data_pagamento: { valor: null, status: 'indisponivel' } },
    ];
    const r = montarAgenda({ proventos, acoes, hoje: HOJE });
    expect(r.proximos).toEqual([]);
    expect(r.a_definir).toEqual([]);
    expect(r.total_futuros).toBe(0);
  });

  it('ordena os futuros por pagamento e depois por ticker', () => {
    const proventos = [
      pagar('VALE3', 'DIVIDENDO', '2026-10-01', '2026-12-01', 0.3),
      pagar('PETR4', 'DIVIDENDO', '2026-10-01', '2026-11-05', 0.5),
      pagar('ITSA4', 'DIVIDENDO', '2026-10-01', '2026-11-05', 0.4),
    ];
    const { proximos } = montarAgenda({ proventos, acoes, hoje: HOJE });
    expect(proximos.map((p) => p.ticker)).toEqual(['ITSA4', 'PETR4', 'VALE3']);
  });

  it('limita os próximos a 6 e informa o total de futuros', () => {
    const proventos = Array.from({ length: 8 }, (_, i) =>
      pagar('PETR4', 'DIVIDENDO', '2026-10-01', `2026-11-${String(10 + i).padStart(2, '0')}`, 0.1),
    );
    const r = montarAgenda({ proventos, acoes, hoje: HOJE });
    expect(MAX_PROXIMOS).toBe(6);
    expect(r.proximos).toHaveLength(6);
    expect(r.total_futuros).toBe(8);
  });

  it('valor ausente fica null com valor_texto vazio, nunca 0', () => {
    const proventos = [pagar('PETR4', 'DIVIDENDO', '2026-10-01', '2026-11-05', null)];
    const [item] = montarAgenda({ proventos, acoes, hoje: HOJE }).proximos;
    expect(item.valor).toBeNull();
    expect(item.valor_texto).toBe('');
  });

  it('valor com status indisponivel vira null', () => {
    const proventos = [
      {
        ticker: 'PETR4',
        tipo: 'DIVIDENDO',
        data_com: '2026-10-01',
        data_pagamento: { valor: '2026-11-05', status: 'ok' },
        valor_por_acao: { valor: 0.5, status: 'indisponivel' },
      },
    ];
    const [item] = montarAgenda({ proventos, acoes, hoje: HOJE }).proximos;
    expect(item.valor).toBeNull();
    expect(item.valor_texto).toBe('');
  });

  it('JCP traz a explicação do tipo; valor abaixo de 1 real usa 4 casas', () => {
    const proventos = [pagar('VALE3', 'JCP', '2026-10-20', '2026-11-05', 0.12345)];
    const [item] = montarAgenda({ proventos, acoes, hoje: HOJE }).proximos;
    expect(item.tipo_rotulo).toBe('JCP');
    expect(item.tipo_explica).toBe('juros sobre capital próprio');
    expect(item.valor_texto).toBe(brl(0.12345, { casas: 4 }));
    expect(item.dia).toBe('05/11');
    expect(item.data_extenso).toMatch(/5 de novembro de 2026$/);
    expect(item.data_com_texto).toBe('20/10/2026');
    expect(item.empresa).toBe('Vale');
  });

  it('dedupe pelo id: o mesmo provento aparece uma vez', () => {
    const provento = pagar('PETR4', 'DIVIDENDO', '2026-10-01', '2026-11-05', 0.5);
    const { proximos, total_futuros } = montarAgenda({ proventos: [provento, { ...provento }], acoes, hoje: HOJE });
    expect(proximos).toHaveLength(1);
    expect(total_futuros).toBe(1);
  });

  it('aceita data_pagamento como texto puro', () => {
    const proventos = [
      { ticker: 'PETR4', tipo: 'DIVIDENDO', data_com: '2026-10-01', data_pagamento: '2026-12-01', valor_por_acao: 0.5 },
    ];
    const [item] = montarAgenda({ proventos, acoes, hoje: HOJE }).proximos;
    expect(item.data_pagamento).toBe('2026-12-01');
    expect(item.dia).toBe('01/12');
    expect(item.valor).toBe(0.5);
  });

  it('a definir (9999-12-31): entra só com data-com de até um ano atrás, sem limite de 6', () => {
    const proventos = [
      pagar('ITSA4', 'DIVIDENDO', '2025-11-01', DATA_A_DEFINIR, null),
      pagar('PETR4', 'DIVIDENDO', '2026-03-01', DATA_A_DEFINIR, null),
      pagar('VALE3', 'DIVIDENDO', '2024-01-01', DATA_A_DEFINIR, null),
    ];
    const r = montarAgenda({ proventos, acoes, hoje: HOJE });
    expect(r.proximos).toEqual([]);
    expect(r.total_futuros).toBe(0);
    expect(r.a_definir.map((p) => p.ticker)).toEqual(['PETR4', 'ITSA4']);
    const [item] = r.a_definir;
    expect(item.data_pagamento).toBeNull();
    expect(item.dia).toBe('');
    expect(item.data_extenso).toBe('');
  });

  it('a definir ordena por data-com, da mais recente para a mais antiga', () => {
    const proventos = [
      pagar('ITSA4', 'DIVIDENDO', '2025-11-01', DATA_A_DEFINIR, null),
      pagar('PETR4', 'DIVIDENDO', '2026-03-01', DATA_A_DEFINIR, null),
    ];
    const { a_definir } = montarAgenda({ proventos, acoes, hoje: HOJE });
    expect(a_definir.map((p) => p.data_com)).toEqual(['2026-03-01', '2025-11-01']);
  });

  it('os dados reais de public/dados/proventos.json respeitam o limite e a data de hoje', () => {
    const registros = JSON.parse(
      readFileSync(path.join(process.cwd(), 'public', 'dados', 'proventos.json'), 'utf8'),
    ).registros;
    const r = montarAgenda({ proventos: registros, acoes, hoje: '2026-10-22' });
    expect(r.proximos.length).toBeLessThanOrEqual(6);
    expect(r.proximos.every((p) => p.data_pagamento >= '2026-10-22')).toBe(true);
  });

  it('futuros traz todos os pagamentos futuros, sem o corte de 6', () => {
    const proventos = Array.from({ length: 8 }, (_, i) =>
      pagar('PETR4', 'DIVIDENDO', '2026-10-01', `2026-11-${String(10 + i).padStart(2, '0')}`, 0.1),
    );
    const r = montarAgenda({ proventos, acoes, hoje: HOJE });
    expect(r.proximos).toHaveLength(6);
    expect(r.futuros).toHaveLength(8);
    expect(r.total_futuros).toBe(8);
  });

  it('sem hoje, futuros é lista vazia', () => {
    expect(montarAgenda({ proventos: [] }).futuros).toEqual([]);
  });
});

describe('alertasDeProventos', () => {
  const ev = (ticker, dataCom, pagamento, extra = {}) => ({
    id: `${ticker}|${dataCom}|${pagamento}`,
    ticker,
    tipo: 'DIVIDENDO',
    tipo_rotulo: 'Dividendo',
    data_com: dataCom,
    data_pagamento: pagamento,
    valor: 0.5,
    valor_texto: 'R$ 0,50',
    ...extra,
  });

  it('data-com hoje e em até 7 dias entra; 8 dias e passado ficam fora', () => {
    const r = alertasDeProventos(
      [ev('A1', '2026-10-22', '2026-12-01'), ev('B1', '2026-10-29', '2026-12-01'), ev('C1', '2026-10-30', '2026-12-01'), ev('D1', '2026-10-21', '2026-12-01')],
      HOJE,
    );
    const dc = r.find((a) => a.chave === 'data_com');
    expect(dc.itens.map((i) => [i.ticker, i.dias])).toEqual([['A1', 0], ['B1', 7]]);
  });

  it('pagamento nesta semana não inclui "a definir" nem passado', () => {
    const r = alertasDeProventos(
      [ev('A1', '2026-09-01', '2026-10-25'), ev('B1', '2026-09-01', null), ev('C1', '2026-09-01', '2026-10-21')],
      HOJE,
    );
    expect(r.find((a) => a.chave === 'pagamento').itens.map((i) => i.ticker)).toEqual(['A1']);
  });

  it('alerta sem itens não sai; sem eventos ou sem hoje devolve vazio', () => {
    expect(alertasDeProventos([], HOJE)).toEqual([]);
    expect(alertasDeProventos([ev('A1', '2026-12-01', '2027-01-10')], HOJE)).toEqual([]);
    expect(alertasDeProventos([ev('A1', HOJE, HOJE)], undefined)).toEqual([]);
    expect(alertasDeProventos(undefined, HOJE)).toEqual([]);
  });
});

describe('diasEntre', () => {
  it('conta dias corridos sem fuso e vira o ano', () => {
    expect(diasEntre('2026-10-22', '2026-10-25')).toBe(3);
    expect(diasEntre('2026-12-30', '2027-01-02')).toBe(3);
    expect(diasEntre('2026-10-22', null)).toBeNull();
  });
});

describe('diasEntre, somarMeses e calendarioDoMes', () => {
  it('conta dias corridos sem fuso e vira o ano', () => {
    expect(diasEntre('2026-10-22', '2026-10-25')).toBe(3);
    expect(diasEntre('2026-12-30', '2027-01-02')).toBe(3);
    expect(diasEntre('2026-10-22', null)).toBeNull();
  });

  it('soma meses para frente e para trás', () => {
    expect(somarMeses('2026-12', 1)).toBe('2027-01');
    expect(somarMeses('2026-01', -1)).toBe('2025-12');
  });

  it('monta a grade com domingo primeiro e conta pagamentos e datas-com por dia', () => {
    const semanas = calendarioDoMes(
      [
        { data_pagamento: '2026-10-05', data_com: '2026-09-28' },
        { data_pagamento: '2026-10-05', data_com: '2026-10-05' },
        { data_pagamento: '2026-11-01', data_com: '2026-10-20' },
        { data_pagamento: null, data_com: '2026-10-05' },
      ],
      '2026-10',
    );
    expect(semanas).toHaveLength(6);
    expect(semanas.every((s) => s.length === 7)).toBe(true);
    const celulas = semanas.flat();
    // 1º de outubro de 2026 é quinta-feira: 4 vazios antes
    expect(celulas.slice(0, 4)).toEqual([null, null, null, null]);
    expect(celulas[4]).toEqual({ iso: '2026-10-01', dia: 1, qtd: 0, com: 0 });
    const dia5 = celulas.find((c) => c?.iso === '2026-10-05');
    expect(dia5.qtd).toBe(2);
    expect(dia5.com).toBe(2);
    expect(celulas.find((c) => c?.iso === '2026-10-20').com).toBe(1);
    expect(celulas.filter(Boolean)).toHaveLength(31);
    expect(calendarioDoMes([], 'lixo')).toEqual([]);
  });

  it('sempre 42 células, mesmo em mês de 4 ou 5 semanas', () => {
    // fevereiro de 2027 começa numa segunda e tem 28 dias: cabe em 4 semanas, o resto vira null
    const fev = calendarioDoMes([], '2027-02').flat();
    expect(fev).toHaveLength(42);
    expect(fev.filter(Boolean)).toHaveLength(28);
    // outubro de 2026 começa numa quinta: 5 semanas
    expect(calendarioDoMes([], '2026-10').flat()).toHaveLength(42);
    // mês que começa num sábado com 31 dias
    expect(calendarioDoMes([], '2026-08').flat()).toHaveLength(42);
  });
});

describe('mesesDosPagamentos', () => {
  const ev = (id, data_pagamento) => ({ id, data_pagamento });

  it('agrupa por mês mantendo a ordem da lista', () => {
    const grupos = mesesDosPagamentos([
      ev('a', '2026-10-23'),
      ev('b', '2026-10-26'),
      ev('c', '2026-11-05'),
      ev('d', '2026-11-20'),
    ]);
    expect(grupos.map((g) => g.chave)).toEqual(['2026-10', '2026-11']);
    expect(grupos[0].itens.map((e) => e.id)).toEqual(['a', 'b']);
    expect(grupos[1].itens.map((e) => e.id)).toEqual(['c', 'd']);
  });

  it('rótulo em português com mês por extenso e inicial maiúscula', () => {
    const grupos = mesesDosPagamentos([ev('a', '2026-11-05'), ev('b', '2027-03-01')]);
    expect(grupos.map((g) => g.rotulo)).toEqual(['Novembro de 2026', 'Março de 2027']);
  });

  it('virada de ano separa dezembro e janeiro em grupos distintos', () => {
    const grupos = mesesDosPagamentos([ev('a', '2026-12-30'), ev('b', '2027-01-04')]);
    expect(grupos.map((g) => g.chave)).toEqual(['2026-12', '2027-01']);
    expect(grupos.map((g) => g.rotulo)).toEqual(['Dezembro de 2026', 'Janeiro de 2027']);
  });

  it('data inválida ou ausente vai para o grupo vazio, sem rótulo, sem quebrar', () => {
    const grupos = mesesDosPagamentos([ev('a', '2026-11-05'), ev('b', null), ev('c', 'lixo'), ev('d', undefined)]);
    expect(grupos).toEqual([
      { chave: '2026-11', rotulo: 'Novembro de 2026', itens: [ev('a', '2026-11-05')] },
      { chave: '', rotulo: null, itens: [ev('b', null), ev('c', 'lixo'), ev('d', undefined)] },
    ]);
  });

  it('lista vazia ou inválida devolve lista vazia', () => {
    expect(mesesDosPagamentos([])).toEqual([]);
    expect(mesesDosPagamentos(null)).toEqual([]);
  });
});
