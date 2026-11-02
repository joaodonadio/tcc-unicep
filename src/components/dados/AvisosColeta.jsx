import { CheckCircle2, ChevronDown, Info, TriangleAlert } from 'lucide-react';
import { usePreferencias } from '../../context/contextos.js';
import {
  avisosDaAtualizacao,
  categoriaDoAviso,
  coletaConsultada,
  notaColeta,
  partesDoAviso,
  resumoAvisos,
} from '../../lib/sobreDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/** Parte de um aviso cru: código em <code>, data em <time>, o resto como texto. */
function ParteAviso({ parte }) {
  if (parte.tipo === 'codigo') return <code>{parte.valor}</code>;
  if (parte.tipo === 'data') return <time dateTime={parte.iso}>{parte.valor}</time>;
  return parte.valor;
}

/**
 * Avisos da coleta. No simples: frases curtas em português, com os textos crus recolhidos.
 * No técnico: a lista crua, aberta. Não é lista de erros.
 */
export default function AvisosColeta({ registro, nivelSecao = 2 }) {
  const { nivel } = usePreferencias();
  const Sub = `h${nivelSecao}`;
  const { dados } = TEXTOS;
  const tecnico = nivel === 'tecnico';

  const brutos = avisosDaAtualizacao(registro);
  const nota = notaColeta(registro);
  const consultada = coletaConsultada(registro);
  const cruDentro = brutos.length > 0 || nota !== '' || consultada !== null;

  return (
    <section className="dados__bloco" aria-labelledby="dados-avisos">
      <Sub id="dados-avisos" className="dados__subtitulo">
        {dados.secoes.avisos}
      </Sub>

      {tecnico ? (
        brutos.length === 0 && <p>{dados.avisosResumo.nenhum}</p>
      ) : (
        <ul className="dados__avisos">
          {resumoAvisos(registro).map((frase) => (
            <li key={frase}>
              <Info aria-hidden="true" size={18} className="dados__icone" />
              <span>{frase}</span>
            </li>
          ))}
        </ul>
      )}

      {cruDentro && (
        <details className="dados__detalhes" open={tecnico}>
          <summary>
            {dados.detalhesTecnicos}
            <ChevronDown aria-hidden="true" size={18} />
          </summary>
          {consultada !== null && (
            <p className="dados__selo-coleta" data-tom={consultada ? 'alta' : 'acento'}>
              {consultada ? (
                <CheckCircle2 aria-hidden="true" size={18} />
              ) : (
                <TriangleAlert aria-hidden="true" size={18} />
              )}
              <span>{porNivel(consultada ? dados.coleta.consultada : dados.coleta.naoConsultada, nivel)}</span>
            </p>
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
        </details>
      )}
    </section>
  );
}
