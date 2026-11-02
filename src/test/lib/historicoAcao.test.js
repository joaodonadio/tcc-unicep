// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  CAMPOS_HISTORICO,
  compararEm,
  datasDisponiveis,
  normalizarHistoricoCampo,
} from '../../lib/historicoAcao.js';
import { pct, pp } from '../../lib/formato.js';

const RESP_API = {
  ticker: 'PETR4',
  campo: 'pl',
  datas: ['2026-10-22', '2026-10-23', '2026-10-26'],
  valores: [5.95, 6.01, 5.57],
  status: [],
  data_publicacao: '2026-10-27',
  data_referencia: '2026-10-26',
};

describe('normalizarHistoricoCampo', () => {
  it('formato da API: datas e valores iguais, sem motivos', () => {
    const r = normalizarHistoricoCampo(RESP_API);
    expect(r.datas).toEqual(RESP_API.datas);
    expect(r.valores).toEqual(RESP_API.valores);
    expect(r.motivos).toEqual([null, null, null]);
  });

  it('aceita envelope com registros[0]', () => {
    const r = normalizarHistoricoCampo({ registros: [{ datas: ['2026-10-22'], valores: [1.5] }] });
    expect(r.valores).toEqual([1.5]);
  });

  it('status não ok na data vira valor null e guarda o motivo', () => {
    const r = normalizarHistoricoCampo({
      ...RESP_API,
      status: [{ data: '2026-10-23', status: 'indisponivel' }],
    });
    expect(r.valores[1]).toBeNull();
    expect(r.motivos[1]).toBe('indisponivel');
    expect(r.valores[0]).toBe(5.95);
  });

  it('valores no formato {valor, status} são lidos', () => {
    const r = normalizarHistoricoCampo({
      datas: ['2026-10-22', '2026-10-23'],
      valores: [{ valor: 2, status: 'ok' }, { valor: null, status: 'lucro_negativo' }],
      status: [],
    });
    expect(r.valores).toEqual([2, null]);
  });

  it('null, {} e registros vazio devolvem null', () => {
    expect(normalizarHistoricoCampo(null)).toBeNull();
    expect(normalizarHistoricoCampo({})).toBeNull();
    expect(normalizarHistoricoCampo({ registros: [] })).toBeNull();
  });

  it('valor 0 continua 0 (não vira null)', () => {
    const r = normalizarHistoricoCampo({ datas: ['2026-10-22'], valores: [0], status: [] });
    expect(r.valores).toEqual([0]);
  });
});

const DATAS3 = ['2026-10-22', '2026-10-23', '2026-10-26'];
const HISTORICOS = {
  'cotacao.fechamento': { datas: DATAS3, valores: [10, 11, 12] },
  dividend_yield: { datas: DATAS3, valores: [0.05, null, 0.06] },
  pl: null,
};

describe('compararEm', () => {
  it('compara a data escolhida com a mais recente, na ordem de CAMPOS_HISTORICO', () => {
    const linhas = compararEm(HISTORICOS, '2026-10-22');
    expect(linhas).toHaveLength(5);
    expect(linhas.map((l) => l.campo)).toEqual(CAMPOS_HISTORICO.map((c) => c.campo));
    const cotacao = linhas[0];
    expect(cotacao.antes_texto).toBe('R$ 10,00');
    expect(cotacao.agora_texto).toBe('R$ 12,00');
    expect(cotacao.diferenca_texto).toBe(pct(0.2));
    const dy = linhas[3];
    expect(dy.diferenca_texto).toBe(pp(0.01));
  });

  it('P/L sem histórico mostra "—" em tudo', () => {
    const pl = compararEm(HISTORICOS, '2026-10-22')[1];
    expect(pl.antes_texto).toBe('—');
    expect(pl.agora_texto).toBe('—');
    expect(pl.diferenca_texto).toBe('—');
  });

  it('data que não existe no histórico vira "—"', () => {
    const cotacao = compararEm(HISTORICOS, '2026-10-24')[0];
    expect(cotacao.antes_texto).toBe('—');
    expect(cotacao.diferenca_texto).toBe('—');
  });
});

describe('datasDisponiveis', () => {
  it('une as datas de todos os campos, em ordem', () => {
    expect(datasDisponiveis(HISTORICOS)).toEqual(DATAS3);
  });

  it('sem histórico devolve lista vazia', () => {
    expect(datasDisponiveis({})).toEqual([]);
  });
});
