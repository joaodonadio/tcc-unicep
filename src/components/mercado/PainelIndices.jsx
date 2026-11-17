import { useMemo } from 'react';
import { GraficoIndices } from './GraficoIndices.jsx';
import { IndicesPorGrupo } from './IndicesPorGrupo.jsx';
import { useSerieDoDolar, useSeries } from '../../hooks/useDados.js';
import {
  CHAVE_DOLAR,
  TICKER_DO_ROTULO,
  completarIndicadores,
  periodosDaSerie,
  periodosPorCalendario,
} from '../../lib/mercadoTela.js';
import { TEXTOS } from '../../lib/textos.js';

const TICKERS = [...new Set(Object.values(TICKER_DO_ROTULO))];

/**
 * Gráfico dos índices e o cartão "Como foi cada índice". Os períodos que o pacote do dia não traz
 * vêm das séries diárias e da história do dólar (série publicada ou rota local); o que nenhuma das fontes tem fica sem número.
 */
export function PainelIndices({ indicadores, pendencia = null, pregao = null, taxaDia = null }) {
  const series = useSeries(TICKERS, '1a');
  const dolar = useSerieDoDolar();

  const completos = useMemo(() => {
    const calculos = {};
    TICKERS.forEach((t, i) => {
      if (series[i]) calculos[t] = periodosDaSerie(series[i]);
    });
    if (dolar.data?.datas?.length) calculos[CHAVE_DOLAR] = periodosPorCalendario(dolar.data);
    return indicadores ? completarIndicadores(indicadores, calculos) : null;
  }, [indicadores, series, dolar.data]);

  return (
    <>
      <GraficoIndices />
      <section className="mercado-bloco" data-brilho="aco" aria-labelledby="mercado-indices-titulo">
        <h2 id="mercado-indices-titulo" className="mercado-bloco-titulo">
          {TEXTOS.mercado.indicesTitulo}
        </h2>
        {completos ? <IndicesPorGrupo indicadores={completos} pregao={pregao} taxaDia={taxaDia} /> : pendencia}
      </section>
    </>
  );
}
