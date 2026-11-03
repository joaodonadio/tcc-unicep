import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido.js';

/**
 * Fundo de pontos (adaptado do Dot Grid do React Bits): uma malha de pontos apagados
 * numa camada fixa atrás de tudo. Perto do cursor os pontos acendem; um
 * movimento rápido do mouse empurra os pontos, que voltam ao lugar com mola.
 *
 * Só reage ao mouse em tela com ponteiro fino (desktop). No celular, ou para quem
 * pediu menos movimento, a malha fica parada. Puramente decorativo (aria-hidden).
 */

const ESPACO = 26; // distância entre centros, em px
const RAIO = 1.15; // raio do ponto, em px
const ALCANCE = 150; // raio de influência do cursor, em px
const COR_BASE = [255, 255, 255];
const ALFA_BASE = 0.1;
const COR_ATIVA = [255, 255, 255];
const ALFA_ATIVO = 0.6;
const VELOCIDADE_EMPURRAO = 900; // px/s a partir do qual o cursor empurra
const FORCA_EMPURRAO = 0.12;
const MAX_DESLOCAMENTO = 22;

export function FundoPontos() {
  const canvasRef = useRef(null);
  const reduzido = useMovimentoReduzido();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const interativo =
      !reduzido && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    let pontos = [];
    let largura = 0;
    let altura = 0;
    let quadro = 0;
    const cursor = { x: -9999, y: -9999, vx: 0, vy: 0, t: 0, ativo: false };

    function montar() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      largura = window.innerWidth;
      altura = window.innerHeight;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      canvas.style.width = `${largura}px`;
      canvas.style.height = `${altura}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const colunas = Math.ceil(largura / ESPACO) + 1;
      const linhas = Math.ceil(altura / ESPACO) + 1;
      const sobraX = (largura - (colunas - 1) * ESPACO) / 2;
      const sobraY = (altura - (linhas - 1) * ESPACO) / 2;
      pontos.forEach((p) => gsap.killTweensOf(p));
      pontos = [];
      for (let l = 0; l < linhas; l += 1) {
        for (let c = 0; c < colunas; c += 1) {
          pontos.push({ x: sobraX + c * ESPACO, y: sobraY + l * ESPACO, dx: 0, dy: 0, ocupado: false });
        }
      }
    }

    function desenhar() {
      ctx.clearRect(0, 0, largura, altura);
      const alcance2 = ALCANCE * ALCANCE;
      for (const p of pontos) {
        const px = p.x + p.dx;
        const py = p.y + p.dy;
        let alfa = ALFA_BASE;
        let cor = COR_BASE;
        if (cursor.ativo) {
          const ddx = p.x - cursor.x;
          const ddy = p.y - cursor.y;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 < alcance2) {
            const k = 1 - Math.sqrt(d2) / ALCANCE;
            const t = k * k;
            cor = [
              Math.round(COR_BASE[0] + (COR_ATIVA[0] - COR_BASE[0]) * t),
              Math.round(COR_BASE[1] + (COR_ATIVA[1] - COR_BASE[1]) * t),
              Math.round(COR_BASE[2] + (COR_ATIVA[2] - COR_BASE[2]) * t),
            ];
            alfa = ALFA_BASE + (ALFA_ATIVO - ALFA_BASE) * t;
          }
        }
        ctx.fillStyle = `rgb(${cor[0]} ${cor[1]} ${cor[2]} / ${alfa})`;
        ctx.beginPath();
        ctx.arc(px, py, RAIO, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // o laço só roda enquanto há movimento: 1,6s depois do último gesto (tempo da mola
    // voltar), desenha o estado parado e dorme até o próximo movimento
    let ultimoGesto = 0;
    let rodando = false;
    function laco() {
      desenhar();
      if (performance.now() - ultimoGesto > 1600 || document.hidden) {
        rodando = false;
        return;
      }
      quadro = requestAnimationFrame(laco);
    }
    function acordar() {
      ultimoGesto = performance.now();
      if (rodando) return;
      rodando = true;
      quadro = requestAnimationFrame(laco);
    }

    function aoMover(e) {
      const agora = performance.now();
      const dt = Math.max(agora - cursor.t, 16);
      cursor.vx = ((e.clientX - cursor.x) / dt) * 1000;
      cursor.vy = ((e.clientY - cursor.y) / dt) * 1000;
      cursor.x = e.clientX;
      cursor.y = e.clientY;
      cursor.t = agora;
      cursor.ativo = true;
      acordar();

      const velocidade = Math.hypot(cursor.vx, cursor.vy);
      if (velocidade < VELOCIDADE_EMPURRAO) return;
      for (const p of pontos) {
        if (p.ocupado) continue;
        const d = Math.hypot(p.x - cursor.x, p.y - cursor.y);
        if (d > ALCANCE * 0.6) continue;
        p.ocupado = true;
        const k = 1 - d / (ALCANCE * 0.6);
        const limitar = (v) => Math.max(-MAX_DESLOCAMENTO, Math.min(MAX_DESLOCAMENTO, v));
        gsap
          .timeline({ onComplete: () => { p.ocupado = false; } })
          .to(p, {
            dx: limitar(cursor.vx * FORCA_EMPURRAO * k * 0.1),
            dy: limitar(cursor.vy * FORCA_EMPURRAO * k * 0.1),
            duration: 0.25,
            ease: 'power2.out',
          })
          .to(p, { dx: 0, dy: 0, duration: 1.2, ease: 'elastic.out(1, 0.6)' });
      }
    }

    function aoSair() {
      cursor.ativo = false;
      acordar();
    }

    let espera = 0;
    function aoRedimensionar() {
      clearTimeout(espera);
      espera = setTimeout(() => {
        montar();
        desenhar();
      }, 120);
    }

    montar();
    desenhar();
    window.addEventListener('resize', aoRedimensionar);
    if (interativo) {
      window.addEventListener('pointermove', aoMover, { passive: true });
      document.documentElement.addEventListener('pointerleave', aoSair);
    }

    return () => {
      cancelAnimationFrame(quadro);
      clearTimeout(espera);
      window.removeEventListener('resize', aoRedimensionar);
      window.removeEventListener('pointermove', aoMover);
      document.documentElement.removeEventListener('pointerleave', aoSair);
      pontos.forEach((p) => gsap.killTweensOf(p));
    };
  }, [reduzido]);

  return <canvas ref={canvasRef} className="fundo-pontos" aria-hidden="true" />;
}
