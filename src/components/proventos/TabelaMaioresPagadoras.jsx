import { Link } from 'react-router-dom';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import { pct } from '../../lib/formato.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/**
 * Ranking das ações com maior dividend yield. A barra é proporcional ao maior
 * valor e fica escondida de leitor de tela: o número já diz o mesmo.
 */
export function TabelaMaioresPagadoras({ ranking, carregando = false, erro = null, onTentarNovamente }) {
  const { nivel } = usePreferencias();
  if (erro) {
    return (
      <BlocoErro
        titulo={TEXTOS.proventos.rankingErro}
        mensagem={erro?.mensagemUsuario ?? TEXTOS.dia.erro}
        onTentarNovamente={onTentarNovamente}
      />
    );
  }

  if (carregando) {
    return (
      <div role="status">
        <p className="proventos-status">{TEXTOS.proventos.rankingCarregando}</p>
        <Linhas quantidade={5} />
      </div>
    );
  }

  if (ranking.length === 0) {
    return <p className="proventos-vazio">{porNivel(TEXTOS.proventos.rankingVazio, nivel)}</p>;
  }

  return (
    <>
      <div className="proventos-rolagem" role="region" aria-label={TEXTOS.proventos.rankingRolagem} tabIndex={0}>
        <table className="proventos-tabela">
          <caption className="sr-only">{porNivel(TEXTOS.proventos.rankingDescricao, nivel)}</caption>
          <thead>
            <tr>
              <th scope="col" className="proventos-num">
                {TEXTOS.proventos.colPosicao}
              </th>
              <th scope="col">{TEXTOS.proventos.colAcao}</th>
              <th scope="col">{TEXTOS.proventos.colEmpresa}</th>
              <th scope="col" className="proventos-num">
                <BotaoTermo chave="dividend_yield">{porNivel(TEXTOS.proventos.colDy, nivel)}</BotaoTermo>
              </th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((linha) => (
              <tr key={linha.ticker}>
                <td className="proventos-num">{linha.posicao}</td>
                <td>
                  <Link to={`/acao/${linha.ticker}?pergunta=proventos`}>{linha.ticker}</Link>
                </td>
                <td>{linha.empresa ?? TEXTOS.proventos.semEmpresa}</td>
                <td className="proventos-dy">
                  <span className="proventos-dy-valor">{pct(linha.dy, { casas: 1, sinal: false })}</span>
                  <span className="proventos-barra" aria-hidden="true">
                    <span style={{ width: `${linha.proporcao * 100}%` }} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="proventos-nota">{porNivel(TEXTOS.proventos.dyNota, nivel)}</p>
    </>
  );
}
