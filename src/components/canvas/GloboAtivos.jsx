import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

/**
 * RF-1.3 / RF-1.4 — Globo 3D de ativos.
 *
 * Canvas 2D em vez de SVG/DOM porque são ~950 pontos animados a 60fps
 * (ARQUITETURA-INTERFACE.md §4.3): projeção esférica por rotação de matriz,
 * parallax suave seguindo o mouse, partículas de entrada ("dados do mercado")
 * e saída ("recomendações"), e hit-testing próprio nos 8 nós clicáveis.
 *
 * O canvas é canal REDUNDANTE, nunca único: a mesma lista de ativos existe em
 * texto (ver `ListaAtivosAlternativa` na tela Hoje) e nas recomendações.
 */

const COR_POR_TIPO = {
  oportunidade: '125,239,255',
  risco: '255,196,102',
  neutro: '160,185,230',
};

const LIGACOES = [
  [0, 1],
  [0, 4],
  [1, 2],
  [2, 3],
  [3, 5],
  [4, 6],
  [5, 7],
  [1, 6],
  [0, 3],
];

const CONFIG_ESTADO = {
  volatil: { ponto: '255,190,130', velocidade: 0.00022, tremor: 1.6, varredura: false },
  analisando: { ponto: '125,220,255', velocidade: 0.00013, tremor: 0, varredura: true },
  estavel: { ponto: '120,160,255', velocidade: 0.00011, tremor: 0, varredura: false },
};

const TAU = Math.PI * 2;
const ANGULO_OURO = 2.399963;

export function GloboAtivos({ ativos = [], selecionado, onSelecionar, estadoMercado = 'estavel' }) {
  const canvasRef = useRef(null);
  const selecionadoRef = useRef(selecionado);
  const onSelecionarRef = useRef(onSelecionar);
  const reduzirMovimento = useReducedMotion();

  selecionadoRef.current = selecionado;
  onSelecionarRef.current = onSelecionar;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return undefined;

    // token de invalidação: qualquer re-setup mata o loop anterior sem
    // depender de o navegador respeitar cancelAnimationFrame na hora certa
    let token = 0;
    let raf = 0;
    let desenharUmaVez = () => {};

    const cfg = CONFIG_ESTADO[estadoMercado] ?? CONFIG_ESTADO.estavel;

    function configurar() {
      const meuToken = ++token;
      cancelAnimationFrame(raf);

      const dpr = window.devicePixelRatio || 1;
      const lado = container.clientWidth || 560;
      if (!lado) return;
      canvas.width = lado * dpr;
      canvas.height = lado * dpr;

      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const C = W / 2;
      const R = W * 0.345;

      // esfera de Fibonacci: distribuição uniforme sem aglomerados nos polos
      const TOTAL_PONTOS = 950;
      const pontos = [];
      for (let i = 0; i < TOTAL_PONTOS; i++) {
        const y = 1 - ((i + 0.5) / TOTAL_PONTOS) * 2;
        const r = Math.sqrt(1 - y * y);
        const th = i * ANGULO_OURO;
        pontos.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r });
      }

      const nos = ativos.map((ativo, i) => {
        const y = 0.82 - ((i + 0.5) / Math.max(1, ativos.length)) * 1.64;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const th = i * ANGULO_OURO + 0.9;
        return { ativo, x: Math.cos(th) * r, y, z: Math.sin(th) * r, sx: 0, sy: 0, frente: false };
      });
      const ligacoes = LIGACOES.filter(([a, b]) => a < nos.length && b < nos.length);

      const CORES_SAIDA = ['63,217,154', '255,196,102', '125,239,255', '255,122,122'];
      const entrada = [];
      const saida = [];
      for (let i = 0; i < 28; i++) {
        const base = () => ({
          p: Math.random(),
          sp: 0.002 + Math.random() * 0.003,
          yo: (Math.random() - 0.5) * W * 0.44,
        });
        entrada.push({ ...base(), r: (0.8 + Math.random() * 1.2) * dpr });
        saida.push({ ...base(), r: (0.8 + Math.random() * 1.4) * dpr, col: CORES_SAIDA[i % 4] });
      }

      let alvoX = 0;
      let alvoY = 0;
      let parallaxX = 0;
      let parallaxY = 0;
      let sobre = null;

      const desenhar = (t) => {
        parallaxX += (alvoX - parallaxX) * 0.04;
        parallaxY += (alvoY - parallaxY) * 0.04;
        const rotY = t * cfg.velocidade + parallaxX * 0.55;
        const rotX = -0.32 + parallaxY * 0.3;
        const cy = Math.cos(rotY);
        const sy = Math.sin(rotY);
        const cx = Math.cos(rotX);
        const sx = Math.sin(rotX);

        const projetar = (p) => {
          const x = p.x * cy + p.z * sy;
          const z = -p.x * sy + p.z * cy;
          const y2 = p.y * cx - z * sx;
          const z2 = p.y * sx + z * cx;
          return { X: C + x * R, Y: C + y2 * R, Z: z2 };
        };

        ctx.clearRect(0, 0, W, W);

        // halo externo + núcleo luminoso
        const halo = ctx.createRadialGradient(C, C, 0, C, C, R * 1.2);
        halo.addColorStop(0, 'rgba(140,190,255,0.28)');
        halo.addColorStop(0.35, 'rgba(47,107,255,0.13)');
        halo.addColorStop(1, 'rgba(47,107,255,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(C, C, R * 1.2, 0, TAU);
        ctx.fill();

        const nucleo = ctx.createRadialGradient(C, C, 0, C, C, R * 0.24);
        nucleo.addColorStop(0, 'rgba(235,245,255,0.9)');
        nucleo.addColorStop(0.4, 'rgba(150,200,255,0.28)');
        nucleo.addColorStop(1, 'rgba(150,200,255,0)');
        ctx.fillStyle = nucleo;
        ctx.beginPath();
        ctx.arc(C, C, R * 0.24, 0, TAU);
        ctx.fill();

        // dois anéis orbitais com satélite
        for (let k = 0; k < 2; k++) {
          ctx.save();
          ctx.translate(C, C);
          ctx.rotate(k ? -0.5 : 0.42);
          const oscila = Math.sin(t * 0.0004 + k * 2) * 0.05;
          const rx = R * (1.22 + k * 0.16);
          const ry = R * (0.34 + oscila) * (1 + k * 0.22);
          ctx.strokeStyle = `rgba(125,200,255,${k ? 0.09 : 0.14})`;
          ctx.lineWidth = 1 * dpr;
          ctx.beginPath();
          ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
          ctx.stroke();
          const ang = t * (k ? -0.0005 : 0.0007) + k * 3;
          ctx.fillStyle = 'rgba(125,239,255,0.9)';
          ctx.shadowColor = 'rgba(125,239,255,0.9)';
          ctx.shadowBlur = 8 * dpr;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * rx, Math.sin(ang) * ry, 2.2 * dpr, 0, TAU);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
        }

        // partículas: dados entrando à esquerda, recomendações saindo à direita
        for (const p of entrada) {
          p.p += p.sp;
          if (p.p > 1) {
            p.p = 0;
            p.yo = (Math.random() - 0.5) * W * 0.44;
          }
          const a = Math.sin(p.p * Math.PI) * 0.55;
          ctx.fillStyle = `rgba(150,190,255,${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.p * (C - R * 0.92), C + p.yo * (1 - p.p * 0.85), p.r, 0, TAU);
          ctx.fill();
        }
        for (const p of saida) {
          p.p += p.sp;
          if (p.p > 1) {
            p.p = 0;
            p.yo = (Math.random() - 0.5) * W * 0.44;
          }
          const a = Math.sin(p.p * Math.PI) * 0.75;
          ctx.fillStyle = `rgba(${p.col},${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(
            C + R * 0.92 + p.p * (W - C - R * 0.92),
            C + p.yo * (0.15 + p.p * 0.85),
            p.r,
            0,
            TAU,
          );
          ctx.fill();
        }

        // malha da esfera
        for (const p of pontos) {
          const q = projetar(p);
          const base = 0.08 + 0.42 * ((q.Z + 1) / 2);
          const tremor = cfg.tremor ? Math.sin(t * 0.004 + p.x * 20) * cfg.tremor * dpr : 0;
          let alpha = base;
          if (cfg.varredura) {
            const faixa = Math.abs(((Math.atan2(p.z, p.x) + t * 0.0012) % TAU) - Math.PI);
            if (faixa < 0.5) alpha = Math.min(0.9, base + 0.45);
          }
          ctx.fillStyle = `rgba(${cfg.ponto},${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(q.X + tremor, q.Y, 1.15 * dpr, 0, TAU);
          ctx.fill();
        }

        // nós de ativos + ligações
        const projetados = nos.map((n) => {
          const q = projetar(n);
          n.sx = q.X;
          n.sy = q.Y;
          n.frente = q.Z > -0.15;
          return q;
        });

        ctx.lineWidth = 1 * dpr;
        for (const [a, b] of ligacoes) {
          const za = projetados[a].Z;
          const zb = projetados[b].Z;
          if (za < -0.2 && zb < -0.2) continue;
          const alpha = 0.05 + 0.14 * (((za + zb) / 2 + 1) / 2);
          ctx.strokeStyle = `rgba(125,239,255,${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(projetados[a].X, projetados[a].Y);
          ctx.lineTo(projetados[b].X, projetados[b].Y);
          ctx.stroke();
        }

        nos.forEach((n, i) => {
          const q = projetados[i];
          if (q.Z < -0.35) return;
          const frente = (q.Z + 1) / 2;
          const cor = COR_POR_TIPO[n.ativo.tipo] ?? COR_POR_TIPO.neutro;
          const destacado = selecionadoRef.current === n.ativo.ticker || sobre === n;
          const raio = (n.ativo.tipo === 'neutro' ? 3.2 : 4.2) * dpr * (destacado ? 1.5 : 1);

          // anel pulsante só nos não-neutros (oportunidade/risco)
          if (n.ativo.tipo !== 'neutro' && !reduzirMovimento) {
            const fase = (t * 0.0011 + i * 0.4) % 1;
            ctx.strokeStyle = `rgba(${cor},${((1 - fase) * 0.5 * frente).toFixed(3)})`;
            ctx.lineWidth = 1.4 * dpr;
            ctx.beginPath();
            ctx.arc(q.X, q.Y, raio + fase * 16 * dpr, 0, TAU);
            ctx.stroke();
          }

          const brilho = ctx.createRadialGradient(q.X, q.Y, 0, q.X, q.Y, raio * 3.4);
          brilho.addColorStop(0, `rgba(${cor},${(0.85 * frente).toFixed(3)})`);
          brilho.addColorStop(1, `rgba(${cor},0)`);
          ctx.fillStyle = brilho;
          ctx.beginPath();
          ctx.arc(q.X, q.Y, raio * 3.4, 0, TAU);
          ctx.fill();

          ctx.fillStyle = `rgba(${cor},${(0.95 * frente).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(q.X, q.Y, raio, 0, TAU);
          ctx.fill();

          if (q.Z > 0.05) {
            ctx.font = `${10.5 * dpr}px 'JetBrains Mono', monospace`;
            ctx.fillStyle = `rgba(230,240,255,${(0.85 * frente).toFixed(3)})`;
            ctx.fillText(n.ativo.ticker, q.X + raio + 7 * dpr, q.Y + 3.5 * dpr);
          }
        });
      };

      desenharUmaVez = () => desenhar(reduzirMovimento ? 0 : performance.now());

      const loop = (t) => {
        if (meuToken !== token || !canvas.isConnected) return;
        desenhar(t);
        raf = requestAnimationFrame(loop);
      };

      if (reduzirMovimento) {
        desenhar(0);
      } else {
        raf = requestAnimationFrame(loop);
      }

      // ---- interação: parallax, hover e clique nos nós ----
      canvas.onmousemove = (e) => {
        const caixa = canvas.getBoundingClientRect();
        if (!reduzirMovimento) {
          alvoX = ((e.clientX - caixa.left) / caixa.width - 0.5) * 2;
          alvoY = ((e.clientY - caixa.top) / caixa.height - 0.5) * 2;
        }
        const px = (e.clientX - caixa.left) * (canvas.width / caixa.width);
        const py = (e.clientY - caixa.top) * (canvas.height / caixa.height);
        sobre = nos.find((n) => n.frente && Math.hypot(n.sx - px, n.sy - py) < 26 * dpr) ?? null;
        canvas.style.cursor = sobre ? 'pointer' : 'grab';
        if (reduzirMovimento) desenharUmaVez();
      };
      canvas.onmouseleave = () => {
        alvoX = 0;
        alvoY = 0;
        sobre = null;
        if (reduzirMovimento) desenharUmaVez();
      };
      canvas.onclick = () => {
        if (sobre) onSelecionarRef.current?.(sobre.ativo.ticker);
      };
    }

    configurar();

    const observador = new ResizeObserver(configurar);
    observador.observe(container);

    return () => {
      token++;
      cancelAnimationFrame(raf);
      observador.disconnect();
      canvas.onmousemove = null;
      canvas.onmouseleave = null;
      canvas.onclick = null;
    };
  }, [ativos, estadoMercado, reduzirMovimento]);

  return (
    <canvas
      ref={canvasRef}
      className="globe-canvas"
      role="img"
      aria-label={`Globo com ${ativos.length} ativos analisados hoje. A mesma lista está disponível em texto logo abaixo.`}
    />
  );
}
