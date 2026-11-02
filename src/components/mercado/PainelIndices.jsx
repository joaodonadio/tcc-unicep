import { useMemo } from 'react';
import { GraficoIndices } from './GraficoIndices.jsx';
import { TabelaIndices } from './TabelaIndices.jsx';
import { useSeries } from '../../hooks/useDados.js';
import { useHistoricoBcb } from '../../hooks/useBancoCentral.js';
import { SERIE_DOLAR_PTAX } from '../../lib/bancoCentral.js';
import {
  CHAVE_DOLAR,
  TICKER_DO_ROTULO,
  completarIndicadores,
  periodosDaSerie,
  periodosPorCalendario,
} from '../../lib/mercadoTela.js';

const TICKERS = [...new Set(Object.values(TICKER_DO_ROTULO))];

/**
 * Aba "Índices": gráfico e tabela. A tabela usa o que o pacote do dia trouxe e completa o que
 * faltar com as séries diárias (e o histórico do dólar no Banco Central).
 */
export function PainelIndices({ indicadores, pendencia = null }) {
  const series = useSeries(TICKERS, '1a');
  const dolar = useHistoricoBcb(SERIE_DOLAR_PTAX);

  const completos = useMemo(() => {
    const calculos = {};
    TICKERS.forEach((t, i) => {
      if (series[i]) calculos[t] = periodosDaSerie(series[i]);
    });
    if (dolar.data) calculos[CHAVE_DOLAR] = periodosPorCalendario(dolar.data);
    return indicadores ? completarIndicadores(indicadores, calculos) : null;
  }, [indicadores, series, dolar.data]);

  return (
    <>
      <GraficoIndices />
      {completos ? (
        <div className="mercado-tabela-indices">
          <TabelaIndices indicadores={completos} />
        </div>
      ) : (
        pendencia
      )}
    </>
  );
}
