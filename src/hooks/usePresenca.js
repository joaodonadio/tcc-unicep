import { useEffect, useState } from 'react';
import { movimentoReduzido } from '../lib/movimento.js';

/** Tempo da saída dos painéis (ms): acompanha --duracao-saida (160ms), um pouco mais curto. */
export const SAIDA_PAINEL_MS = 140;

/**
 * Mantém o painel no DOM até o fim da saída. Aberto, devolve true na hora; ao fechar, continua true
 * por SAIDA_PAINEL_MS (para a animação de saída rodar) e depois false. Com movimento reduzido, fecha direto.
 */
export function usePresenca(aberto) {
  const [presente, setPresente] = useState(aberto);

  useEffect(() => {
    if (aberto) {
      setPresente(true);
      return undefined;
    }
    if (movimentoReduzido()) {
      setPresente(false);
      return undefined;
    }
    const fim = setTimeout(() => setPresente(false), SAIDA_PAINEL_MS);
    return () => clearTimeout(fim);
  }, [aberto]);

  return presente || aberto;
}
