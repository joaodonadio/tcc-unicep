import { useEffect, useState } from 'react';
import { movimentoReduzido } from '../../lib/movimento.js';

const DURACAO_MS = 700;

const saida = (t) => 1 - Math.pow(1 - t, 4); // ease-out exponencial suave

function semMovimento() {
  try {
    return (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      movimentoReduzido()
    );
  } catch {
    return true;
  }
}

/**
 * Número que conta de 0 até o valor em ~700ms. `formatar` transforma o número em texto.
 * Valor nulo mostra `ausente` (nunca vira 0). Com reduced motion, sem matchMedia
 * (testes) ou sem requestAnimationFrame, mostra o valor final direto.
 */
export default function NumeroAnimado({ valor, formatar, ausente, className }) {
  const ausenteValor = valor === null || valor === undefined || Number.isNaN(valor);
  const [atual, setAtual] = useState(() => (semMovimento() ? valor : 0));

  useEffect(() => {
    if (ausenteValor) return undefined;
    if (semMovimento() || typeof requestAnimationFrame !== 'function') {
      setAtual(valor);
      return undefined;
    }
    let quadro;
    let inicio;
    const passo = (agora) => {
      inicio ??= agora;
      const t = Math.min((agora - inicio) / DURACAO_MS, 1);
      setAtual(valor * saida(t));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor, ausenteValor]);

  if (ausenteValor) return <span className={className}>{ausente}</span>;
  // sem animar (primeira pintura sem movimento), o valor final aparece direto
  const mostrado = semMovimento() ? valor : atual;
  return <span className={className}>{formatar(mostrado)}</span>;
}
