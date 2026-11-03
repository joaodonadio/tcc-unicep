import { semAcento } from './listaAcoes.js';
import { sinalDaVariacao } from './setores.js';

/*
 * Vitrine giratória dos setores (cenaSetores.js): um disco que mostra um setor por vez, no centro.
 * Ângulos em radianos. Cada setor tem uma posição no giro, na ordem da lista, em sentido horário visto de cima.
 * A rotação do disco (psi) põe na frente o setor de índice k quando psi = k · passo.
 * Sem números no desenho: a variação fica na legenda e na lista.
 */

export const TAU = Math.PI * 2;
/** Raio do disco giratório e do anel de pedestais (unidades do three). */
export const RAIO_DISCO = 4.6;
export const RAIO_ANEL = 3.4;
/** Largura do quadro: o disco ocupa cerca de 95% dela. */
export const LARGURA_QUADRO = (RAIO_DISCO * 2) / 0.95;
/** Altura mínima do quadro (vista ortográfica); com quadro estreito, a largura manda. */
export const ALTURA_QUADRO = 5.6;
/** Lado do objeto do setor (o .glb é normalizado a este tamanho). */
export const TAMANHO_OBJETO = 1.1;
/** Modelos .glb mais pesados que isso caem no objeto feito de primitivas. */
export const LIMITE_TRIANGULOS = 20000;

const CHAVES = [
  ['consumo nao ciclico', 'consumo-nao-ciclico'],
  ['consumo ciclico', 'consumo-ciclico'],
  ['financeiro', 'financeiro'],
  ['utilidade publica', 'utilidade-publica'],
  ['bens industriais', 'bens-industriais'],
  ['materiais basicos', 'materiais-basicos'],
  ['petroleo', 'petroleo'],
  ['saude', 'saude'],
  ['tecnologia', 'tecnologia'],
  ['comunicacoes', 'comunicacoes'],
];
export const CHAVES_SETOR = [...CHAVES.map(([, c]) => c), 'outros'];
/** Chaves com arquivo em public/modelos/setores/<chave>.glb (uma por chave de CHAVES_SETOR). */
export const GLB_DISPONIVEIS = [...CHAVES_SETOR];

/** Chave do objeto 3D pelo nome do setor (bruto da B3 ou curto da tela); desconhecido vira 'outros'. */
export function chaveDoSetor(nome) {
  const limpo = semAcento(nome);
  return CHAVES.find(([prefixo]) => limpo.startsWith(prefixo))?.[1] ?? 'outros';
}

export const urlDoGlb = (chave) => `${import.meta.env?.BASE_URL ?? '/'}modelos/setores/${chave}.glb`;

/** Ângulo entre dois pedestais vizinhos do anel de n. */
export const passoDoAnel = (n) => (n > 0 ? TAU / n : 0);

/** Rotação do disco que põe o pedestal de índice `indice` na frente (virado para a câmera). */
export function anguloDaFrente(indice, n) {
  return indice * passoDoAnel(n);
}

/**
 * Posição (x, z) do pedestal de índice i no anel de n, com o raio dado. Índice 0 na frente; o setor seguinte da
 * lista fica à DIREITA do da frente (visto pela câmera), então "Próximo setor" o traz da direita. O disco gira com
 * rotation.y = -psi (ver cenaSetores).
 */
export function posicaoDoPedestal(i, n, raio = RAIO_ANEL) {
  const a = i * passoDoAnel(n);
  return { x: raio * Math.sin(a), z: raio * Math.cos(a) };
}

/** Índice do pedestal que está na frente para a rotação psi (arredonda para o mais próximo, com volta). */
export function indiceDaFrente(psi, n) {
  if (!(n > 0)) return 0;
  const k = Math.round(psi / passoDoAnel(n));
  return ((k % n) + n) % n;
}

/** Diferença de ângulo pelo menor caminho, entre -π e π. */
export function menorDelta(de, para) {
  const d = (((para - de) % TAU) + TAU) % TAU;
  return d > Math.PI ? d - TAU : d;
}

/** Nova rotação para pôr o índice na frente, andando pelo menor caminho a partir de `atual` (contínua, sem saltar voltas). */
export function alvoDoGiro(atual, indice, n) {
  return atual + menorDelta(atual, anguloDaFrente(indice, n));
}

/** Rotação em que a vitrine encaixa: o pedestal mais próximo da frente. */
export function encaixe(psi, n) {
  return alvoDoGiro(psi, indiceDaFrente(psi, n), n);
}

/** Índice do setor anterior (passo -1) ou seguinte (passo 1), com volta nas pontas. */
export function proximoIndice(atual, passo, n) {
  if (!(n > 0)) return 0;
  return (((atual + passo) % n) + n) % n;
}

/**
 * Um pedestal por setor, na ordem recebida (a da lista).
 * media, subiram e n vêm do setor; ausente vira null, nunca 0.
 * sinal: 'alta' | 'queda' | 'estavel' (sem dado vira 'estavel', com vazio true).
 * Devolve [{ setor, chave, sinal, media, subiram, n, vazio }].
 */
export function colunasDosSetores(setores = []) {
  return (setores ?? []).map((s) => {
    const media = Number.isFinite(s?.media) ? s.media : null;
    return {
      setor: s?.setor ?? null,
      chave: chaveDoSetor(s?.setor),
      sinal: sinalDaVariacao(media),
      media,
      subiram: Number.isFinite(s?.subiram) ? s.subiram : null,
      n: Number.isFinite(s?.n) ? s.n : null,
      vazio: media == null,
    };
  });
}
