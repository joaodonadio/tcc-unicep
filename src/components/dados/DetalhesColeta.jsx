import { CheckCircle2, Minus, TriangleAlert } from 'lucide-react';
import { usePreferencias } from '../../context/contextos.js';
import {
  avisosDaAtualizacao,
  categoriaDoAviso,
  coletaConsultada,
  detalhesDaColeta,
  notaColeta,
  partesDoAviso,
} from '../../lib/sobreDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/** Parte de um aviso cru: código em <code>, data em <time>, o resto como texto. */
function ParteAviso({ parte }) {
  if (parte.tipo === 'codigo') return <code>{parte.valor}</code>;
  if (parte.tipo === 'data') return <time dateTime={parte.iso}>{parte.valor}</time>;
  return parte.valor;
}

/** Quadro "Como foi a coleta": se a coleta foi consultada e os horários, em duas colunas. */
export function FatosColeta({ registro, nivelSecao = 3 }) {
  const { nivel } = usePreferencias();
  const Sub = `h${nivelSecao}`;
  const { dados } = TEXTOS;
  const consultada = coletaConsultada(registro);
  const { fatos } = detalhesDaColeta(registro);

  if (consultada === null && fatos.length === 0) return null;

  return (
    <section className="dados__bloco dados__quadro" aria-labelledby="dados-coleta-fatos">
      <Sub id="dados-coleta-fatos" className="dados__subtitulo">
        {dados.secoes.fatosColeta}
      </Sub>
      {consultada !== null && (
        <p className="dados__selo-coleta" data-tom={consultada ? 'alta' : 'acento'}>
          {consultada ? <CheckCircle2 aria-hidden="true" size={18} /> : <TriangleAlert aria-hidden="true" size={18} />}
          <span>{porNivel(consultada ? dados.coleta.consultada : dados.coleta.naoConsultada, nivel)}</span>
        </p>
      )}
      {fatos.length > 0 && (
        <dl className="dados__coleta-fatos">
          {fatos.map(({ rotulo, valor }) => (
            <div key={rotulo}>
              <dt>{rotulo}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/** Quadro "Etapas da coleta", com os avisos crus agrupados e a nota da coleta (técnico para a equipe). */
export function EtapasColeta({ registro, nivelSecao = 3 }) {
  const Sub = `h${nivelSecao}`;
  const { dados } = TEXTOS;
  const brutos = avisosDaAtualizacao(registro);
  const nota = notaColeta(registro);
  const { etapas } = detalhesDaColeta(registro);

  if (etapas.length === 0 && brutos.length === 0 && nota === '') return null;

  return (
    <section className="dados__bloco dados__quadro" aria-labelledby="dados-coleta-etapas">
      <Sub id="dados-coleta-etapas" className="dados__subtitulo">
        {dados.coleta.etapasTitulo}
      </Sub>
      {etapas.length > 0 && (
        <ul className="dados__coleta-etapas">
          {etapas.map((e) => (
            <li key={e.chave} data-concluida={e.concluida}>
              {e.concluida ? <CheckCircle2 aria-hidden="true" size={14} /> : <Minus aria-hidden="true" size={14} />}
              <span>
                {e.nome}: {e.situacao}
              </span>
            </li>
          ))}
        </ul>
      )}
      {brutos.length > 0 && (
        <ul className="dados__avisos-cru">
          {brutos.map((texto, i) => (
            <li key={i}>
              <span className="dados__etiqueta">{dados.categoriasAviso[categoriaDoAviso(texto)]}</span>
              <span className="dados__aviso-texto">
                {partesDoAviso(texto).map((parte, j) => (
                  <ParteAviso key={j} parte={parte} />
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
      {nota !== '' && <p className="dados__nota">{nota}</p>}
    </section>
  );
}
