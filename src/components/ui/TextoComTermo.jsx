import { BotaoTermo } from './BotaoTermo.jsx';

/** Frase com um termo do glossário no meio: `texto` é {antes, termo, depois}. */
export function TextoComTermo({ chave, texto }) {
  return (
    <>
      {texto.antes}
      <BotaoTermo chave={chave}>{texto.termo}</BotaoTermo>
      {texto.depois}
    </>
  );
}
