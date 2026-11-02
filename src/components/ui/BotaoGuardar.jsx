import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useMinhaLista } from '../../context/contextos.js';
import { TEXTOS } from '../../lib/textos.js';

/**
 * Botão de "Guardar na minha lista". O estado vai só em aria-pressed.
 * `compacto` troca só a variante de tamanho; o texto continua o mesmo.
 */
export function BotaoGuardar({ ticker, compacto = false }) {
  const { tem, alternar } = useMinhaLista();
  const guardada = tem(ticker);
  const Icone = guardada ? BookmarkCheck : Bookmark;

  return (
    <button
      type="button"
      className={compacto ? 'botao botao-compacto' : 'botao'}
      aria-pressed={guardada}
      aria-label={TEXTOS.guardar.guardarAcao(ticker)}
      onClick={() => alternar(ticker)}
    >
      <Icone aria-hidden="true" size={16} />
      <span>{guardada ? TEXTOS.guardar.guardada : TEXTOS.guardar.guardar}</span>
    </button>
  );
}
