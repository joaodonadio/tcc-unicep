import { useExperimentoHistorico } from '../../hooks/useDados.js';
import { resumoAcerto } from '../../lib/experimentoTela.js';
import { pct } from '../../lib/formato.js';
import { ROTULO_STATUS, TEXTOS } from '../../lib/textos.js';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';

/**
 * "O modelo acerta?": em quantos pregões o Top 5 rendeu mais que o Ibovespa,
 * comparado com o acaso (50%). Sem histórico, mostra a espera e a régua do acaso.
 */

const ACASO_PADRAO = 0.5;

/** Posição na régua em porcentagem (fração 0,53 -> "53%"). */
const posicao = (fracao) => `${Number((fracao * 100).toFixed(2))}%`;

function Dados({ r }) {
  const temTaxa = r.taxa != null;

  return (
    <>
      <p className="acerto-resultado">
        {temTaxa ? TEXTOS.acerto.resultado(pct(r.taxa, { casas: 0, sinal: false }), r.nDias) : ROTULO_STATUS.indisponivel}
      </p>
      {r.acimaDoAcaso != null && (
        <p className="acerto-veredito">
          {r.acimaDoAcaso ? TEXTOS.acerto.acimaDoAcaso : TEXTOS.acerto.abaixoDoAcaso}
        </p>
      )}
      <div className="acerto-regua" aria-hidden="true">
        <span className="acerto-acaso" style={{ '--pos': posicao(r.acaso) }}>
          {TEXTOS.acerto.acaso} {pct(r.acaso, { casas: 0, sinal: false })}
        </span>
        {temTaxa && (
          <span className="acerto-modelo" style={{ '--pos': posicao(r.taxa) }}>
            {TEXTOS.acerto.modelo} {pct(r.taxa, { casas: 0, sinal: false })}
          </span>
        )}
      </div>
    </>
  );
}

export default function SecaoAcerto({ nivelTitulo = 2 }) {
  const Titulo = `h${nivelTitulo}`;
  const { data: historico, isError, isPending, refetch } = useExperimentoHistorico();
  const r = resumoAcerto(historico);

  return (
    <section id="acerto" className="secao acerto" aria-labelledby="acerto-titulo">
      <Titulo id="acerto-titulo" className="acerto-titulo">
        {TEXTOS.acerto.titulo}
      </Titulo>
      <p className="acerto-intro">{TEXTOS.acerto.intro}</p>

      {isError ? (
        <BlocoErro titulo={TEXTOS.acerto.titulo} mensagem={TEXTOS.acerto.erro} onTentarNovamente={refetch} />
      ) : isPending ? (
        <div role="status">
          <span className="sr-only">{TEXTOS.estados.carregando}</span>
          <Linhas quantidade={2} larguras={['70%', '48%']} />
        </div>
      ) : r.estado === 'sem_dados' ? (
        <>
          <div className="estado estado--vazio">
            <h3>{TEXTOS.acerto.esperaTitulo}</h3>
            <p>{TEXTOS.acerto.esperaTexto}</p>
          </div>
          <div className="acerto-regua" aria-hidden="true">
            <span className="acerto-acaso" style={{ '--pos': posicao(ACASO_PADRAO) }}>
              {TEXTOS.acerto.acaso} {pct(ACASO_PADRAO, { casas: 0, sinal: false })}
            </span>
          </div>
        </>
      ) : (
        <Dados r={r} />
      )}
    </section>
  );
}
