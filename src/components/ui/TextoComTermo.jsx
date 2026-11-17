import { BotaoTermo } from './BotaoTermo.jsx';

/** Pontuação logo depois do termo (vírgula, ponto...): fica colada nele, nunca começa a linha seguinte. */
const PONTUACAO_INICIAL = /^[,.;:!?)]+/;

/** Frase com um termo do glossário no meio: `texto` é {antes, termo, depois}. */
export function TextoComTermo({ chave, texto }) {
  const depois = texto.depois ?? '';
  const colada = depois.match(PONTUACAO_INICIAL)?.[0] ?? '';
  return (
    <>
      {texto.antes}
      <span className="termo-junto">
        <BotaoTermo chave={chave}>{texto.termo}</BotaoTermo>
        {colada}
      </span>
      {depois.slice(colada.length)}
    </>
  );
}
