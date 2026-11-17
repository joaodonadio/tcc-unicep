import { useRef, useState } from 'react';
import { usePreferencias } from '../../context/contextos.js';
import { Manchete } from '../noticias/Manchete.jsx';
import { useNoticiasAcao } from '../../hooks/useDados.js';
import { dataBR, dataHoraBR, quandoPublicada } from '../../lib/datas.js';
import { pct } from '../../lib/formato.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { useAlturaSuave } from '../../hooks/useAlturaSuave.js';
import { valorOuNulo } from '../../lib/valor.js';
import { Linhas } from '../ui/Estados.jsx';

/**
 * Notícias da pergunta "O que dizem as notícias?". As manchetes do pregão da
 * ação, com o tom que o FinBERT atribuiu a cada uma. A lista vem ordenada pelo
 * destaque do pacote; acima de 10 mostra as primeiras e um botão para ver todas.
 */

const N = TEXTOS.ficha.noticias;
const T = TEXTOS.ficha.tec;
const LIMITE_INICIAL = 10;

/** Ordem do pacote: destaque crescente (1 primeiro); sem destaque vai para o fim. Empate: mais recente primeiro. */
const rankDe = (item) => (Number.isFinite(item.destaque) ? item.destaque : Number.MAX_SAFE_INTEGER);
function ordenarPorDestaque(itens) {
  return [...itens].sort(
    (a, b) => rankDe(a) - rankDe(b) || String(b.publicado_em ?? '').localeCompare(String(a.publicado_em ?? '')),
  );
}

/** Frase de contagem do pacote; sem contagem, o aviso de indisponível. */
function resumoDe(resumo) {
  const q = valorOuNulo(resumo?.quantidade);
  if (q == null) return N.indisponivel;
  const p = valorOuNulo(resumo?.positivas);
  const n = valorOuNulo(resumo?.neutras);
  const g = valorOuNulo(resumo?.negativas);
  if (p == null || n == null || g == null) return N.soTotal(q);
  return N.resumo(q, p, n, g);
}

/** Probabilidade do FinBERT em porcentagem inteira; sem número, "—" (nunca 0%). */
const probabilidade = (p) => (Number.isFinite(p) ? pct(p, { casas: 0, sinal: false }) : '—');

/** Rótulo do tom lido pelo FinBERT. */
function Tom({ item }) {
  const tom = N.tom[item.rotulo] ?? null;
  return tom ? <span className={`ficha-tom ficha-tom--${item.rotulo}`}>{tom}</span> : null;
}

function Titulo({ item }) {
  return (
    <a className="ficha-noticia-titulo" href={item.link} target="_blank" rel="noopener noreferrer">
      <Manchete titulo={item.titulo} />
      <span className="sr-only"> {N.novaAba}</span>
    </a>
  );
}

/** Quando saiu: sem horário exato (precisao_hora diferente de 'hora') mostra só a data. */
const quandoDoItem = (item) => {
  if (item.precisao_hora && item.precisao_hora !== 'hora') {
    const dia = dataBR(item.data_publicacao);
    return dia ? `${dia}, ${TEXTOS.ficha.noticias.semHorario}` : TEXTOS.ficha.noticias.semHorario;
  }
  return quandoPublicada(item);
};

/** Fonte e quando saiu; no técnico soma a janela de publicação. O link fica só no título. */
function Meta({ item }) {
  const { nivel } = usePreferencias();
  const janela = nivel === 'tecnico' ? N.janela[item.janela] : null;
  return <p className="ficha-noticia-meta">{[item.fonte, quandoDoItem(item), janela].filter(Boolean).join(' · ')}</p>;
}

export function PainelNoticias({ ticker }) {
  const { nivel } = usePreferencias();
  const { data, isPending, isError, refetch } = useNoticiasAcao(ticker);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const listaRef = useRef(null);
  useAlturaSuave(listaRef, mostrarTodas);

  const itens = ordenarPorDestaque(data?.itens ?? []);
  const visiveis = mostrarTodas ? itens : itens.slice(0, LIMITE_INICIAL);
  const titulo = N.titulo(ticker);
  const simples = nivel !== 'tecnico';
  const inicioJanela = dataHoraBR(data?.janela_inicio);
  const fimJanela = dataHoraBR(data?.janela_fim);
  const janelaTexto = inicioJanela && fimJanela ? N.janelaPeriodo(inicioJanela, fimJanela) : null;

  return (
    <section className="ficha-noticias" aria-label={titulo}>
      <h3 className="ficha-grupo-titulo">{titulo}</h3>

      {isPending && (
        <div role="status" aria-live="polite">
          <span className="sr-only">{TEXTOS.ficha.carregandoNoticias}</span>
          <Linhas quantidade={4} />
        </div>
      )}
      {isError && (
        <p className="ficha-estado">
          {N.erro}{' '}
          <button type="button" className="botao" onClick={() => refetch()}>
            {TEXTOS.estados.tentarDeNovo}
          </button>
        </p>
      )}

      {!isPending && !isError && (
        <>
          {data && <p className="ficha-noticias-resumo">{resumoDe(data.resumo)}</p>}
          {janelaTexto && <p className="ficha-noticias-janela">{janelaTexto}</p>}

          {itens.length === 0 ? (
            <p className="ficha-estado">{porNivel(TEXTOS.ficha.semNoticias, nivel)}</p>
          ) : (
            <>
              {simples && <p className="ficha-nota">{T.tomExplica}</p>}
              {simples ? (
                <ol ref={listaRef} className="ficha-noticias-lista entra-cartoes">
                  {visiveis.map((item) => (
                    <li className="ficha-noticia" key={item.id}>
                      <Tom item={item} />
                      <Titulo item={item} />
                      <Meta item={item} />
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="ficha-rolagem" role="region" aria-label={T.noticiasRegiao} tabIndex={0}>
                  <table className="ficha-tab ficha-tab--noticias">
                    <caption className="sr-only">{T.noticiasRegiao}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{T.tomNoticia}</th>
                        <th scope="col">{T.manchete}</th>
                        <th scope="col" className="ficha-tab-num">
                          {T.probabilidades}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiveis.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <Tom item={item} />
                          </td>
                          <td>
                            <Titulo item={item} />
                            <Meta item={item} />
                          </td>
                          <td className="ficha-tab-num" data-rotulo={T.probabilidades}>
                            {T.probabilidadesValor(
                              probabilidade(item.prob_positivo),
                              probabilidade(item.prob_neutro),
                              probabilidade(item.prob_negativo),
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {itens.length > LIMITE_INICIAL && (
                <button
                  type="button"
                  className="botao"
                  aria-expanded={mostrarTodas}
                  onClick={() => setMostrarTodas((atual) => !atual)}
                >
                  {mostrarTodas ? N.primeiras : N.ver(itens.length)}
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
