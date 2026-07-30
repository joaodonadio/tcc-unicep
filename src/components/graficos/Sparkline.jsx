import { useMemo } from 'react';

/**
 * RF-2.5 — sparkline de 30 dias dentro do card de recomendação.
 *
 * SVG (e não canvas): são poucos pontos, o path é declarativo e o elemento
 * carrega alternativa textual — `role="img"` + `aria-label` com o resumo da
 * série (ARQUITETURA-INTERFACE.md §4.3).
 */

const LARGURA = 240;
const ALTURA = 72;
const MARGEM = 6;

export function Sparkline({ serie = [], tipo = 'oportunidade', descricao }) {
  const { linha, area } = useMemo(() => {
    if (serie.length < 2) return { linha: '', area: '' };
    const min = Math.min(...serie);
    const max = Math.max(...serie);
    const amplitude = max - min || 1;
    const x = (i) => (i * LARGURA) / (serie.length - 1);
    const y = (v) => ALTURA - MARGEM - ((v - min) / amplitude) * (ALTURA - 2 * MARGEM);
    const pontos = serie.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    const linhaPath = `M${pontos.join(' L')}`;
    return {
      linha: linhaPath,
      area: `${linhaPath} L${LARGURA},${ALTURA} L0,${ALTURA} Z`,
    };
  }, [serie]);

  if (!linha) return null;

  const cor = tipo === 'risco' ? 'var(--warning)' : 'var(--accent)';
  const preenchimento =
    tipo === 'risco' ? 'rgba(255,196,102,0.08)' : 'rgba(125,239,255,0.08)';

  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={descricao}
      preserveAspectRatio="none"
    >
      <path d={area} fill={preenchimento} />
      <path
        d={linha}
        fill="none"
        stroke={cor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
