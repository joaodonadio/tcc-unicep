/**
 * Motor 3D em traço de manual: câmera ortográfica, peças com preenchimento chapado + arestas,
 * rótulos HTML projetados, arrastar para girar. Só desenha quando algo mexe (animação, arrasto,
 * tamanho ou tema) e só enquanto o palco está visível. Cores vêm dos tokens CSS do tema.
 */
import {
  BackSide,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  FrontSide,
  Group,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { alturaVisivel } from '../../lib/modelos3d.js';
export { suportaWebGL, reduzMovimento } from './suporte.js';

/** Cor de um token CSS (ex.: '--cor-acento') como THREE.Color; [tokA, tokB, t] mistura duas. */
function lerCor(ancora, token) {
  if (Array.isArray(token)) {
    const [a, b, t = 0.5] = token;
    return lerCor(ancora, a).lerp(lerCor(ancora, b), t);
  }
  const sonda = document.createElement('i');
  sonda.style.color = `var(${token})`;
  sonda.style.display = 'none';
  ancora.appendChild(sonda);
  const cor = getComputedStyle(sonda).color;
  sonda.remove();
  const n = cor.match(/[\d.]+/g) || [0, 0, 0];
  return new Color(n[0] / 255, n[1] / 255, n[2] / 255);
}

export const suaviza = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

/**
 * opcoes: { container, canvas, rotulos, altura, largura, proximidade (padrão 1), alvo, az, elev, arrastar (padrão true), monta(P),
 * anima(segundos), aoDestruir() }.
 * anima devolve true enquanto ainda há movimento.
 * api: { cena, M, peca, linha, rotulo, cam, canvas, redesenha(), vista(az, elev), destruir() }.
 */
export function criarPalco(opcoes) {
  const { container, canvas, rotulos: rotEl } = opcoes;
  const r = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const cena = new Scene();
  const cam = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  const alvo = new Vector3(...(opcoes.alvo || [0, 0, 0]));
  let az = opcoes.az ?? 0.65;
  let elev = opcoes.elev ?? 0.55;
  let sujo = true;
  let arrastando = false;
  let px = 0;
  let py = 0;
  let vivo = true;
  let visivel = true;
  let agendado = false;
  let raf = 0;
  // Tamanho do container, guardado em enquadra(): os rótulos não leem clientWidth a cada quadro.
  let larg = 0;
  let alt = 0;
  // A animação estava rodando no quadro anterior: desenha mais um quadro para fixar a pose final.
  let animAnterior = false;
  const materiais = [];
  const rots = [];
  // Só afetam materiais com volume (solido); as peças chapadas ignoram luz.
  // Hemisférica (céu quente, chão escuro) + direcional suave de cima e da frente.
  const luzDir = new DirectionalLight(0xfff4e6, 1.25);
  luzDir.position.set(4, 14, 12);
  cena.add(new HemisphereLight(0xfff1dc, 0x2b2622, 1.7), luzDir);

  const M = {
    /** op < 1 deixa a peça translúcida. */
    chapa(tok, op) {
      const m = new MeshBasicMaterial({
        transparent: op != null,
        opacity: op ?? 1,
        side: op != null ? DoubleSide : FrontSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        depthWrite: op == null,
      });
      materiais.push([m, tok]);
      return m;
    },
    traco(tok, op = 0.6) {
      const m = new LineBasicMaterial({ transparent: true, opacity: op, depthWrite: false });
      materiais.push([m, tok]);
      return m;
    },
    /** Material opaco com volume (recebe as luzes do palco). */
    solido(tok) {
      const m = new MeshLambertMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      materiais.push([m, tok]);
      return m;
    },
    /** Cerâmica esmaltada: rugosidade média e verniz leve para o brilho especular. */
    ceramica(tok, o = {}) {
      const m = new MeshPhysicalMaterial({
        roughness: o.rough ?? 0.45,
        metalness: 0,
        clearcoat: o.verniz ?? 0.5,
        clearcoatRoughness: 0.25,
      });
      materiais.push([m, tok]);
      return m;
    },
    /** Véu translúcido sem escrita de profundidade (bochechas, sombra de contato). */
    veu(tok, op) {
      const m = new MeshBasicMaterial({ transparent: true, opacity: op, side: DoubleSide, depthWrite: false });
      materiais.push([m, tok]);
      return m;
    },
    casco(tok) {
      const m = new MeshBasicMaterial({ side: BackSide });
      materiais.push([m, tok]);
      return m;
    },
  };

  function retinge() {
    materiais.forEach(([m, t]) => m.color.copy(lerCor(container, t)));
    sujo = true;
    loop();
  }

  /** Peça: preenchimento chapado + arestas finas claras. */
  function peca(geo, tok, o = {}) {
    const g = new Group();
    g.add(new Mesh(geo, o.solido ? M.solido(tok) : M.chapa(tok, o.op)));
    if (o.arestas !== false) {
      g.add(new LineSegments(new EdgesGeometry(geo, o.ang ?? 30), M.traco(o.tracoTok || '--cor-texto', o.tracoOp)));
    }
    if (o.casco) {
      const h = new Mesh(geo, M.casco(o.cascoTok || '--cor-texto-suave'));
      h.scale.setScalar(o.casco);
      g.add(h);
    }
    return g;
  }

  function linha(pts, tok = '--cor-texto-suave', op = 0.8) {
    return new Line(new BufferGeometry().setFromPoints(pts.map((p) => new Vector3(...p))), M.traco(tok, op));
  }

  function rotulo(texto, pos, classe = '') {
    const e = document.createElement('span');
    e.className = `modelo3d-rot ${classe}`.trim();
    e.textContent = texto;
    rotEl.appendChild(e);
    const o = { e, pos: new Vector3(...pos) };
    rots.push(o);
    return o;
  }

  function enquadra() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    larg = w;
    alt = h;
    if (!w || !h) return;
    r.setSize(w, h, false);
    const asp = w / h;
    const H = alturaVisivel(opcoes, asp);
    cam.left = (-H * asp) / 2;
    cam.right = (H * asp) / 2;
    cam.top = H / 2;
    cam.bottom = -H / 2;
    cam.updateProjectionMatrix();
    sujo = true;
    loop();
  }

  function posCam() {
    const d = 60;
    cam.position.set(
      alvo.x + d * Math.cos(elev) * Math.sin(az),
      alvo.y + d * Math.sin(elev),
      alvo.z + d * Math.cos(elev) * Math.cos(az),
    );
    cam.lookAt(alvo);
  }

  const v = new Vector3();
  function poeRotulos() {
    rots.forEach((o) => {
      v.copy(o.pos).project(cam);
      o.e.style.transform = `translate(${((v.x + 1) / 2) * larg}px, ${((1 - v.y) / 2) * alt}px) translate(-50%, -50%)`;
    });
  }

  const aoPressionar = (e) => {
    arrastando = true;
    px = e.clientX;
    py = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const aoMover = (e) => {
    if (!arrastando) return;
    const dx = e.clientX - px;
    const dy = e.clientY - py;
    px = e.clientX;
    py = e.clientY;
    az -= dx * 0.01;
    elev = Math.max(0.12, Math.min(1.2, elev + dy * 0.006));
    sujo = true;
    loop();
  };
  const aoSoltar = () => {
    arrastando = false;
  };
  // arrastar: false deixa a câmera para quem monta (ex.: parallax das colunas de setores)
  if (opcoes.arrastar !== false) {
    canvas.addEventListener('pointerdown', aoPressionar);
    canvas.addEventListener('pointermove', aoMover);
    canvas.addEventListener('pointerup', aoSoltar);
    canvas.addEventListener('pointercancel', aoSoltar);
  }

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(enquadra) : null;
  ro?.observe(container);
  const io =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((es) => {
          visivel = es[0].isIntersecting;
          if (visivel) loop();
        })
      : null;
  io?.observe(container);
  const mo = new MutationObserver(retinge);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function loop() {
    if (agendado || !vivo) return;
    agendado = true;
    raf = requestAnimationFrame(quadro);
  }
  function quadro(t) {
    agendado = false;
    if (!vivo || !visivel) return;
    const anim = opcoes.anima ? opcoes.anima(t / 1000) : false;
    if (anim || sujo || animAnterior) {
      posCam();
      r.render(cena, cam);
      poeRotulos();
      sujo = false;
    }
    animAnterior = anim;
    if (anim) loop();
  }

  const api = {
    cena,
    M,
    peca,
    linha,
    rotulo,
    cam,
    canvas,
    /** Pede um quadro (algo mudou por fora: dados, destaque). */
    redesenha() {
      sujo = true;
      loop();
    },
    /** Posiciona a câmera por fora (az/elev em radianos). */
    vista(novoAz, novaElev) {
      az = novoAz;
      elev = novaElev;
      sujo = true;
      loop();
    },
    destruir() {
      opcoes.aoDestruir?.();
      vivo = false;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      io?.disconnect();
      mo.disconnect();
      canvas.removeEventListener('pointerdown', aoPressionar);
      canvas.removeEventListener('pointermove', aoMover);
      canvas.removeEventListener('pointerup', aoSoltar);
      canvas.removeEventListener('pointercancel', aoSoltar);
      cena.traverse((o) => {
        o.geometry?.dispose();
      });
      materiais.forEach(([m]) => m.dispose());
      r.dispose();
      r.forceContextLoss?.();
      rots.forEach((o) => o.e.remove());
    },
  };
  opcoes.monta(api);
  retinge();
  enquadra();
  return api;
}
