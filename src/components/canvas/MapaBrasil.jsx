import { useEffect, useRef } from 'react';
import { CONTORNO_NORMALIZADO, MARGEM, dentroDoContorno } from '../../lib/projecaoBrasil.js';

/**
 * RF-3.3 — mapa do Brasil em pontilhado.
 *
 * Canvas porque o preenchimento é uma malha de milhares de pontos filtrada por
 * teste ponto-em-polígono; em SVG isso seriam milhares de nós no DOM. Estático
 * (não anima), então basta redesenhar quando o tamanho muda.
 */
export function MapaBrasil() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    function desenhar() {
      const dpr = window.devicePixelRatio || 1;
      const largura = canvas.clientWidth;
      const altura = canvas.clientHeight;
      if (!largura || !altura) return;

      canvas.width = largura * dpr;
      canvas.height = altura * dpr;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // quadrado de desenho centrado, sem esticar o contorno
      const lado = Math.min(canvas.width, canvas.height) * (1 - 2 * MARGEM);
      const ox = (canvas.width - lado) / 2;
      const oy = (canvas.height - lado) / 2;
      const passo = 7 * dpr;

      ctx.fillStyle = 'rgba(130,165,235,0.32)';
      for (let y = passo / 2; y < lado; y += passo) {
        for (let x = passo / 2; x < lado; x += passo) {
          if (dentroDoContorno(x / lado, y / lado, CONTORNO_NORMALIZADO)) {
            ctx.beginPath();
            ctx.arc(ox + x, oy + y, 1.05 * dpr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.strokeStyle = 'rgba(130,175,255,0.28)';
      ctx.lineWidth = 1.2 * dpr;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      CONTORNO_NORMALIZADO.forEach(([nx, ny], i) => {
        const X = ox + nx * lado;
        const Y = oy + ny * lado;
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      });
      ctx.closePath();
      ctx.stroke();
    }

    desenhar();
    const observador = new ResizeObserver(desenhar);
    observador.observe(canvas);
    return () => observador.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="map-canvas"
      role="img"
      aria-label="Mapa do Brasil com as notícias do dia posicionadas por região; cada notícia está listada em texto ao lado do seu ponto."
    />
  );
}
