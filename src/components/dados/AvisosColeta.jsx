import Mascote from '../ui/Mascote.jsx';
import { Info } from 'lucide-react';
import { resumoAvisos } from '../../lib/sobreDados.js';
import { TEXTOS } from '../../lib/textos.js';

/**
 * Avisos da coleta: frases curtas em português, com o pavio ao lado. Os textos crus
 * ficam em "Como foi a coleta" e "Etapas da coleta", no bloco da equipe. Não é lista de erros.
 */
export default function AvisosColeta({ registro, nivelSecao = 3 }) {
  const Sub = `h${nivelSecao}`;
  const { dados } = TEXTOS;

  return (
    <section className="dados__bloco dados__quadro" aria-labelledby="dados-avisos">
      <Sub id="dados-avisos" className="dados__subtitulo">
        {dados.secoes.avisos}
      </Sub>

      <div className="dados__avisos-linha">
        <Mascote humor="atento" className="dados__avisos-pavio" />
        <ul className="dados__avisos">
          {resumoAvisos(registro).map((frase) => (
            <li key={frase}>
              <Info aria-hidden="true" size={18} className="dados__icone" />
              <span>{frase}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
