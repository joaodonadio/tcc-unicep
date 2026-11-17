import { pct } from '../../lib/formato.js';
import { direcaoDe } from '../../lib/mapaPregao.js';
import { variacaoDiaSuspeita } from '../../lib/crivel.js';
import { TEXTOS } from '../../lib/textos.js';
import { SeloRevisao } from '../ui/SeloRevisao.jsx';

/**
 * Variação do dia com sinal, colorida pela direção. Abaixo do módulo de estabilidade
 * mostra "estável". Ausência de valor não mostra nada (nunca 0). Variação impossível
 * no dia (grupamento não ajustado) mostra o selo "mudou de escala".
 */
export function Variacao({ valor }) {
  if (variacaoDiaSuspeita(valor)) return <SeloRevisao compacto />;
  const direcao = direcaoDe(valor);
  if (!direcao) return null;
  const texto = direcao === 'flat' ? TEXTOS.hoje.estavel : pct(valor);
  return (
    <span className="hoje-var" data-sinal={direcao}>
      {texto}
    </span>
  );
}
