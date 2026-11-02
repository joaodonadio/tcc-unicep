import { Fragment, useRef } from 'react';
import { Info, Monitor, Database, Calculator, FlaskConical } from 'lucide-react';
import { TEXTOS } from '../../lib/textos.js';
import { useEmVista } from './useEmVista.js';

const ICONES = { interface: Monitor, coleta: Database, processamento: Calculator, modelo: FlaskConical };
const ORDEM = ['interface', 'coleta', 'processamento', 'modelo'];

/** Ilustração em camadas: a interface é a ponta clara acima da água; o resto do trabalho fica abaixo. */
function Estratos({ camadas }) {
  return (
    <div className="estratos" aria-hidden="true">
      {ORDEM.map((chave, i) => {
        const Icone = ICONES[chave];
        return (
          <Fragment key={chave}>
            <div className="estrato" data-camada={chave} style={{ '--i': i }}>
              <div className="estrato__corpo">
                <Icone size={18} strokeWidth={2} />
                <span>{camadas[chave]}</span>
              </div>
            </div>
            {i === 0 && <span className="estratos__agua" />}
          </Fragment>
        );
      })}
    </div>
  );
}

/** Abertura da página: deixa claro que esta tela é a interface de um projeto maior. */
export default function Abertura() {
  const t = TEXTOS.modelo.abertura;
  const ref = useRef(null);
  const { visto, animar } = useEmVista(ref, 0.25);
  const [antes, depois = ''] = t.titulo.split(t.tituloAcento);

  return (
    <section
      ref={ref}
      className="secao modelo-abertura"
      aria-labelledby="modelo-abertura-titulo"
      data-visto={visto}
      data-anima={animar}
    >
      <div className="modelo-abertura__texto">
        <h2 id="modelo-abertura-titulo" className="modelo-titulo modelo-titulo--grande">
          {antes}
          <span className="modelo-titulo__acento">{t.tituloAcento}</span>
          {depois}
        </h2>
        <p className="modelo-destaque modelo-destaque--lead">{t.destaque}</p>
        <p>{t.texto}</p>
      </div>
      <Estratos camadas={t.camadas} />
      <p className="modelo-nota">
        <Info size={20} strokeWidth={2} aria-hidden="true" />
        <span>{t.fecho}</span>
      </p>
    </section>
  );
}
