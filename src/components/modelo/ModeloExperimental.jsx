import { Fragment, useRef } from 'react';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import MaquinaModelo from './MaquinaModelo.jsx';
import { useEmVista } from './useEmVista.js';

/** Texto em partes: pedaço de texto puro ou { termo, texto } que vira botão do glossário. */
function Partes({ partes }) {
  return partes.map((parte, i) =>
    typeof parte === 'string' ? (
      <Fragment key={i}>{parte}</Fragment>
    ) : (
      <BotaoTermo key={i} chave={parte.termo}>
        {parte.texto}
      </BotaoTermo>
    ),
  );
}

/** O que o modelo prevê, lê, como aprende e o que não é, com um diagrama de entradas até o Top 5. */
export default function ModeloExperimental() {
  const t = TEXTOS.modelo.experimento;
  const { nivel } = usePreferencias();
  const cartoes = useRef(null);
  const { visto } = useEmVista(cartoes, 0.15);

  return (
    <section className="secao modelo-experimento" aria-labelledby="modelo-experimento-titulo">
      <h2 id="modelo-experimento-titulo" className="modelo-titulo">
        {t.titulo}
      </h2>
      <p className="modelo-destaque">{porNivel(t.intro, nivel)}</p>

      <MaquinaModelo diagrama={t.diagrama} />

      <ol className="diagrama sr-only" aria-label={t.diagramaRotulo}>
        {t.diagrama.map((no) => (
          <li key={no.chave} className="diagrama__no" data-no={no.chave}>
            <span className="diagrama__nome">{no.nome}</span>
            <ul className="diagrama__itens">
              {no.itens.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className="modelo-cartoes" ref={cartoes} data-visto={visto}>
        {t.cartoes.map((c, i) => (
          <article
            key={c.chave}
            className="modelo-cartao"
            data-cartao={c.chave}
            data-brilho={c.chave === 'naoE' ? 'acento' : 'lavanda'}
            style={{ '--i': i }}
          >
            <h3 className="modelo-cartao__titulo">{c.titulo}</h3>
            <p className="modelo-cartao__texto">
              <Partes partes={porNivel(c.texto, nivel)} />
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
