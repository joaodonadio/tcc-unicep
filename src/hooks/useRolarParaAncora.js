import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from './useReducedMotion.js';

/**
 * Rola até a seção indicada pelo hash da URL (ex.: #acoes). Roda ao montar,
 * quando o hash muda e quando `pronto` vira true (conteúdo já carregado, para
 * a rolagem cair no lugar certo). Respeita o movimento reduzido (preferência Animações).
 */
export function useRolarParaAncora(pronto) {
  const { hash } = useLocation();
  const reduzido = useReducedMotion();
  const reduzidoRef = useRef(reduzido);

  useEffect(() => {
    reduzidoRef.current = reduzido;
  });

  useEffect(() => {
    if (!pronto || !hash) return;
    const el = document.getElementById(hash.slice(1));
    // jsdom não implementa scrollIntoView
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: reduzidoRef.current ? 'auto' : 'smooth', block: 'start' });
    }
  }, [hash, pronto]);
}
