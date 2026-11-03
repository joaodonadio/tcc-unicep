import { Link } from 'react-router-dom';
import { useAgendaProventos } from '../../hooks/useAgenda.js';
import { useDetalhes } from '../../hooks/useDetalhes.js';
import { linhaDoTempo } from '../../lib/hoje.js';
import { usePreferencias } from '../../context/contextos.js';
import { ROTULO_STATUS, TEXTOS, porNivel } from '../../lib/textos.js';
import { BotaoDetalhes, PainelDetalhes } from '../ui/Detalhes.jsx';
import { Linhas } from '../ui/Estados.jsx';
import { TextoComTermo } from '../ui/TextoComTermo.jsx';

const MAX_PROXIMOS = 3;

/** Linha do tempo decorativa (hoje à esquerda, um ponto por data); a frase sr-only diz o mesmo. */
function LinhaDoTempo({ tempo, quantidade }) {
  return (
    <div className="hoje-tempo">
      <div className="hoje-tempo-trilho" aria-hidden="true">
        <span className="hoje-tempo-hoje" />
        {tempo.pontos.map((p) => (
          <span
            key={p.data}
            className="hoje-tempo-ponto"
            data-varios={p.tickers.length > 1 ? 'true' : undefined}
            style={{ '--posicao': p.posicao }}
          />
        ))}
      </div>
      <div className="hoje-tempo-rotulos" aria-hidden="true">
        <span>{TEXTOS.hoje.tempoHoje}</span>
        <span>{TEXTOS.hoje.tempoAte(tempo.ate)}</span>
      </div>
      <p className="sr-only">{TEXTOS.hoje.tempoDescricao(quantidade, tempo.ate)}</p>
    </div>
  );
}

/**
 * Os próximos pagamentos de proventos (três primeiros da agenda): linha do tempo a partir de hoje
 * e lista compacta (data, ticker, valor). Tipo e data-com de cada um ficam no painel de detalhes.
 */
export function ResumoProventos() {
  const { nivel } = usePreferencias();
  const detalhes = useDetalhes();
  const { data, hoje, isPending, isError } = useAgendaProventos();
  const proximos = (data?.futuros ?? []).slice(0, MAX_PROXIMOS);
  const tempo = linhaDoTempo(proximos, hoje);
  const titulo = porNivel(TEXTOS.hoje.proventosTitulo, nivel);
  const comPainel = !isPending && !isError && proximos.length > 0;

  let conteudo;
  if (isPending) {
    conteudo = <Linhas quantidade={3} />;
  } else if (isError) {
    conteudo = <p className="hoje-vazio">{ROTULO_STATUS.indisponivel}</p>;
  } else if (proximos.length === 0) {
    conteudo = <p className="hoje-vazio">{porNivel(TEXTOS.hoje.proventosVazio, nivel)}</p>;
  } else {
    conteudo = (
      <>
        {tempo && <LinhaDoTempo tempo={tempo} quantidade={proximos.length} />}
        <ul className="hoje-lista">
          {proximos.map((ev) => (
            <li key={ev.id} className="hoje-linha hoje-linha--compacta">
              <span className="hoje-linha-rotulo hoje-linha-rotulo--numero">{ev.dia}</span>
              <Link className="hoje-link" to={`/acao/${ev.ticker}?pergunta=proventos`}>
                {ev.ticker}
              </Link>
              <span className="hoje-linha-valor hoje-linha-valor--numero">{ev.valor_texto || ROTULO_STATUS.indisponivel}</span>
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <section className="hoje-bloco" data-brilho="alta" aria-labelledby="hoje-proventos-titulo">
      <div className="hoje-bloco-topo">
        <h2 id="hoje-proventos-titulo" className="hoje-bloco-titulo">
          {titulo}
        </h2>
        {comPainel && <BotaoDetalhes nome={titulo} aberto={detalhes.aberto} controla={detalhes.id} onClick={detalhes.alternar} />}
      </div>
      {conteudo}
      {comPainel && (
        <PainelDetalhes id={detalhes.id} aberto={detalhes.aberto}>
          <p>
            <TextoComTermo chave="data_com" texto={TEXTOS.hoje.legendaProventos} />
          </p>
          {proximos.map((ev) => (
            <p key={ev.id}>{TEXTOS.hoje.proventoDetalhe(ev.ticker, ev.tipo_rotulo, ev.data_com_texto || null)}</p>
          ))}
        </PainelDetalhes>
      )}
      <Link className="hoje-ver" to="/proventos">
        {TEXTOS.hoje.verProventos}
      </Link>
    </section>
  );
}
