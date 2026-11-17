/**
 * Rota local GET /api/v1/dolar-historico, servida pelo próprio Vite (dev e preview).
 *
 * A API não tem série do dólar, mas cada publicação diária de /v1/mercado_dia traz o
 * fechamento do pregão (USDBRL). Aqui o servidor percorre os dias úteis dos últimos 120
 * dias corridos, junta as publicações numa série só, guarda em memória por 6 horas e
 * entrega a todos os visitantes. A chave fica no servidor.
 *
 * As funções de montagem são puras (sem rede): o teste em src/test/scripts usa-as direto.
 */

import { criarPedirJson } from './pedirApi.mjs';

export const DIAS_CORRIDOS = 120;
const VALIDADE_MS = 6 * 60 * 60_000;
const SIMULTANEOS = 6;
const ROTA = '/api/v1/dolar-historico';

const doisDigitos = (n) => String(n).padStart(2, '0');
const comoIso = (d) => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;

/**
 * Datas 'AAAA-MM-DD' dos últimos `dias` dias corridos até `hoje` (inclusive), sem sábado nem
 * domingo, da mais antiga para a mais recente.
 */
export function datasDeConsulta(hoje = new Date(), dias = DIAS_CORRIDOS) {
  const datas = [];
  for (let i = dias - 1; i >= 0; i -= 1) {
    const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
    if (dia.getDay() !== 0 && dia.getDay() !== 6) datas.push(comoIso(dia));
  }
  return datas;
}

/**
 * Fechamento do dólar de uma publicação de /v1/mercado_dia: {data, valor}, com `data` o pregão
 * (data_referencia). Sem publicação, sem o campo ou com status diferente de 'ok': null.
 */
export function cotacaoDoDolar(corpo) {
  const registro = corpo?.registros?.[0];
  const campo = registro?.USDBRL?.fechamento;
  const valor = campo?.valor;
  if (!registro?.data_referencia || campo?.status !== 'ok' || typeof valor !== 'number' || !Number.isFinite(valor)) {
    return null;
  }
  return { data: registro.data_referencia, valor };
}

/**
 * Série {datas, valores} com um ponto por pregão, em ordem crescente. Duas publicações do mesmo
 * pregão: vale a que vier por último na lista (a mais recente, se a lista estiver em ordem).
 * Cotação ausente (null) fica de fora.
 */
export function montarSerieDolar(cotacoes = []) {
  const porData = new Map();
  for (const cotacao of cotacoes) {
    if (cotacao) porData.set(cotacao.data, cotacao.valor);
  }
  const datas = [...porData.keys()].sort();
  return { datas, valores: datas.map((data) => porData.get(data)) };
}

/** Uma repetição só: a falha de rede ou de servidor tenta de novo; se falhar outra vez, sobe o erro. */
async function pedirDeNovo(pedirDia, data) {
  try {
    return await pedirDia(data);
  } catch {
    return pedirDia(data);
  }
}

/**
 * Busca a publicação de cada dia de consulta, SIMULTANEOS por vez, e monta a série.
 * `pedirDia(data)` devolve o corpo da publicação ou null (404: não houve publicação).
 * Uma falha que persiste derruba a série inteira: um dia faltando sem aviso seria um número errado.
 */
export async function montarHistoricoDolar(pedirDia, hoje = new Date()) {
  const datas = datasDeConsulta(hoje);
  const corpos = new Array(datas.length);
  let proximo = 0;
  async function trabalhar() {
    while (proximo < datas.length) {
      const i = proximo;
      proximo += 1;
      corpos[i] = await pedirDeNovo(pedirDia, datas[i]);
    }
  }
  await Promise.all(Array.from({ length: SIMULTANEOS }, trabalhar));
  return { ...montarSerieDolar(corpos.map(cotacaoDoDolar)), gerado_em: new Date().toISOString() };
}

/** Pede a publicação de mercado_dia de um dia à API: corpo ou null (404). */
export function criarPedirDia(env) {
  const pedirJson = criarPedirJson(env, { nulo404: true });
  return (data) => pedirJson(`mercado_dia?data=${encodeURIComponent(data)}`);
}

/** Corpo JSON (objeto) da rota do dólar, pronto para a resposta. */
export function montarCorpoDolar(pedirDia, hoje = new Date()) {
  return montarHistoricoDolar(pedirDia, hoje);
}

export function dolarHistorico(env) {
  const base = String(env.API_BASE_URL ?? '').replace(/\/+$/, '');
  let cache = null; // { em, corpo }
  let emAndamento = null;

  const pedirDia = criarPedirDia(env);

  async function montar() {
    const historico = await montarHistoricoDolar(pedirDia);
    return JSON.stringify(historico);
  }

  function obterCorpo() {
    if (cache && Date.now() - cache.em < VALIDADE_MS) return Promise.resolve(cache.corpo);
    emAndamento ??= montar()
      .then((corpo) => {
        cache = { em: Date.now(), corpo };
        return corpo;
      })
      .finally(() => {
        emAndamento = null;
      });
    return emAndamento;
  }

  function middleware(req, res, next) {
    if (req.method !== 'GET' || req.url?.split('?')[0] !== ROTA) return next();
    obterCorpo().then(
      (corpo) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(corpo);
      },
      () => {
        res.statusCode = 502;
        res.end('{"detail":"histórico do dólar indisponível"}');
      },
    );
  }

  function instalar(server) {
    if (!base) return; // sem API configurada (modo arquivos): rota não existe
    server.middlewares.use(middleware);
    obterCorpo().catch(() => {}); // já começa a montar ao subir o servidor
  }

  return {
    name: 'dolar-historico',
    configureServer: instalar,
    configurePreviewServer: instalar,
  };
}
