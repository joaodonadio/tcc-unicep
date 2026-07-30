import { useEffect, useState } from 'react';

/**
 * `prefers-reduced-motion` lido em JS — os canvas (globo, orbe) congelam
 * rotação e pulsos quando o sistema operacional pede menos movimento
 * (ARQUITETURA-INTERFACE.md §4.3).
 */
export function useReducedMotion() {
  const [reduzir, setReduzir] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const aoMudar = (e) => setReduzir(e.matches);
    mq.addEventListener('change', aoMudar);
    return () => mq.removeEventListener('change', aoMudar);
  }, []);

  return reduzir;
}
