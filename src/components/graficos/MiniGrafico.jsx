import { lazy, Suspense } from 'react';
import { temDadosMini } from './opcoesMiniGrafico.js';

// o ECharts só desce depois que a página já apareceu (mesmo pedaço do gráfico grande)
const MiniGraficoDesenho = lazy(() =>
  import('./MiniGraficoDesenho.jsx').then((m) => ({ default: m.MiniGraficoDesenho })),
);

const ALTURA_PADRAO = 72;

/**
 * Mini gráfico de cartão (Apache ECharts, SVG): sem eixos, grade, tooltip nem rótulos.
 * tipo: 'area' (linha com brilho e ponto final) | 'barras' (cápsulas por mês) | 'pontos' (um ponto por ação)
 * | 'inclinacao' (dois pontos: antes → hoje). `faixaExata` (área) prende o eixo y exatamente entre mínima e máxima.
 * `cor` aceita var(--token); nos pontos, `cores` dá a cor de cada grupo, na ordem de `valores`.
 * O contêiner é uma imagem descrita por `rotulo` desde o primeiro render; só o desenho
 * carrega depois. Sem dados, fica o espaço reservado (sem pulo de layout) e nada é lido.
 */
export function MiniGrafico({ tipo = 'area', valores, cor, cores, rotulo, altura = ALTURA_PADRAO, faixaExata = false }) {
  const estilo = { height: `${altura / 16}rem` };
  if (!temDadosMini(tipo, valores)) {
    return <div className="mini-grafico mini-grafico--vazio" style={estilo} aria-hidden="true" />;
  }
  return (
    <div className="mini-grafico" style={estilo} role="img" aria-label={rotulo}>
      <Suspense fallback={null}>
        <MiniGraficoDesenho tipo={tipo} valores={valores} cor={cor} cores={cores} altura={altura} faixaExata={faixaExata} />
      </Suspense>
    </div>
  );
}
