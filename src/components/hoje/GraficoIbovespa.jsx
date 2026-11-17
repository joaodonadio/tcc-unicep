import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSerie } from '../../hooks/useDados.js';
import { useDetalhes } from '../../hooks/useDetalhes.js';
import { dataBR } from '../../lib/datas.js';
import { variacaoDaSerie } from '../../lib/fichaIndicadores.js';
import { numero, pct } from '../../lib/formato.js';
import { direcaoDe } from '../../lib/mapaPregao.js';
import { cortarJanela, JANELAS } from '../../lib/series.js';
import { ariaDosEventos, eventosNaJanela, marcasDosEventos } from '../../lib/eventosMercado.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { MiniGrafico } from '../graficos/MiniGrafico.jsx';
import { BotaoDetalhes, PainelDetalhes } from '../ui/Detalhes.jsx';

const ALTURA_GRAFICO = 240;
/** Cor da linha pela direção da janela de 6 meses; estável ou sem dado, a cor da série principal. */
const COR_DA_DIRECAO = { up: 'var(--cor-alta)', down: 'var(--cor-queda)' };
const COR_NEUTRA = 'var(--cor-serie-1)';
const formatarPontos = (v) => numero(v, { casas: 0 });
const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Ibovespa dos últimos 6 meses no estilo dos mini gráficos: variação da janela em destaque,
 * linha com brilho e ponto final, só mínima, máxima e as datas das pontas.
 * A explicação fica no painel de detalhes; o gráfico interativo completo está na página do mercado.
 */
export function GraficoIbovespa() {
  const { nivel } = usePreferencias();
  const detalhes = useDetalhes();
  const consulta = useSerie('IBOV', '1a');
  const janela = useMemo(
    () => (consulta.data ? cortarJanela(consulta.data, JANELAS['6m']) : null),
    [consulta.data],
  );
  const datas = janela?.datas ?? [];
  const eventosJanela = eventosNaJanela(datas);
  const fechamento = janela?.valores.fechamento ?? [];
  const finitos = fechamento.filter(finito);
  const temGrafico = finitos.length >= 2;
  const variacao = variacaoDaSerie(fechamento);
  const direcao = direcaoDe(variacao);
  const minimo = temGrafico ? Math.min(...finitos) : null;
  const maximo = temGrafico ? Math.max(...finitos) : null;
  const titulo = porNivel(TEXTOS.hoje.graficoTitulo, nivel);

  let grafico;
  if (consulta.isPending && !consulta.isError) {
    grafico = <div className="esqueleto" style={{ height: `${ALTURA_GRAFICO / 16}rem` }} aria-hidden="true" />;
  } else if (consulta.isError || !temGrafico) {
    grafico = <p className="hoje-vazio">{TEXTOS.hoje.graficoIndisponivel}</p>;
  } else {
    grafico = (
      <div className="hoje-ibov-grafico">
        <span className="hoje-ibov-eixo" aria-hidden="true">
          <span>{formatarPontos(maximo)}</span>
          <span>{formatarPontos(minimo)}</span>
        </span>
        <MiniGrafico
          tipo="area"
          faixaExata
          interativo
          datas={datas}
          valores={fechamento}
          cor={COR_DA_DIRECAO[direcao] ?? COR_NEUTRA}
          altura={ALTURA_GRAFICO}
          marcas={marcasDosEventos(eventosJanela, datas)}
          rotulo={[
            TEXTOS.hoje.mini.ibovespa(formatarPontos(finitos[0]), formatarPontos(finitos[finitos.length - 1])),
            ariaDosEventos(eventosJanela, datas),
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {datas.length > 0 && (
          <div className="chart-foot">
            <span>{dataBR(datas[0])}</span>
            <span>{dataBR(datas[datas.length - 1])}</span>
          </div>
        )}
        {eventosJanela.map((e) => (
          <p key={e.chave} className="hoje-numero-nota">
            {porNivel(TEXTOS.eventos[e.chave].nota, nivel)}
          </p>
        ))}
      </div>
    );
  }

  return (
    <section className="hoje-bloco" data-brilho="dado" aria-labelledby="hoje-grafico-titulo">
      <div className="hoje-bloco-topo">
        <h2 id="hoje-grafico-titulo" className="hoje-bloco-titulo">
          {titulo}
        </h2>
        <BotaoDetalhes nome={titulo} aberto={detalhes.aberto} controla={detalhes.id} onClick={detalhes.alternar} />
      </div>

      {variacao != null && (
        <p className="hoje-janela">
          <span className="hoje-janela-valor" data-sinal={direcao}>
            {pct(variacao)}
          </span>
          <span className="hoje-janela-rotulo">{porNivel(TEXTOS.hoje.graficoVariacao, nivel)}</span>
        </p>
      )}

      {grafico}

      <PainelDetalhes id={detalhes.id} aberto={detalhes.aberto}>
        <p>{TEXTOS.hoje.graficoDescricao}</p>
        {temGrafico && <p>{TEXTOS.hoje.legendaGrafico.ibovespa}</p>}
        {temGrafico && <p>{TEXTOS.hoje.faixaSeisMesesDescricao(formatarPontos(minimo), formatarPontos(maximo))}</p>}
      </PainelDetalhes>

      <Link className="hoje-ver" to="/mercado">
        {TEXTOS.hoje.verMercado}
      </Link>
    </section>
  );
}
