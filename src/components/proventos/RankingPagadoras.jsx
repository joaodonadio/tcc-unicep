import { Link } from 'react-router-dom';
import Mascote from '../ui/Mascote.jsx';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import { pct } from '../../lib/formato.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/** Quantas ações o ranking mostra; a lista completa fica na ficha de cada ação. */
const TOPO = 5;

/**
 * Top do dividend yield em barras horizontais: ticker, barra e percentual. A barra é
 * proporcional ao maior valor e fica escondida de leitor de tela: o número já diz o mesmo.
 */
export function RankingPagadoras({ ranking, carregando = false, erro = null, onTentarNovamente }) {
  const { nivel } = usePreferencias();
  const T = TEXTOS.proventos;

  if (erro) {
    return (
      <BlocoErro
        titulo={T.rankingErro}
        mensagem={erro?.mensagemUsuario ?? TEXTOS.dia.erro}
        onTentarNovamente={onTentarNovamente}
      />
    );
  }

  if (carregando) {
    return (
      <div role="status">
        <p className="proventos-status">{T.rankingCarregando}</p>
        <Linhas quantidade={4} />
      </div>
    );
  }

  if (ranking.length === 0) {
    return <p className="proventos-vazio">{porNivel(T.rankingVazio, nivel)}</p>;
  }

  return (
    <>
      <div className="proventos-rank-topo">
        <Mascote humor="contente" className="proventos-mascote" />
        <p className="proventos-como-ler">{porNivel(T.rankingComoLer, nivel)}</p>
      </div>

      <ol className="proventos-rank entra-lista" aria-label={T.rankingRolagem}>
        {ranking.slice(0, TOPO).map((linha) => (
          <li key={linha.ticker} className="proventos-rank-item">
            <Link className="proventos-rank-ticker" to={`/acao/${linha.ticker}?pergunta=proventos`}>
              {linha.ticker}
            </Link>
            <span className="proventos-barra" aria-hidden="true">
              <span style={{ width: `${linha.proporcao * 100}%` }} />
            </span>
            <span className="num proventos-rank-valor">{pct(linha.dy, { casas: 1, sinal: false })}</span>
          </li>
        ))}
      </ol>

      <p className="proventos-rodape">{T.rankingAviso}</p>
    </>
  );
}
