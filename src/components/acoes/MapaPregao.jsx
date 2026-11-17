import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { agruparPorSetor, direcaoDe, percentualDoTom } from '../../lib/mapaPregao.js';
import { variacaoDiaConfiavel, variacaoDiaSuspeita } from '../../lib/crivel.js';
import { pct } from '../../lib/formato.js';
import { humorDaVariacao } from '../../lib/mascote.js';
import { ancoraDoSetor } from '../../lib/setores.js';
import { TEXTOS } from '../../lib/textos.js';
import Mascote from '../ui/Mascote.jsx';
import { SeloRevisao } from '../ui/SeloRevisao.jsx';
import { SeloCalculo } from '../ui/SeloCalculo.jsx';

/**
 * O pregão como mapa de calor: uma linha por setor, um bloco por ação. O tom do
 * bloco segue a variação do dia: verde para alta, vermelho para queda, mais forte
 * conforme o movimento. Sem número, o bloco fica neutro e diz "sem dado". Variação
 * suspeita fica fora das contas e aparece "mudou de escala", com o tom neutro.
 * `circuladas` (tickers) marca a ação mais negociada de cada setor com um anel.
 */

/** Escala da legenda: variações de cada amostra (fração). */
const AMOSTRAS_DA_ESCALA = [-0.04, -0.02, 0, 0.02, 0.04];

/** Fundo do bloco: mistura da cor de alta ou de queda com a superfície; sem número ou estável, neutro. */
function fundoDoBloco(variacao) {
  const direcao = direcaoDe(variacao);
  if (direcao == null || direcao === 'flat') return 'var(--cor-superficie-2)';
  const cor = direcao === 'down' ? 'var(--cor-queda)' : 'var(--cor-alta)';
  return `color-mix(in srgb, ${cor} ${percentualDoTom(variacao)}%, var(--cor-superficie))`;
}

/** Média das variações do dia que entram nas contas (sem as suspeitas); null sem nenhuma. */
function mediaDoPregao(acoes) {
  const validas = acoes
    .map((acao) => variacaoDiaConfiavel(Number.isFinite(acao.variacao_dia) ? acao.variacao_dia : null))
    .filter((v) => v != null);
  if (!validas.length) return null;
  return validas.reduce((soma, v) => soma + v, 0) / validas.length;
}

/** "2 regras a favor, 1 de atenção"; vazio quando não há sinal. */
function sinaisDe(contagem) {
  const forte = contagem?.forte > 0 ? contagem.forte : 0;
  const atencao = contagem?.atencao > 0 ? contagem.atencao : 0;
  return [
    forte > 0 && TEXTOS.dia.mapaRegrasFavor(forte),
    atencao > 0 && TEXTOS.dia.mapaRegrasAtencao(atencao),
  ]
    .filter(Boolean)
    .join(', ');
}

/** @param {object} props @param {object[]} [props.acoes] data.acoes_pregao (uma entrada por ação do pregão) */
export function MapaPregao({ acoes = [], titulo = TEXTOS.dia.mapa, circuladas = new Set() }) {
  const linhas = useMemo(() => agruparPorSetor(acoes), [acoes]);
  // o Cotinha reage à média do pregão; sem média, fica atento
  const mediaPregao = mediaDoPregao(acoes);
  const humor = mediaPregao == null ? 'atento' : humorDaVariacao(mediaPregao);

  return (
    <figure className="mapa" aria-labelledby="mapa-titulo">
      <figcaption>
        <h2 id="mapa-titulo" className="mapa-titulo">{titulo}</h2>
        <div className="mapa-intro-linha">
          <Mascote humor={humor} className="mapa-pavio" />
          <p className="mapa-intro">{TEXTOS.dia.mapaIntro}</p>
        </div>
        <SeloCalculo conta="mediaSetor" curto />
      </figcaption>

      <ul className="mapa-linhas entra-lista" role="list">
        {linhas.map((grupo) => {
          const media = grupo.variacao_media == null ? null : pct(grupo.variacao_media);
          return (
            <li key={grupo.setor} id={ancoraDoSetor(grupo.setor)} className="mapa-linha">
              <div className="mapa-setor">
                <span className="mapa-setor-nome">{grupo.setor}</span>
                <span className="mapa-setor-resumo">
                  {media ? TEXTOS.dia.mapaMedia(media) : TEXTOS.dia.mapaSemMedia}
                  {' · '}
                  {TEXTOS.dia.mapaSubiram(grupo.subiram, grupo.total)}
                </span>
              </div>

              <ul className="mapa-blocos" role="list">
                {grupo.acoes.map((acao) => {
                  // Só a variação crível entra no tom e na conta; a suspeita vira "mudou de escala", neutra.
                  const variacao = variacaoDiaConfiavel(Number.isFinite(acao.variacao_dia) ? acao.variacao_dia : null);
                  const emRevisao = variacaoDiaSuspeita(Number.isFinite(acao.variacao_dia) ? acao.variacao_dia : null);
                  const circulada = circuladas.has(acao.ticker);
                  const sinais = sinaisDe(acao.contagem);
                  const cabeca = [acao.ticker, acao.nome].filter(Boolean).join(', ');
                  const trecho = emRevisao
                    ? TEXTOS.revisao.rotulo
                    : variacao == null
                      ? TEXTOS.dia.mapaSemDado
                      : TEXTOS.dia.mapaVariacaoDia(pct(variacao));
                  const rotulo = [
                    TEXTOS.dia.mapaBloco(cabeca, trecho, sinais),
                    circulada && TEXTOS.dia.mapaCirculada,
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <li key={acao.ticker} className={'mapa-bloco' + (circulada ? ' mapa-bloco--circulada' : '')}>
                      <Link
                        to={`/acao/${acao.ticker}`}
                        aria-label={rotulo}
                        title={rotulo}
                        style={{ background: fundoDoBloco(variacao) }}
                      >
                        <span className="mapa-bloco-ticker">{acao.ticker}</span>
                        <span className="mapa-bloco-variacao">
                          {emRevisao ? (
                            // Selo "mudou de escala": a variação não entra nas contas do setor.
                            <SeloRevisao compacto />
                          ) : variacao == null ? (
                            TEXTOS.dia.mapaSemDado
                          ) : (
                            pct(variacao)
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>

      <ul className="mapa-escala" aria-hidden="true">
        {AMOSTRAS_DA_ESCALA.map((variacao, i) => (
          <li key={variacao} className="mapa-escala-item">
            <span className="mapa-escala-cor" style={{ background: fundoDoBloco(variacao) }} />
            <span>{TEXTOS.dia.mapaEscala[i]}</span>
          </li>
        ))}
      </ul>

      {circuladas.size > 0 && (
        <p className="mapa-legenda-circulada">
          <Mascote humor="curioso" className="mapa-pavio-legenda" />
          <span className="mapa-amostra-circulada" aria-hidden="true" />
          {TEXTOS.dia.legendaCirculada}
        </p>
      )}
    </figure>
  );
}
