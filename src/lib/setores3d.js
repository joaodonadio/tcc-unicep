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
 * Pose do Cotinha ao lado da vitrine, pelo sinal do setor da frente (função pura, sem three).
 * bracos: ângulos (rad) do braço esquerdo e do direito; encolhe: fração do corpo que some em altura;
 * inclina: rad de curvar o Cotinha para a frente; pulo: se a troca para este setor dá um pulinho.
 */
export const POSE_PAVIO_NEUTRA = Object.freeze({ bracos: [-0.35, 0.35], encolhe: 0, inclina: 0, pulo: false });
const POSES_PAVIO = {
  alta: { bracos: [-2.6, 2.6], encolhe: 0, inclina: 0, pulo: true },
  queda: { bracos: [-0.15, 0.15], encolhe: 0.12, inclina: 0.25, pulo: false },
};
/** Pose para o sinal ('alta' | 'queda' | 'estavel'); sem dado ou desconhecido, neutra. */
export function poseDoPavio(sinal) {
  return Object.hasOwn(POSES_PAVIO, sinal) ? POSES_PAVIO[sinal] : POSE_PAVIO_NEUTRA;
}

/** Pulinho do Cotinha: duração (s) e altura (unidades da cena). */
export const DURACAO_PULO = 0.5;
export const ALTURA_PULO = 0.14;
/** Altura do pulinho t segundos depois de começar (parábola); 0 antes de começar e depois de acabar. */
export function alturaDoPulo(t) {
  if (!(t > 0) || t >= DURACAO_PULO) return 0;
  const u = t / DURACAO_PULO;
  return 4 * ALTURA_PULO * u * (1 - u);
}

/** Antecipação (agacha), salto e aterrissagem (amassa), em segundos; o salto é DURACAO_PULO. */
export const DURACAO_ANTECIPA = 0.08;
export const DURACAO_POUSO = 0.1;
const AGACHA = 0.1;
const ESTICA = 0.06;
const AMASSA = 0.08;
/**
 * Forma do pulinho t segundos depois de começar: altura (unidades da cena) e escala Y do corpo (1 = normal).
 * Agacha antes de sair, estica no início do salto, volta ao normal no ar e amassa ao pousar. Fora, neutro.
 */
export function formaDoPulo(t) {
  if (!(t > 0)) return { altura: 0, escalaY: 1 };
  if (t < DURACAO_ANTECIPA) {
    const u = t / DURACAO_ANTECIPA;
    return { altura: 0, escalaY: 1 - AGACHA * (1 - Math.cos(Math.PI * u)) * 0.5 };
  }
  const ar = t - DURACAO_ANTECIPA;
  if (ar < DURACAO_PULO) {
    const u = ar / DURACAO_PULO;
    const escalaY =
      u < 0.2
        ? 1 - AGACHA + (AGACHA + ESTICA) * (u / 0.2)
        : 1 + ESTICA * (1 - (u - 0.2) / 0.8);
    return { altura: alturaDoPulo(ar), escalaY };
  }
  const pouso = ar - DURACAO_PULO;
  if (pouso < DURACAO_POUSO) {
    return { altura: 0, escalaY: 1 - AMASSA * Math.sin((Math.PI * pouso) / DURACAO_POUSO) };
  }
  return { altura: 0, escalaY: 1 };
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
