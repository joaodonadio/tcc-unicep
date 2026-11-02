import { lazy, Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSerie } from '../../hooks/useDados.js';
import { dataBR } from '../../lib/datas.js';
import { numero } from '../../lib/formato.js';
import { cortarJanela, JANELAS } from '../../lib/series.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

// o ECharts só desce depois que a página inicial já apareceu
const GraficoInterativo = lazy(() =>
  import('../graficos/GraficoInterativo.jsx').then((m) => ({ default: m.GraficoInterativo })),
);

const COR = 'var(--cor-serie-1)';
const ALTURA_GRAFICO = 260;
const formatarPontos = (v) => numero(v, { casas: 0 });

/** Ibovespa dos últimos 6 meses (fechamento diário), com link para a página do mercado. */
export function GraficoIbovespa() {
  const { nivel } = usePreferencias();
  const consulta = useSerie('IBOV', '1a');
  const janela = useMemo(
    () => (consulta.data ? cortarJanela(consulta.data, JANELAS['6m']) : null),
    [consulta.data],
  );
  const datas = janela?.datas ?? [];
  const fechamento = janela?.valores.fechamento ?? [];

  return (
    <section className="hoje-bloco" aria-labelledby="hoje-grafico-titulo">
      <h2 id="hoje-grafico-titulo" className="hoje-bloco-titulo">
        {porNivel(TEXTOS.hoje.graficoTitulo, nivel)}
      </h2>

      {consulta.isError ? (
        <p className="hoje-vazio">{TEXTOS.hoje.graficoIndisponivel}</p>
      ) : (
        <>
          <Suspense
            fallback={
              <div
                className="esqueleto"
                style={{ height: `${ALTURA_GRAFICO / 16}rem`, marginTop: '1.125rem' }}
                aria-hidden="true"
              />
            }
          >
            <GraficoInterativo
              series={[{ id: 'ibov', rotulo: TEXTOS.hoje.ibovespaSerie, valores: fechamento, cor: COR }]}
              datas={datas}
              formatar={formatarPontos}
              altura={ALTURA_GRAFICO}
              descricao={TEXTOS.hoje.graficoDescricao}
              carregando={consulta.isPending}
            />
          </Suspense>
          {datas.length > 0 && (
            <div className="chart-foot">
              <span>{dataBR(datas[0])}</span>
              <span>{dataBR(datas[datas.length - 1])}</span>
            </div>
          )}
        </>
      )}

      <Link className="hoje-ver" to="/mercado">
        {TEXTOS.hoje.verMercado}
      </Link>
    </section>
  );
}
