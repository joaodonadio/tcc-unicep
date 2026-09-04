/**
 * Adapter mock-first (ARQUITETURA-INTERFACE.md §3).
 *
 * Devolve exatamente os JSONs de `src/mocks/` com latência simulada e taxa de
 * erro configurável — assim os 4 estados de cada card (skeleton / dados /
 * vazio / erro) são exercitados desde o primeiro dia, sem back-end.
 *
 * Este é o ÚNICO ponto que muda quando a API real existir: `api.js` troca a
 * implementação; nenhum componente sabe de onde vieram os dados.
 */

import analiseDoDia from '../mocks/analise-do-dia.json';
import historico from '../mocks/historico.json';

const num = (v, padrao) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : padrao;
};

const LATENCIA_MIN = num(import.meta.env.VITE_MOCK_LATENCY_MIN, 300);
const LATENCIA_MAX = num(import.meta.env.VITE_MOCK_LATENCY_MAX, 800);
const TAXA_ERRO = num(import.meta.env.VITE_MOCK_ERROR_RATE, 0);

function atraso() {
  const ms = LATENCIA_MIN + Math.random() * Math.max(0, LATENCIA_MAX - LATENCIA_MIN);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function servir(construirDados) {
  await atraso();
  if (Math.random() < TAXA_ERRO) {
    const erro = new Error('Falha simulada pelo adapter mock.');
    erro.mensagemUsuario = 'O sistema de análise está indisponível no momento.';
    throw erro;
  }
  return construirDados();
}

/**
 * O mock carrega um `gerado_em` fixo (para ser citável na monografia), mas a
 * interface mostra "ÚLTIMA ANÁLISE ÀS HH:MM" — então o adapter reescreve o
 * carimbo para o horário atual, como se a análise tivesse rodado agora.
 */
function comCarimboDeAgora(dados) {
  return { ...dados, gerado_em: new Date().toISOString() };
}

/**
 * Só PETR4 tem séries longas no protótipo. Para os demais tickers derivamos
 * 6M/1A a partir da série de 30 dias, preservando o preço atual — dados
 * fictícios, coerentes com o disclaimer do rodapé (RF-0.4).
 */
function derivarSerie(serie30, periodo) {
  if (periodo === '1M') return serie30.slice(-16);
  const pontos = periodo === '6M' ? 28 : 26;
  const fim = serie30[serie30.length - 1];
  const inicio = periodo === '6M' ? fim * 0.86 : fim * 0.74;
  const passo = (fim - inicio) / (pontos - 1);
  return Array.from({ length: pontos }, (_, i) => {
    const base = inicio + passo * i;
    const ondulacao = Math.sin(i * 1.7) * (fim * 0.012);
    return Number((base + ondulacao).toFixed(2));
  }).map((v, i, arr) => (i === arr.length - 1 ? Number(fim.toFixed(2)) : v));
}

export const mockAdapter = {
  getAnaliseDoDia() {
    return servir(() => comCarimboDeAgora(analiseDoDia));
  },

  getHistorico(ticker, periodo) {
    return servir(() => {
      const alvo = String(ticker || '').toUpperCase();
      const doMock = historico[alvo]?.[periodo];
      if (doMock) return { ticker: alvo, periodo, serie: doMock, dias: historico.rangeDays[periodo] };

      const rec = analiseDoDia.recomendacoes.find((r) => r.ticker === alvo);
      if (!rec) {
        const erro = new Error(`Sem histórico para ${alvo}.`);
        erro.mensagemUsuario = 'Esta análise não foi encontrada.';
        throw erro;
      }
      return {
        ticker: alvo,
        periodo,
        serie: derivarSerie(rec.serie_30d, periodo),
        dias: historico.rangeDays[periodo],
      };
    });
  },

  // POST /api/decisoes — o diário (RF-2.6/RF-1.8) é espelhado localmente pelo
  // DecisionsContext; aqui só confirmamos o registro.
  registrarDecisao(decisao) {
    return servir(() => ({ ...decisao, registrado_em: new Date().toISOString() }));
  },

  // POST /api/feedback — RF-2.5
  registrarFeedback(feedback) {
    return servir(() => ({ ...feedback, registrado_em: new Date().toISOString() }));
  },
};
