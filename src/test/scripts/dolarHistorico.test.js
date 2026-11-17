import { describe, expect, it } from 'vitest';
import {
  cotacaoDoDolar,
  datasDeConsulta,
  montarHistoricoDolar,
  montarSerieDolar,
} from '../../../scripts/dolarHistorico.mjs';

const publicacao = (data, valor, status = 'ok') => ({
  registros: [{ data_referencia: data, USDBRL: { fechamento: { valor, status } } }],
});

const HOJE = new Date(2026, 10, 4); // 4/11/2026, local

describe('datasDeConsulta', () => {
  it('são dias úteis dos últimos 120 dias corridos, em ordem crescente, terminando hoje', () => {
    const datas = datasDeConsulta(HOJE);

    expect(datas.at(-1)).toBe('2026-11-04');
    expect(new Set(datas).size).toBe(datas.length);
    expect([...datas].sort()).toEqual(datas);
    for (const d of datas) {
      const [ano, mes, dia] = d.split('-').map(Number);
      expect([0, 6]).not.toContain(new Date(ano, mes - 1, dia).getDay());
    }
    // 120 dias corridos têm entre 84 e 87 dias úteis
    expect(datas.length).toBeGreaterThanOrEqual(84);
    expect(datas.length).toBeLessThanOrEqual(87);
  });
});

describe('cotacaoDoDolar', () => {
  it('lê o fechamento ok do pregão de data_referencia', () => {
    expect(cotacaoDoDolar(publicacao('2026-10-22', 5.03))).toEqual({ data: '2026-10-22', valor: 5.03 });
  });

  it('sem registro, sem status ok ou sem número: null, nunca 0', () => {
    expect(cotacaoDoDolar(null)).toBeNull();
    expect(cotacaoDoDolar({ registros: [] })).toBeNull();
    expect(cotacaoDoDolar(publicacao('2026-10-22', 5, 'historico_insuficiente'))).toBeNull();
    expect(cotacaoDoDolar(publicacao('2026-10-22', null))).toBeNull();
  });
});

describe('montarSerieDolar', () => {
  it('ordena por data, deixa de fora as faltas e, em data repetida, vale a última', () => {
    const serie = montarSerieDolar([
      { data: '2026-10-23', valor: 5.1 },
      null,
      { data: '2026-10-22', valor: 5.0 },
      { data: '2026-10-23', valor: 5.2 },
    ]);
    expect(serie).toEqual({ datas: ['2026-10-22', '2026-10-23'], valores: [5.0, 5.2] });
  });

  it('sem nenhuma cotação, a série fica vazia', () => {
    expect(montarSerieDolar([null, null])).toEqual({ datas: [], valores: [] });
  });
});

describe('montarHistoricoDolar', () => {
  it('ignora os 404 (null), monta a série e nunca passa de 6 pedidos ao mesmo tempo', async () => {
    let emVoo = 0;
    let maximo = 0;
    const pedirDia = async (data) => {
      emVoo += 1;
      maximo = Math.max(maximo, emVoo);
      await new Promise((resolver) => setTimeout(resolver, 0));
      emVoo -= 1;
      const dia = Number(data.slice(8));
      // dias pares não tiveram publicação (404)
      return dia % 2 === 0 ? null : publicacao(data, 5 + dia / 100);
    };

    const historico = await montarHistoricoDolar(pedirDia, HOJE);

    expect(maximo).toBeLessThanOrEqual(6);
    expect(historico.datas.length).toBeGreaterThan(0);
    expect(historico.datas.every((d) => Number(d.slice(8)) % 2 === 1)).toBe(true);
    expect(historico.datas).toEqual([...historico.datas].sort());
    expect(historico.valores).toHaveLength(historico.datas.length);
    expect(typeof historico.gerado_em).toBe('string');
  });

  it('uma falha que oscila é repetida uma vez e a série segue', async () => {
    const alvo = datasDeConsulta(HOJE)[3];
    let tentativas = 0;
    const pedirDia = async (data) => {
      if (data === alvo && tentativas === 0) {
        tentativas += 1;
        throw new Error('oscilou');
      }
      return publicacao(data, 5);
    };

    const historico = await montarHistoricoDolar(pedirDia, HOJE);
    expect(historico.datas).toContain(alvo);
  });

  it('uma falha que persiste derruba a série inteira: nada de dia faltando sem aviso', async () => {
    const alvo = datasDeConsulta(HOJE)[3];
    const pedirDia = async (data) => {
      if (data === alvo) throw new Error('rede');
      return null;
    };

    await expect(montarHistoricoDolar(pedirDia, HOJE)).rejects.toThrow('rede');
  });
});
