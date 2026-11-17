import { Fragment, useRef } from 'react';
import { Ban, GraduationCap, Newspaper, Ruler, Target } from 'lucide-react';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import Mascote from '../ui/Mascote.jsx';
import { usePreferencias } from '../../context/contextos.js';
import { useExperimentoHistorico } from '../../hooks/useDados.js';
import { pct } from '../../lib/formato.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import MaquinaModelo from './MaquinaModelo.jsx';
import { useEmVista } from './useEmVista.js';

const ICONES = { preve: Target, le: Newspaper, aprende: GraduationCap, acerta: Ruler, naoE: Ban };

/** Posição na régua em porcentagem (fração 0,5 -> "50%"). */
const posicao = (fracao) => `${Number((fracao * 100).toFixed(2))}%`;

/** Texto em partes: pedaço de texto puro ou { termo, texto } que vira botão do glossário. */
function Partes({ partes }) {
  const lista = Array.isArray(partes) ? partes : [partes];
  return lista.map((parte, i) =>
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
  const { data: historico } = useExperimentoHistorico();
  const acaso = historico?.resumo?.acasoMedia;
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

      <div className="modelo-guia">
        <Mascote humor="pensativo" className="modelo-guia__pavio" />
        <p>{porNivel(t.guia, nivel)}</p>
      </div>

      <div className="modelo-cartoes" ref={cartoes} data-visto={visto}>
        {t.cartoes.map((c, i) => {
          const Icone = ICONES[c.chave];
          return (
            <article
              key={c.chave}
              className="modelo-cartao"
              data-cartao={c.chave}
              data-brilho={c.chave === 'naoE' ? 'acento' : 'lavanda'}
              style={{ '--i': i }}
            >
              <span className="modelo-cartao__icone" aria-hidden="true">
                <Icone size={18} strokeWidth={2} />
              </span>
              <h3 className="modelo-cartao__titulo">{c.titulo}</h3>
              {c.itens ? (
                <ul className="modelo-chips">
                  {porNivel(c.itens, nivel).map((item) => (
                    <li key={item} className="modelo-chip">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="modelo-cartao__texto">
                  <Partes partes={porNivel(c.texto, nivel)} />
                </p>
              )}
              {c.pilula && <p className="modelo-pilula">{porNivel(c.pilula, nivel)}</p>}
              {c.regua && Number.isFinite(acaso) && (
                <div className="modelo-regua" aria-hidden="true" style={{ '--pos': posicao(acaso) }}>
                  <span className="modelo-regua__marca" />
                  <span className="modelo-regua__rotulo">{TEXTOS.acerto.acaso} {pct(acaso, { casas: 0, sinal: false })}</span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
