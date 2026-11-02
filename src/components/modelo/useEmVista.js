import { useEffect, useState } from 'react';
import { movimentoReduzido } from '../../lib/movimento.js';

/** Movimento desligado: preferência Animações (ou do sistema) reduzida, ou ambiente sem matchMedia (testes). */
export function semMovimento() {
  try {
    return typeof window.matchMedia !== 'function' || movimentoReduzido();
  } catch {
    return true;
  }
}

/**
 * Acompanha se o elemento está na tela. Começa tudo visível (sem JS, sem observer ou com movimento
 * reduzido o estado final aparece completo). Com observer, `visto` fica falso até a primeira vez
 * em que o elemento entra na tela, e `animar` só é verdadeiro enquanto ele está à vista.
 */
export function useEmVista(ref, limiar = 0.2) {
  const [movimento] = useState(() => !semMovimento());
  const [estado, setEstado] = useState({ visto: true, emVista: true });

  useEffect(() => {
    const el = ref.current;
    if (!el || !movimento || typeof IntersectionObserver !== 'function') return undefined;
    setEstado({ visto: false, emVista: false });
    const obs = new IntersectionObserver(
      (entradas) => {
        const dentro = entradas.some((e) => e.isIntersecting);
        setEstado((atual) => ({ visto: atual.visto || dentro, emVista: dentro }));
      },
      { threshold: limiar },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, movimento, limiar]);

  return { visto: estado.visto, emVista: estado.emVista, animar: movimento && estado.emVista };
}
