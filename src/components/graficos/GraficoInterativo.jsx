import { useMemo, useRef, useState } from 'react';
import { dataCurta } from '../../lib/formato.js';

/**
 * RF-3.2 — gráfico interativo do ativo em destaque.
 *
 * SVG para o traçado (declarativo, acessível) + overlay HTML posicionado em %
 * para o crosshair e o tooltip: assim o texto do tooltip é DOM real, legível
 * por leitor de tela e selecionável, em vez de pixels pintados no canvas.
 */

const LARGURA = 640;
const ALTURA = 220;
const MARGEM = 14;

export function GraficoInterativo({ serie = [], dias = 180, carregando = false }) {
  const areaRef = useRef(null);
  const [indice, setIndice] = useState(null);

  const geometria = useMemo(() => {
    if (serie.length < 2) return null;
    const min = Math.min(...serie);
    const max = Math.max(...serie);
    const amplitude = max - min || 1;
    const px = (i) => MARGEM + (i * (LARGURA - 2 * MARGEM)) / (serie.length - 1);
    const py = (v) => ALTURA - MARGEM - ((v - min) / amplitude) * (ALTURA - 2 * MARGEM);
    const linha = `M${serie.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' L')}`;
    return {
      px,
      py,
      linha,
      area: `${linha} L${LARGURA - MARGEM},${ALTURA - MARGEM} L${MARGEM},${ALTURA - MARGEM} Z`,
    };
  }, [serie]);

  if (!geometria) {
    return <div className="skeleton" style={{ height: '13.75rem', marginTop: '1.125rem' }} />;
  }

  const aoMover = (evento) => {
    const caixa = areaRef.current?.getBoundingClientRect();
    if (!caixa) return;
    const fracao = Math.min(1, Math.max(0, (evento.clientX - caixa.left) / caixa.width));
    setIndice(Math.round(fracao * (serie.length - 1)));
  };

  const temTooltip = indice !== null && indice >= 0 && indice < serie.length;
  const esquerda = temTooltip ? (geometria.px(indice) / LARGURA) * 100 : 0;
  const topo = temTooltip ? (geometria.py(serie[indice]) / ALTURA) * 100 : 0;
  const valorFormatado = temTooltip
    ? `R$ ${serie[indice].toFixed(2).replace('.', ',')}`
    : '';
  const dataFormatada = temTooltip
    ? dataCurta(
        new Date(
          Date.now() - ((serie.length - 1 - indice) / (serie.length - 1)) * dias * 86400000,
        ),
      )
    : '';

  return (
    <div className="chart-stage" style={carregando ? { opacity: 0.55 } : undefined}>
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={`Série de preços do período: de R$ ${serie[0]
          .toFixed(2)
          .replace('.', ',')} a R$ ${serie[serie.length - 1].toFixed(2).replace('.', ',')}.`}
      >
        <path d={geometria.area} fill="rgba(47,107,255,0.14)" />
        <path
          d={geometria.linha}
          fill="none"
          stroke="var(--primary-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {temTooltip && (
        <>
          <div className="chart-cross" style={{ left: `${esquerda}%` }} />
          <div className="chart-dot" style={{ left: `${esquerda}%`, top: `${topo}%` }} />
          <div
            className="chart-tip"
            style={{ left: `${Math.min(84, Math.max(12, esquerda))}%`, top: `${topo}%` }}
            role="status"
          >
            <span className="chart-tip-val">{valorFormatado}</span>
            <span className="chart-tip-date">{dataFormatada}</span>
          </div>
        </>
      )}

      <div
        ref={areaRef}
        className="chart-hit"
        onMouseMove={aoMover}
        onMouseLeave={() => setIndice(null)}
      />
    </div>
  );
}
