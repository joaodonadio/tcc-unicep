import { Link } from 'react-router-dom';
import { useMinhaLista, usePreferencias } from '../../context/contextos.js';
import { useSeries } from '../../hooks/useDados.js';
import { useDetalhes } from '../../hooks/useDetalhes.js';
import { brl } from '../../lib/formato.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { MiniGrafico } from '../graficos/MiniGrafico.jsx';
import { BotaoDetalhes, PainelDetalhes } from '../ui/Detalhes.jsx';
import { Linhas } from '../ui/Estados.jsx';
import Mascote from '../ui/Mascote.jsx';
import { Variacao } from './Variacao.jsx';

/** No máximo 5 ações: são 5 séries de 1 mês, no mesmo cache das outras telas. */
const MAX_ITENS = 5;
const JANELA_MINI = '1m';
const ALTURA_MINI = 32;
/** Linha neutra: a cor de alta e queda fica só na variação do dia, ao lado. */
const COR_MINI = 'var(--cor-serie-1)';

/** Frase da mini linha com o primeiro e o último fechamento; com menos de 2, sem frase (o gráfico não aparece). */
function descreverMini(ticker, fechamento) {
  const finitos = fechamento.filter((v) => Number.isFinite(v));
  if (finitos.length < 2) return undefined;
  return TEXTOS.hoje.mini.acao(ticker, brl(finitos[0]), brl(finitos[finitos.length - 1]));
}

/**
 * Minha lista: até cinco ações guardadas, cada uma com a mini linha do último mês e a variação do dia
 * (de data.acoes_pregao). Vazia, uma frase curta; como guardar e os nomes ficam no painel.
 */
export function ResumoMinhaLista({ acoes, carregando = false }) {
  const { nivel } = usePreferencias();
  const detalhes = useDetalhes();
  const { tickers } = useMinhaLista();
  const guardados = tickers.slice(0, MAX_ITENS);
  const series = useSeries(guardados, JANELA_MINI);
  const itens = guardados.map((ticker, i) => {
    const acao = (acoes ?? []).find((a) => a.ticker === ticker) ?? null;
    return {
      ticker,
      nome: acao?.nome ?? null,
      variacao: acao?.variacao_dia ?? null,
      achou: Boolean(acao),
      fechamento: series[i]?.valores?.fechamento ?? [],
    };
  });
  const titulo = porNivel(TEXTOS.hoje.minhaListaTitulo, nivel);

  let conteudo;
  if (carregando) {
    conteudo = <Linhas quantidade={2} />;
  } else if (itens.length === 0) {
    conteudo = (
      <div className="hoje-vazio-linha">
        <Mascote humor="dormindo" className="hoje-mascote" />
        <p className="hoje-vazio">{porNivel(TEXTOS.hoje.minhaListaVazia, nivel)}</p>
      </div>
    );
  } else {
    conteudo = (
      <ul className="hoje-lista">
        {itens.map((item) => (
          <li key={item.ticker} className="hoje-guardada">
            <Link className="hoje-link" to={`/acao/${item.ticker}`}>
              {item.ticker}
            </Link>
            <MiniGrafico
              tipo="area"
              valores={item.fechamento}
              cor={COR_MINI}
              altura={ALTURA_MINI}
              rotulo={descreverMini(item.ticker, item.fechamento)}
            />
            {item.achou ? (
              <span className="hoje-guardada-valor">
                <Variacao valor={item.variacao} />
              </span>
            ) : (
              <span className="hoje-guardada-sem">{TEXTOS.hoje.semDadoDoPregao}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="hoje-bloco" aria-labelledby="hoje-lista-titulo">
      <div className="hoje-bloco-topo">
        <h2 id="hoje-lista-titulo" className="hoje-bloco-titulo">
          {titulo}
        </h2>
        {!carregando && <BotaoDetalhes nome={titulo} aberto={detalhes.aberto} controla={detalhes.id} onClick={detalhes.alternar} />}
      </div>
      {conteudo}
      {!carregando && (
        <PainelDetalhes id={detalhes.id} aberto={detalhes.aberto}>
          <p>{porNivel(TEXTOS.hoje.minhaListaComoGuardar, nivel)}</p>
          {itens.length > 0 && <p>{porNivel(TEXTOS.hoje.minhaListaNota, nivel)}</p>}
          {itens
            .filter((i) => i.nome)
            .map((i) => (
              <p key={i.ticker}>{TEXTOS.hoje.quemE(i.ticker, i.nome)}</p>
            ))}
        </PainelDetalhes>
      )}
      <Link className="hoje-ver" to="/acoes?filtro=minha">
        {TEXTOS.hoje.verMinhaLista}
      </Link>
    </section>
  );
}
