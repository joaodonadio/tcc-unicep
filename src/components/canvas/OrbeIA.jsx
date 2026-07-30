import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

/**
 * RF-4.1 — orbe 3D animada no cabeçalho do chat: identidade visual da IA.
 * Mesma esfera de pontos do globo, em escala reduzida (260 pontos).
 */
export function OrbeIA({ cor = '125,239,255', velocidade = 0.00045 }) {
  const canvasRef = useRef(null);
  const reduzirMovimento = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let token = 0;
    let raf = 0;

    function configurar() {
      const meuToken = ++token;
      cancelAnimationFrame(raf);

      const dpr = window.devicePixelRatio || 1;
      const largura = canvas.clientWidth || 110;
      const altura = canvas.clientHeight || 110;
      canvas.width = largura * dpr;
      canvas.height = altura * dpr;

      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;

      const TOTAL = 260;
      const pontos = [];
      for (let i = 0; i < TOTAL; i++) {
        const y = 1 - ((i + 0.5) / TOTAL) * 2;
        const r = Math.sqrt(1 - y * y);
        const th = i * 2.399963;
        pontos.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r });
      }

      const desenhar = (t) => {
        ctx.clearRect(0, 0, W, H);
        const cxc = W / 2;
        const cyc = H / 2;
        const R = Math.min(W, H) * 0.42;

        const brilho = ctx.createRadialGradient(cxc, cyc, 0, cxc, cyc, R * 0.55);
        brilho.addColorStop(0, 'rgba(200,240,255,0.45)');
        brilho.addColorStop(1, 'rgba(200,240,255,0)');
        ctx.fillStyle = brilho;
        ctx.beginPath();
        ctx.arc(cxc, cyc, R * 0.55, 0, Math.PI * 2);
        ctx.fill();

        const rot = t * velocidade;
        const cy = Math.cos(rot);
        const sy = Math.sin(rot);
        for (const p of pontos) {
          const x = p.x * cy + p.z * sy;
          const z = -p.x * sy + p.z * cy;
          const alpha = 0.12 + 0.62 * ((z + 1) / 2);
          ctx.fillStyle = `rgba(${cor},${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(cxc + x * R, cyc + p.y * R * 0.92, 1.1 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      const loop = (t) => {
        if (meuToken !== token || !canvas.isConnected) return;
        desenhar(t);
        raf = requestAnimationFrame(loop);
      };

      if (reduzirMovimento) desenhar(0);
      else raf = requestAnimationFrame(loop);
    }

    configurar();
    const observador = new ResizeObserver(configurar);
    observador.observe(canvas);

    return () => {
      token++;
      cancelAnimationFrame(raf);
      observador.disconnect();
    };
  }, [cor, velocidade, reduzirMovimento]);

  return <canvas ref={canvasRef} className="chat-orb" aria-hidden="true" />;
}
