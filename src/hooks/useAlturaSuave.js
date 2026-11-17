import { useLayoutEffect, useRef } from 'react';
import { movimentoReduzido } from '../lib/movimento.js';

const DURACAO = 280;
const CURVA = 'cubic-bezier(0.16,1,0.3,1)';

/**
 * Anima a altura do elemento quando `dependencia` muda (lista que abre ou recolhe).
 * O conteúdo novo já está no DOM; a animação só leva a altura de uma medida à outra, com overflow oculto
 * enquanto roda. Não anima na montagem. Sem Web Animations (jsdom) ou com movimento reduzido, não faz nada.
 */
export function useAlturaSuave(ref, dependencia) {
  const alturaAnterior = useRef(null);
  const animacao = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // com animação em curso, a altura visível é a do quadro atual; cancela para medir a altura final
    let antes = alturaAnterior.current;
    if (animacao.current) {
      antes = el.getBoundingClientRect().height;
      animacao.current.cancel();
      animacao.current = null;
    }
    const depois = el.getBoundingClientRect().height;
    alturaAnterior.current = depois;

    if (antes == null || antes === depois) return;
    if (movimentoReduzido() || typeof el.animate !== 'function') return;

    const overflowAnterior = el.style.overflow;
    el.style.overflow = 'hidden';
    const anim = el.animate([{ height: `${antes}px` }, { height: `${depois}px` }], { duration: DURACAO, easing: CURVA });
    const fim = () => {
      el.style.overflow = overflowAnterior;
      if (animacao.current === anim) animacao.current = null;
    };
    anim.onfinish = fim;
    anim.oncancel = fim;
    animacao.current = anim;
  }, [ref, dependencia]);

  // desmonte: para a animação em curso
  useLayoutEffect(
    () => () => {
      if (animacao.current) animacao.current.cancel();
      animacao.current = null;
    },
    [],
  );
}
