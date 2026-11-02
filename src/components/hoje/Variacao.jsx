import { pct } from '../../lib/formato.js';
import { direcaoDe } from '../../lib/mapaPregao.js';
import { TEXTOS } from '../../lib/textos.js';

/**
 * Variação do dia com sinal, colorida pela direção. Abaixo do módulo de estabilidade
 * mostra "estável". Ausência de valor não mostra nada (nunca 0).
 */
export function Variacao({ valor }) {
  const direcao = direcaoDe(valor);
  if (!direcao) return null;
  const texto = direcao === 'flat' ? TEXTOS.hoje.estavel : pct(valor);
  return (
    <span className="hoje-var" data-sinal={direcao}>
      {texto}
    </span>
  );
}
