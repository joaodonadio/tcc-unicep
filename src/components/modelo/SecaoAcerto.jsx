import { useExperimentoHistorico } from '../../hooks/useDados.js';
import { resumoAcerto } from '../../lib/experimentoTela.js';
import { pct } from '../../lib/formato.js';
import { ROTULO_STATUS, TEXTOS } from '../../lib/textos.js';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import Mascote from '../ui/Mascote.jsx';

/**
 * "O modelo acerta?": em quantos pregões o Top 5 rendeu mais que o Ibovespa,
 * comparado com o acaso (quando o pacote traz). Sem histórico, mostra só o aviso de espera.
 */

/** Posição na régua em porcentagem (fração 0,53 -> "53%"). */
const posicao = (fracao) => `${Number((fracao * 100).toFixed(2))}%`;

function Dados({ r }) {
  const temTaxa = r.taxa != null;

  return (
    <>
      <p className="acerto-resultado">
        {temTaxa ? TEXTOS.acerto.resultado(pct(r.taxa, { casas: 0, sinal: false }), r.nDias) : ROTULO_STATUS.indisponivel}
      </p>
      {r.comparacao != null && (
        <p className="acerto-veredito">
          {r.comparacao === 'acima'
            ? TEXTOS.acerto.acimaDoAcaso
            : r.comparacao === 'abaixo'
              ? TEXTOS.acerto.abaixoDoAcaso
              : TEXTOS.acerto.dentroDoAcaso}
        </p>
      )}
      <div className="acerto-regua" aria-hidden="true">
        {r.acaso != null && (
          <span className="acerto-acaso" style={{ '--pos': posicao(r.acaso) }}>
            {TEXTOS.acerto.acaso} {pct(r.acaso, { casas: 0, sinal: false })}
          </span>
        )}
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
        // sem histórico: só o mini cartão neutro (a régua vazia repetia o que a frase já diz)
        <div className="acerto-espera">
          <Mascote humor="dormindo" className="acerto-espera__pavio" />
          <div>
            <h3>{TEXTOS.acerto.esperaTitulo}</h3>
            <p>{TEXTOS.acerto.esperaTexto}</p>
          </div>
        </div>
      ) : (
        <Dados r={r} />
      )}
    </section>
  );
}
