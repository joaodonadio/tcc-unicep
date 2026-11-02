// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { montarAnaliseDoDia } from '../../lib/analiseDoDia.js';
import { valorOuNulo } from '../../lib/valor.js';

const lerRegistros = (arquivo) =>
  JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'dados', arquivo), 'utf8')).registros;

const acoes = lerRegistros('acoes.json');
const resumos = lerRegistros('resumo_acao.json');
const noticias = lerRegistros('noticias_dia.json');
const mercado = lerRegistros('mercado_dia.json')[0];
const execucao = lerRegistros('execucao.json')[0];
const analise = montarAnaliseDoDia({ acoes, resumos, noticias, mercado, execucao });

describe('análise do dia: campos do redesign com dados reais', () => {
  describe('ativos do globo', () => {
    it('tem tickers únicos e inclui as 3 primeiras sugestões', () => {
      const tickers = analise.ativos.map((a) => a.ticker);
      expect(new Set(tickers).size).toBe(tickers.length);
      for (const s of analise.sugestoes.slice(0, 3)) {
        expect(tickers).toContain(s.ticker);
      }
    });

    it('inclui a ação de maior volume de cada setor', () => {
      const tickers = new Set(analise.ativos.map((a) => a.ticker));
      const setorDe = new Map(acoes.map((a) => [a.ticker, a.setor]));
      const lideres = new Map();
      for (const r of resumos) {
        const setor = setorDe.get(r.ticker);
        const volume = valorOuNulo(r.volume?.total);
        if (!setor || volume == null) continue;
        const atual = lideres.get(setor);
        if (!atual || volume > atual.volume) lideres.set(setor, { ticker: r.ticker, volume });
      }
      expect(lideres.size).toBeGreaterThan(0);
      for (const { ticker } of lideres.values()) {
        expect(tickers).toContain(ticker);
      }
    });

    it('tem no máximo 13 nós e todo nó traz setor_nome e tipo válido', () => {
      expect(analise.ativos.length).toBeLessThanOrEqual(13);
      for (const a of analise.ativos) {
        expect(a).toHaveProperty('setor_nome');
        expect(['forte', 'atencao', 'neutro']).toContain(a.tipo);
      }
    });
  });

  describe('painel de alertas', () => {
    it('tem título com o dia e mês do pregão', () => {
      expect(analise.painel_alertas.titulo).toMatch(/^Alertas do pregão de \d{2}\/\d{2}$/);
    });

    it('maior alta sobe e maior queda cai, com texto de variação com sinal', () => {
      const { alta, queda } = analise.painel_alertas;
      expect(alta.variacao).toBeGreaterThan(0);
      expect(alta.variacao_texto.startsWith('+')).toBe(true);
      expect(queda.variacao).toBeLessThan(0);
      expect(queda.variacao_texto.startsWith('−')).toBe(true);
    });

    it('volume vem em ordem decrescente e cada item termina com ×', () => {
      const { itens } = analise.painel_alertas.volume;
      for (let i = 1; i < itens.length; i += 1) {
        expect(itens[i - 1].vezes).toBeGreaterThanOrEqual(itens[i].vezes);
      }
      expect(itens.every((x) => x.vezes_texto.endsWith('×'))).toBe(true);
    });

    it('execução real com status ok não gera alerta de execução', () => {
      expect(analise.painel_alertas.execucao).toEqual([]);
    });

    it('execução parcial gera um alerta de execução', () => {
      const comParcial = montarAnaliseDoDia({ acoes, resumos, noticias, mercado, execucao: { status: 'parcial' } });
      expect(comParcial.painel_alertas.execucao).toHaveLength(1);
    });
  });

  describe('ações do pregão', () => {
    it('tem uma entrada por resumo, 85 no total', () => {
      expect(analise.acoes_pregao).toHaveLength(85);
    });

    it('77 ações têm sinal e a sem sinal tem tipo nulo e contagem zerada', () => {
      expect(analise.acoes_pregao.filter((a) => a.tem_sinal)).toHaveLength(77);
      const semSinal = analise.acoes_pregao.find((a) => !a.tem_sinal);
      expect(semSinal.tipo).toBeNull();
      expect(semSinal.contagem.total).toBe(0);
    });
  });

  describe('tom por setor', () => {
    it('total é a soma das três contagens', () => {
      for (const s of analise.tom_por_setor) {
        expect(s.total).toBe(s.positivas + s.neutras + s.negativas);
      }
    });

    it('está ordenado por saldo decrescente', () => {
      const saldos = analise.tom_por_setor.map((s) => s.saldo);
      for (let i = 1; i < saldos.length; i += 1) {
        expect(saldos[i - 1]).toBeGreaterThanOrEqual(saldos[i]);
      }
    });
  });

  describe('manchetes por tom', () => {
    it('tem as chaves positivo, neutro e negativo, com até 3 itens cada', () => {
      expect(Object.keys(analise.manchetes_por_tom).sort()).toEqual(['negativo', 'neutro', 'positivo']);
      for (const lista of Object.values(analise.manchetes_por_tom)) {
        expect(lista.length).toBeLessThanOrEqual(3);
      }
    });

    it('cada lista só tem manchetes do próprio tom', () => {
      for (const [tom, lista] of Object.entries(analise.manchetes_por_tom)) {
        expect(lista.every((m) => m.tom === tom)).toBe(true);
      }
    });
  });

  describe('periodos dos indicadores', () => {
    const comPeriodos = ['CDI 12M', 'IPCA 12M', 'IDIV', 'SMLL', 'IFIX', 'IVVB11'];

    it('todo indicador de índice tem 1 mês, 6 meses e 1 ano, nessa ordem', () => {
      for (const label of comPeriodos) {
        const ind = analise.indicadores.find((i) => i.label === label);
        expect(ind.periodos.map((p) => p.rotulo)).toEqual(['1 mês', '6 meses', '1 ano']);
      }
    });

    it('o Ibovespa não ganha periodos', () => {
      const ibov = analise.indicadores.find((i) => i.label === 'Ibovespa (pontos)');
      expect(ibov.periodos).toBeUndefined();
    });

    it('lê os valores reais do CDI e do IPCA', () => {
      const cdi = analise.indicadores.find((i) => i.label === 'CDI 12M');
      expect(cdi.periodos.map((p) => p.valor_texto)).toEqual(['+1,1%', '+6,8%', '+14,6%']);
      const ipca = analise.indicadores.find((i) => i.label === 'IPCA 12M');
      expect(ipca.periodos.map((p) => p.valor_texto)).toEqual(['+0,8%', '+2,0%', '+4,6%']);
    });

    it('mostra "—" quando o 1 ano é historico_insuficiente, nunca 0', () => {
      const idiv = analise.indicadores.find((i) => i.label === 'IDIV');
      expect(idiv.periodos[2]).toEqual({ rotulo: '1 ano', valor_texto: '—', sinal: 'flat' });
      for (const p of idiv.periodos) {
        expect(p.valor_texto === '—' || /%$/.test(p.valor_texto)).toBe(true);
      }
    });

    it('campo ausente vira "—" mesmo com os demais preenchidos', () => {
      const semM1 = structuredClone(mercado);
      semM1.indices.CDI.m1 = { valor: null, status: 'indisponivel' };
      const outra = montarAnaliseDoDia({ acoes, resumos, noticias, mercado: semM1, execucao });
      const cdi = outra.indicadores.find((i) => i.label === 'CDI 12M');
      expect(cdi.periodos[0]).toEqual({ rotulo: '1 mês', valor_texto: '—', sinal: 'flat' });
      expect(cdi.periodos[1].valor_texto).toBe('+6,8%');
    });
  });
});
