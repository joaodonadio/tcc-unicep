import { useMemo } from 'react';
import { GraficoIndices } from './GraficoIndices.jsx';
import { TabelaIndices } from './TabelaIndices.jsx';
import { useSeries } from '../../hooks/useDados.js';
import { TICKER_DO_ROTULO, completarIndicadores, periodosDaSerie } from '../../lib/mercadoTela.js';

const TICKERS = [...new Set(Object.values(TICKER_DO_ROTULO))];

/**
 * Aba "Índices": gráfico e tabela. A tabela usa o que o pacote do dia trouxe e completa o que
 * faltar com as séries diárias. Dólar e Brent não têm série nos dados: os períodos deles ficam sem número.
 */
export function PainelIndices({ indicadores, pendencia = null }) {
  const series = useSeries(TICKERS, '1a');

  const completos = useMemo(() => {
    const calculos = {};
    TICKERS.forEach((t, i) => {
      if (series[i]) calculos[t] = periodosDaSerie(series[i]);
    });
    return indicadores ? completarIndicadores(indicadores, calculos) : null;
  }, [indicadores, series]);

  return (
    <>
      <GraficoIndices />
      {completos ? (
        <div className="mercado-tabela-indices" data-brilho="aco">
          <TabelaIndices indicadores={completos} />
        </div>
      ) : (
        pendencia
      )}
    </>
  );
}
