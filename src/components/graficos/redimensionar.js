/**
 * Acompanha o tamanho do contêiner de um gráfico ECharts.
 * Ao girar o aparelho, o Android avisa antes de terminar o novo layout: o balão aberto ficava na
 * posição antiga e o desenho na largura antiga, passando da tela. Aqui o balão fecha na hora e o
 * gráfico é medido de novo no quadro seguinte e mais uma vez depois que a rotação assenta.
 * Devolve a função que desliga tudo.
 */
const ESPERA_ROTACAO_MS = 350;

export function acompanharTamanho(alvo, grafico, aoMedir) {
  let quadro = 0;
  let espera = 0;

  const medir = () => {
    if (grafico.isDisposed?.()) return;
    grafico.resize();
    aoMedir?.(alvo);
  };

  const aoMudar = () => {
    if (grafico.isDisposed?.()) return;
    grafico.dispatchAction({ type: 'hideTip' });
    grafico.dispatchAction({ type: 'downplay' });
    cancelAnimationFrame(quadro);
    clearTimeout(espera);
    quadro = requestAnimationFrame(medir);
    espera = setTimeout(medir, ESPERA_ROTACAO_MS);
  };

  let observador = null;
  if (typeof ResizeObserver !== 'undefined') {
    observador = new ResizeObserver(aoMudar);
    observador.observe(alvo);
  }
  window.addEventListener('orientationchange', aoMudar);
  window.visualViewport?.addEventListener('resize', aoMudar);

  return () => {
    observador?.disconnect();
    window.removeEventListener('orientationchange', aoMudar);
    window.visualViewport?.removeEventListener('resize', aoMudar);
    cancelAnimationFrame(quadro);
    clearTimeout(espera);
  };
}
