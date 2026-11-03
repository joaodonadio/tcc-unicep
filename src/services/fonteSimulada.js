/**
 * Fonte "simulado" (VITE_FONTE_DADOS=simulado): só para trabalhar o design, nunca em produção.
 * Parte dos pacotes de public/dados (fonteArquivos) e completa o que falta com valores de semente fixa
 * (lib/simulacao.js): série do dólar, ações estáveis, tom das notícias desigual e pagamentos nos
 * próximos dias. Mesmas rotas e envelopes das outras fontes.
 * Atraso e falha: VITE_MOCK_LATENCY_MIN/MAX (ms) e VITE_MOCK_ERROR_RATE (0 a 1); zerados nos testes.
 */

import { hojeISO } from '../lib/datas.js';
import { aproximarProventos, escolherPorSemente, serieDolarSimulada, variarNoticia, variarResumo } from '../lib/simulacao.js';
import { erroDeStatus } from './erros.js';
import { pedirArquivos } from './fonteArquivos.js';

const TICKER_DOLAR = 'USDBRL';
const ESTAVEIS = 8;

const numeroOu = (texto, padrao) => {
  const v = Number(texto);
  return texto !== undefined && texto !== '' && Number.isFinite(v) ? v : padrao;
};

/** Configuração lida do ambiente; nos testes, sem atraso nem falha. */
export function configuracaoDoAmbiente() {
  if (import.meta.env.MODE === 'test') return { latenciaMin: 0, latenciaMax: 0, taxaErro: 0 };
  return {
    latenciaMin: Math.max(0, numeroOu(import.meta.env.VITE_MOCK_LATENCY_MIN, 0)),
    latenciaMax: Math.max(0, numeroOu(import.meta.env.VITE_MOCK_LATENCY_MAX, 0)),
    taxaErro: Math.min(1, Math.max(0, numeroOu(import.meta.env.VITE_MOCK_ERROR_RATE, 0))),
  };
}

function esperar(ms, signal) {
  if (!(ms > 0)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const relogio = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(relogio);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

const decodificar = (parte) => {
  try {
    return decodeURIComponent(parte);
  } catch {
    return parte;
  }
};

/** Envelope só com os registros do ticker, ou null (como um 404). */
function doTicker(envelope, ticker) {
  const registros = (envelope?.registros ?? []).filter((r) => r.ticker === ticker);
  return registros.length ? { ...envelope, registros } : null;
}

async function resumosSimulados() {
  const envelope = await pedirArquivos('resumo_acao');
  const estaveis = escolherPorSemente(envelope.registros.map((r) => r.ticker), ESTAVEIS);
  return { ...envelope, registros: envelope.registros.map((r) => variarResumo(r, estaveis.has(r.ticker))) };
}

async function proventosSimulados(hoje) {
  const envelope = await pedirArquivos('proventos');
  return { ...envelope, registros: aproximarProventos(envelope.registros, hoje) };
}

/** Série do dólar nas datas do Ibovespa (mesma janela), terminando no fechamento do pacote do dia. */
async function serieDoDolar(params) {
  const [ibov, mercado] = await Promise.all([
    pedirArquivos('series_diarias/IBOV', { params }),
    pedirArquivos('mercado_dia'),
  ]);
  const base = ibov?.registros?.[0];
  const usd = mercado?.registros?.[0]?.USDBRL;
  const fechamento = serieDolarSimulada({
    datas: base?.datas ?? [],
    fechamento: usd?.fechamento?.valor ?? null,
    variacao: usd?.variacao_dia?.valor ?? null,
  });
  if (!fechamento) return null;
  return { ...ibov, registros: [{ ...base, ticker: TICKER_DOLAR, nome: 'Dólar (simulado)', valores: { fechamento } }] };
}

/**
 * Cria a fonte com atraso e taxa de falha dados (os testes passam `sortear` e `hoje` fixos).
 * A falha rejeita com o mesmo ErroDados das outras fontes (503, transitório).
 */
export function criarFonteSimulada({ latenciaMin = 0, latenciaMax = 0, taxaErro = 0, sortear = Math.random, hoje = hojeISO } = {}) {
  return async function pedirSimulado(caminho, { params = {}, signal } = {}) {
    await esperar(latenciaMin + sortear() * Math.max(0, latenciaMax - latenciaMin), signal);
    if (taxaErro > 0 && sortear() < taxaErro) throw erroDeStatus(503, `falha simulada em ${caminho}`);

    const partes = caminho.replace(/^\/+/, '').split('/').map(decodificar);
    const [recurso, segundo] = partes;
    const n = partes.length;

    if (recurso === 'saude') return { status: 'ok', fonte: 'simulado' };
    if (recurso === 'series_diarias' && n === 2 && segundo === TICKER_DOLAR) {
      // se um dia o pacote trouxer o dólar, vale o pacote
      return (await pedirArquivos(caminho, { params })) ?? serieDoDolar(params);
    }
    if (recurso === 'resumo_acao' && n === 1) return resumosSimulados();
    if (recurso === 'resumo_acao' && n === 2) return doTicker(await resumosSimulados(), segundo);
    if (recurso === 'proventos' && n === 1) return proventosSimulados(hoje());
    if (recurso === 'proventos' && n === 2) return doTicker(await proventosSimulados(hoje()), segundo);
    if (recurso === 'noticias_dia' && n <= 2) {
      const resp = await pedirArquivos(caminho, { params });
      return resp ? { ...resp, registros: resp.registros.map(variarNoticia) } : resp;
    }
    return pedirArquivos(caminho, { params });
  };
}

export const pedirSimulado = criarFonteSimulada(configuracaoDoAmbiente());
