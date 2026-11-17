import { flushSync } from 'react-dom';

/**
 * Movimento reduzido efetivo para o JS (palcos 3D, rolagem, contagens, gráficos).
 *
 * O PreferenciasProvider põe `data-movimento` na raiz ('reduzido' ou 'livre'), já com a
 * preferência do site e a do sistema combinadas. Sem o atributo (testes, antes do provider),
 * vale a preferência do sistema operacional.
 */
export function movimentoReduzido() {
  try {
    if (typeof document !== 'undefined' && document.documentElement.dataset.movimento) {
      return document.documentElement.dataset.movimento === 'reduzido';
    }
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  } catch {
    return false;
  }
}

/**
 * Troca de estado com transição de vista quando o navegador tem a API e não há pedido de pouco movimento.
 * O flushSync faz o React aplicar a troca inteira dentro do snapshot novo; quem troca pela URL passa
 * `flushSync: true` ao roteador, senão o quadro novo sai igual ao antigo. Sem a API (jsdom, navegadores
 * antigos) ou com movimento reduzido, a troca acontece direto, sem animação.
 * `tipo` (ex.: 'suave') põe `data-transicao` na raiz durante a transição: o movimento.css troca a animação
 * da página inteira (a das rotas desliza) por um crossfade curto só nessa troca.
 */
/**
 * Rola só o necessário para `elemento` começar logo abaixo de `barra` (fixa no alto). Se ele já está visível
 * abaixo dela, a página fica onde está.
 */
export function rolarParaBaixoDe(elemento, barra) {
  if (!elemento || !barra) return;
  const folga = parseFloat(getComputedStyle(elemento).marginTop) || 0;
  const distancia = elemento.getBoundingClientRect().top - barra.getBoundingClientRect().bottom - folga;
  if (distancia < 0) window.scrollBy({ top: distancia, behavior: 'instant' });
}

let ultimaTransicao = null;

export function trocarComTransicao(fn, tipo = null) {
  const temVista = typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
  if (movimentoReduzido() || !temVista) {
    fn();
    return;
  }
  const raiz = document.documentElement;
  if (tipo) raiz.dataset.transicao = tipo;
  // a navegação do roteador termina depois de alguns microtasks: espera antes de o quadro novo ser capturado
  const transicao = document.startViewTransition(async () => {
    flushSync(fn);
    await new Promise((pronto) => setTimeout(pronto));
  });
  ultimaTransicao = transicao;
  // numa troca rápida, a transição anterior termina primeiro: só a última limpa a marca
  if (tipo) {
    transicao?.finished?.finally?.(() => {
      if (ultimaTransicao === transicao) delete raiz.dataset.transicao;
    });
  }
}
