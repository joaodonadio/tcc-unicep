import { Building2, Landmark, Newspaper } from 'lucide-react';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const ORIGENS = [
  { chave: 'b3', Icone: Building2, termo: 'b3' },
  { chave: 'bancoCentral', Icone: Landmark },
  { chave: 'finbert', Icone: Newspaper },
];

/** De onde vem cada coisa: três cartões, um por fonte. */
export default function OrigensDados({ nivelSecao = 2 }) {
  const { nivel } = usePreferencias();
  const Sub = `h${nivelSecao}`;
  const Cabeca = `h${nivelSecao + 1}`;
  const { dados } = TEXTOS;

  return (
    <section className="dados__bloco" aria-labelledby="dados-origens">
      <Sub id="dados-origens" className="dados__subtitulo">
        {dados.secoes.origens}
      </Sub>
      <ul className="dados__grade">
        {ORIGENS.map((item) => {
          const { chave, termo } = item;
          const Icone = item.Icone;
          const origem = dados.origens[chave];
          return (
            <li className="dados__cartao" key={chave}>
              <Icone aria-hidden="true" size={22} className="dados__icone" />
              <Cabeca className="dados__cartao-titulo">
                {termo ? <BotaoTermo chave={termo}>{origem.titulo}</BotaoTermo> : origem.titulo}
              </Cabeca>
              <p>{porNivel(origem.texto, nivel)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
