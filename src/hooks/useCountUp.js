import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion.js';

/**
 * RF-1.2 — contador animado (~1,3s, easing cúbico), como no protótipo.
 * Com `prefers-reduced-motion` o valor final aparece de imediato.
 */
export function useCountUp(alvo, duracao = 1300) {
  const reduzir = useReducedMotion();
  const [valor, setValor] = useState(reduzir ? alvo : 0);
  const rafRef = useRef(0);

  useEffect(() => {
    const destino = Number(alvo) || 0;
    if (reduzir) {
      setValor(destino);
      return undefined;
    }

    const inicio = performance.now();
    const passo = (agora) => {
      const p = Math.min(1, (agora - inicio) / duracao);
      const eased = 1 - Math.pow(1 - p, 3);
      setValor(Math.round(destino * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(passo);
    };
    rafRef.current = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(rafRef.current);
  }, [alvo, duracao, reduzir]);

  return valor;
}
