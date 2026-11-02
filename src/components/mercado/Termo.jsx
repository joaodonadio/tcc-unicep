import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { EXPLICACOES } from '../../lib/explicacoes.js';

/** Sublinha o termo com o glossário quando existe explicação para a chave; senão mostra o texto puro. */
export function Termo({ chave, children }) {
  if (!chave || !EXPLICACOES[chave]) return children;
  return <BotaoTermo chave={chave}>{children}</BotaoTermo>;
}
