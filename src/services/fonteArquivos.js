/**
 * Fonte "arquivos": lê os pacotes JSON de public/dados e emula as rotas da API.
 *
 * Cada pacote é baixado uma única vez e guardado em um Map no nível do módulo
 * (sobrevive ao StrictMode, que monta os efeitos duas vezes). Os dados
 * devolvidos são cópias: nunca alterar o objeto em cache.
 */

import { ErroDados, erroDeStatus } from './erros.js';

/** Quantidade de pregões de cada janela de /series_diarias/{t}. 2a e max = tudo. */
const PONTOS_POR_JANELA = { '1m': 22, '3m': 64, '6m': 127, '1a': 253 };
const JANELAS_SEM_CORTE = new Set(['2a', 'max']);

const cachePacotes = new Map();

/** Esquece os pacotes lidos: os testes que simulam pacote ausente começam sem cache. */
export const limparCachePacotes = () => cachePacotes.clear();

function carregarPacote(pacote) {
  if (!cachePacotes.has(pacote)) {
    const promessa = fetch(`${import.meta.env.BASE_URL}dados/${pacote}.json`).then((resp) => {
      if (!resp.ok) throw erroDeStatus(resp.status, `pacote ${pacote} não encontrado`);
      return resp.json();
    });
    // Falha não fica em cache: a próxima chamada tenta de novo.
    promessa.catch(() => cachePacotes.delete(pacote));
    cachePacotes.set(pacote, promessa);
  }
  return cachePacotes.get(pacote);
}

function decodificarSegmentos(caminho) {
  const partes = caminho.replace(/^\/+/, '').split('/');
  try {
    return partes.map((parte) => decodeURIComponent(parte));
  } catch {
    throw erroDeStatus(422, `segmento mal codificado em ${caminho}`);
  }
}

function comRegistros(envelope, registros) {
  return { ...envelope, registros };
}

async function registrosDoTicker(pacote, ticker) {
  const envelope = await carregarPacote(pacote);
  const registros = envelope.registros.filter((r) => r.ticker === ticker);
  return registros.length ? comRegistros(envelope, registros) : null;
}

async function serieDoTicker(ticker, janela) {
  const envelope = await registrosDoTicker('series_diarias', ticker);
  if (!envelope || janela === undefined || JANELAS_SEM_CORTE.has(janela)) return envelope;

  const pontos = PONTOS_POR_JANELA[janela];
  if (pontos === undefined) throw erroDeStatus(422, `janela desconhecida: ${janela}`);

  const registros = envelope.registros.map((serie) => {
    const valores = Object.fromEntries(
      Object.entries(serie.valores ?? {}).map(([nome, lista]) => [
        nome,
        Array.isArray(lista) ? lista.slice(-pontos) : lista,
      ]),
    );
    return { ...serie, datas: serie.datas.slice(-pontos), valores };
  });
  return comRegistros(envelope, registros);
}

/** Lê "cotacao.fechamento" dentro do registro. */
const lerCaminho = (obj, caminho) =>
  caminho.split('.').reduce((o, chave) => (o == null ? undefined : o[chave]), obj);

/** Emula /resumo_acao/{t}/historico?campo= no formato da API: {ticker, campo, datas, valores, status}. */
async function historicoDoTicker(ticker, campo) {
  if (!campo) throw erroDeStatus(422, 'historico exige ?campo=');
  const envelope = await carregarPacote('resumo_acao');
  const registros = envelope.registros
    .filter((r) => r.ticker === ticker)
    .sort((a, b) => String(a.data_referencia).localeCompare(String(b.data_referencia)));
  if (registros.length === 0) return null;

  const brutos = registros.map((r) => lerCaminho(r, campo));
  if (brutos.every((x) => x === undefined)) throw erroDeStatus(422, `campo ${campo} não existe no resumo_acao`);

  const datas = [];
  const valores = [];
  const status = [];
  registros.forEach((r, i) => {
    const x = brutos[i];
    datas.push(r.data_referencia);
    if (x !== null && typeof x === 'object') {
      valores.push(x.status === 'ok' ? (x.valor ?? null) : null);
      if (x.status !== 'ok') status.push({ data: r.data_referencia, status: x.status ?? 'indisponivel' });
    } else {
      valores.push(typeof x === 'number' ? x : null);
    }
  });
  return { ticker, campo, datas, valores, status, data_referencia: datas.at(-1) };
}

async function ultimaExecucao() {
  const envelope = await carregarPacote('execucao');
  const ultimo = envelope.registros[envelope.registros.length - 1];
  return comRegistros(envelope, ultimo ? [ultimo] : []);
}

/**
 * Emula GET /v1/{caminho}?params e devolve o envelope (ou null, como um 404).
 * `params.data` é ignorado: o modo arquivos sempre serve a última geração.
 * O histórico por campo (resumo_acao/{t}/historico) volta sem envelope, como na API.
 */
export async function pedirArquivos(caminho, { params = {} } = {}) {
  const [recurso, ...resto] = decodificarSegmentos(caminho);
  const [segundo, terceiro] = resto;

  switch (recurso) {
    case 'saude':
      return { status: 'ok', fonte: 'arquivos' };

    case 'experimento':
      // O pacote do experimento só existe depois de 5 anos de histórico.
      return null;

    case 'execucao':
      if (segundo === 'ultima') return ultimaExecucao();
      break;

    case 'acoes':
    case 'mercado_dia':
      if (resto.length === 0) return carregarPacote(recurso);
      break;

    case 'dolar-historico':
      // só a rota local da API monta esta série (scripts/dolarHistorico.mjs); aqui não há como montar
      return null;

    case 'noticias_dia':
      if (resto.length === 0) return carregarPacote(recurso);
      if (resto.length === 1) return registrosDoTicker(recurso, segundo);
      break;

    case 'resumo_acao':
      if (resto.length === 0) return carregarPacote(recurso);
      if (resto.length === 1) return registrosDoTicker(recurso, segundo);
      if (resto.length === 2 && terceiro === 'historico') return historicoDoTicker(segundo, params.campo);
      break;

    case 'series_diarias':
      if (resto.length === 1) return serieDoTicker(segundo, params.janela);
      break;

    case 'proventos':
      if (resto.length === 0) return carregarPacote(recurso);
      if (resto.length === 1) return registrosDoTicker(recurso, segundo);
      break;

    case 'fundamentos_trimestrais':
      if (resto.length === 1) return registrosDoTicker(recurso, segundo);
      break;

    default:
      break;
  }

  throw erroDeStatus(404, `rota sem emulação no modo arquivos: ${caminho}`);
}
