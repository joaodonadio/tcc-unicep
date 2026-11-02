import { Link } from 'react-router-dom';
import { useAgendaProventos } from '../../hooks/useAgenda.js';
import { usePreferencias } from '../../context/contextos.js';
import { ROTULO_STATUS, TEXTOS, porNivel } from '../../lib/textos.js';
import { Linhas } from '../ui/Estados.jsx';
import { TextoComTermo } from '../ui/TextoComTermo.jsx';

const MAX_PROXIMOS = 3;

/** Os próximos pagamentos de proventos (três primeiros da agenda), com link para a agenda completa. */
export function ResumoProventos() {
  const { nivel } = usePreferencias();
  const { data, isPending, isError } = useAgendaProventos();
  const proximos = (data?.futuros ?? []).slice(0, MAX_PROXIMOS);

  let conteudo;
  if (isPending) {
    conteudo = <Linhas quantidade={3} />;
  } else if (isError) {
    conteudo = <p className="hoje-vazio">{ROTULO_STATUS.indisponivel}</p>;
  } else if (proximos.length === 0) {
    conteudo = <p className="hoje-vazio">{porNivel(TEXTOS.hoje.proventosVazio, nivel)}</p>;
  } else {
    conteudo = (
      <ul className="hoje-lista">
        {proximos.map((ev) => (
          <li key={ev.id} className="hoje-linha">
            <span className="hoje-linha-rotulo">{ev.dia}</span>
            <Link className="hoje-link" to={`/acao/${ev.ticker}?pergunta=proventos`}>
              {ev.ticker}
            </Link>
            <span className="hoje-linha-empresa">{ev.tipo_rotulo}</span>
            <span className="hoje-linha-valor">{ev.valor_texto || ROTULO_STATUS.indisponivel}</span>
          </li>
        ))}
      </ul>
    );
  }
  const legenda =
    !isPending && !isError && proximos.length > 0 ? (
      <p className="hoje-nota">
        <TextoComTermo chave="data_com" texto={TEXTOS.hoje.legendaProventos} />
      </p>
    ) : null;

  return (
    <section className="hoje-bloco" aria-labelledby="hoje-proventos-titulo">
      <h2 id="hoje-proventos-titulo" className="hoje-bloco-titulo">
        {porNivel(TEXTOS.hoje.proventosTitulo, nivel)}
      </h2>
      {conteudo}
      {legenda}
      <Link className="hoje-ver" to="/proventos">
        {TEXTOS.hoje.verProventos}
      </Link>
    </section>
  );
}
