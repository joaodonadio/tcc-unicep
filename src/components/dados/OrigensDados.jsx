import { Cpu, Database, Download } from 'lucide-react';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const ORIGENS = [
  { chave: 'coleta', Icone: Download, brilho: 'dado' },
  { chave: 'processamento', Icone: Cpu, brilho: 'aco' },
  { chave: 'api', Icone: Database, brilho: 'lavanda' },
];

/** Por onde os dados passam: coleta, processamento e a API, que é a única fonte do site. */
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
      <ul className="dados__origens entra-cartoes">
        {ORIGENS.map((item) => {
          const { chave, brilho } = item;
          const Icone = item.Icone;
          const origem = dados.origens[chave];
          return (
            <li className="dados__mini" data-brilho={brilho} key={chave}>
              <span className="dados__mini-icone">
                <Icone aria-hidden="true" size={20} />
              </span>
              <Cabeca className="dados__mini-titulo">
                {origem.titulo}
              </Cabeca>
              <p>{porNivel(origem.texto, nivel)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
