import { Link } from 'react-router-dom';
import { useMinhaLista } from '../../context/contextos.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { Linhas } from '../ui/Estados.jsx';
import { Variacao } from './Variacao.jsx';

const MAX_ITENS = 5;

/**
 * Minha lista: até cinco ações guardadas, com nome e variação do dia vindos de
 * data.acoes_pregao. `acoes` é essa lista do pregão.
 */
export function ResumoMinhaLista({ acoes, carregando = false }) {
  const { nivel } = usePreferencias();
  const { tickers } = useMinhaLista();
  const itens = tickers.slice(0, MAX_ITENS).map((ticker) => {
    const acao = (acoes ?? []).find((a) => a.ticker === ticker) ?? null;
    return { ticker, nome: acao?.nome ?? null, variacao: acao?.variacao_dia ?? null, achou: Boolean(acao) };
  });

  let conteudo;
  if (carregando) {
    conteudo = <Linhas quantidade={2} />;
  } else if (itens.length === 0) {
    conteudo = <p className="hoje-vazio">{porNivel(TEXTOS.hoje.minhaListaVazia, nivel)}</p>;
  } else {
    conteudo = (
      <ul className="hoje-lista">
        {itens.map((item) => (
          <li key={item.ticker} className="hoje-linha">
            <Link className="hoje-link" to={`/acao/${item.ticker}`}>
              {item.ticker}
            </Link>
            {item.achou ? (
              <>
                {item.nome && <span className="hoje-linha-empresa">{item.nome}</span>}
                <span className="hoje-linha-valor">
                  <Variacao valor={item.variacao} />
                </span>
              </>
            ) : (
              <span className="hoje-linha-empresa">{TEXTOS.hoje.semDadoDoPregao}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="hoje-bloco" aria-labelledby="hoje-lista-titulo">
      <h2 id="hoje-lista-titulo" className="hoje-bloco-titulo">
        {porNivel(TEXTOS.hoje.minhaListaTitulo, nivel)}
      </h2>
      {conteudo}
      <Link className="hoje-ver" to="/acoes?filtro=minha">
        {TEXTOS.hoje.verMinhaLista}
      </Link>
    </section>
  );
}
