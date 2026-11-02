/**
 * Tradução automática das manchetes para português, pelo proxy /traduzir do Vite.
 * As manchetes pedidas juntas viram um só pedido (uma por linha), um lote por vez,
 * com cache no navegador (localStorage). Se o tradutor pedir para esperar (429),
 * os pedidos param por 15 minutos. Qualquer falha devolve null: a tela mostra só o original.
 */

import { criarLimitador } from '../lib/concorrencia.js';

const CHAVE_CACHE = 'traducoes_v1';
const CHAVE_PAUSA = 'traducoes_pausa_ate';
const MAX_ENTRADAS = 500;
const ESPERA_LOTE_MS = 60;
const MAX_CARACTERES_LOTE = 1500;
const PAUSA_APOS_LIMITE_MS = 15 * 60_000;
const limitar = criarLimitador(1);

/** texto -> funções que esperam a tradução dele */
const pendentes = new Map();
let temporizador = null;

/** Lê a resposta do tradutor ([[["trad","orig",…],…], null, "en", …]) como {pt, idioma}; formato estranho -> null. */
export function lerResposta(r) {
  if (!Array.isArray(r) || !Array.isArray(r[0])) return null;
  const pt = r[0]
    .map((parte) => (Array.isArray(parte) && typeof parte[0] === 'string' ? parte[0] : ''))
    .join('')
    .trim();
  const idioma = typeof r[2] === 'string' ? r[2] : null;
  return pt ? { pt, idioma } : null;
}

/**
 * Lê a resposta de um lote (originais separados por quebra de linha): uma tradução
 * por original, na mesma ordem. Linha igual ao original é tratada como português.
 * Número de linhas diferente do lote -> todas null (não dá para casar com segurança).
 */
export function lerLote(r, originais) {
  const nulos = originais.map(() => null);
  if (!Array.isArray(r) || !Array.isArray(r[0])) return nulos;
  const linhas = r[0]
    .map((parte) => (Array.isArray(parte) && typeof parte[0] === 'string' ? parte[0] : ''))
    .join('')
    .split('\n');
  if (linhas.length !== originais.length) return nulos;
  const detectado = typeof r[2] === 'string' && !r[2].startsWith('pt') ? r[2] : null;
  return linhas.map((linha, i) => {
    const pt = linha.trim();
    if (!pt) return null;
    return { pt, idioma: pt === originais[i] ? 'pt' : detectado };
  });
}

/** Divide os textos em lotes que cabem num endereço de tamanho seguro. */
export function montarLotes(textos, maxCaracteres = MAX_CARACTERES_LOTE) {
  const lotes = [];
  let atual = [];
  let tamanho = 0;
  for (const texto of textos) {
    if (atual.length && tamanho + texto.length + 1 > maxCaracteres) {
      lotes.push(atual);
      atual = [];
      tamanho = 0;
    }
    atual.push(texto);
    tamanho += texto.length + 1;
  }
  if (atual.length) lotes.push(atual);
  return lotes;
}

function lerCache() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_CACHE)) ?? {};
  } catch {
    return {};
  }
}

function gravarCache(novas) {
  try {
    const cache = { ...lerCache(), ...novas };
    const chaves = Object.keys(cache);
    for (const chave of chaves.slice(0, Math.max(0, chaves.length - MAX_ENTRADAS))) delete cache[chave];
    localStorage.setItem(CHAVE_CACHE, JSON.stringify(cache));
  } catch {
    // navegador sem armazenamento: segue sem cache
  }
}

function emPausa() {
  try {
    return Number(localStorage.getItem(CHAVE_PAUSA) ?? 0) > Date.now();
  } catch {
    return false;
  }
}

function pausar() {
  try {
    localStorage.setItem(CHAVE_PAUSA, String(Date.now() + PAUSA_APOS_LIMITE_MS));
  } catch {
    // sem armazenamento: a pausa não persiste
  }
}

async function pedirLote(lote) {
  if (emPausa()) return lote.map(() => null);
  try {
    const resp = await fetch(
      `/traduzir/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=${encodeURIComponent(lote.join('\n'))}`,
    );
    if (resp.status === 429) pausar();
    if (!resp.ok) return lote.map(() => null);
    return lerLote(await resp.json(), lote);
  } catch {
    return lote.map(() => null);
  }
}

async function enviarPendentes() {
  temporizador = null;
  const textos = [...pendentes.keys()];
  for (const lote of montarLotes(textos)) {
    const traducoes = await limitar(() => pedirLote(lote));
    const novas = {};
    lote.forEach((texto, i) => {
      if (traducoes[i]) novas[texto] = traducoes[i];
      for (const resolver of pendentes.get(texto) ?? []) resolver(traducoes[i]);
      pendentes.delete(texto);
    });
    if (Object.keys(novas).length) gravarCache(novas);
  }
}

/** Traduz um texto para português: {pt, idioma} ou null (sem texto, falha, pausa ou proxy ausente). */
export function traduzir(texto) {
  const original = String(texto ?? '').replace(/\s+/g, ' ').trim();
  if (!original) return Promise.resolve(null);
  const salvo = lerCache()[original];
  if (salvo) return Promise.resolve(salvo);
  if (emPausa()) return Promise.resolve(null);
  return new Promise((resolver) => {
    pendentes.set(original, [...(pendentes.get(original) ?? []), resolver]);
    temporizador ??= setTimeout(enviarPendentes, ESPERA_LOTE_MS);
  });
}
