/**
 * Os quatro objetos. Cada construtor recebe (dados, ticker, reduz) e devolve as opções do palco:
 * medidas, câmera, monta(P) e anima(segundos). Quantidades e ângulos vêm de lib/modelos3d.js.
 */
import {
  Box3,
  BoxGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  OctahedronGeometry,
  Raycaster,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { abanoDasOrelhas, abanoDoRabo, formaDoCofrinho, olhoContente } from '../../lib/cofrinho3d.js';
import { numero } from '../../lib/formato.js';
import {
  AMPLITUDE_BOLSA,
  amplitudePendulo,
  blocosBalanca,
  contarMoedasPl,
  contarMoedasProvento,
  FRACAO_PERNA,
  inclinacaoBalanca,
  medidasPernas,
  pilhaCortada,
  MEDIDAS_PENDULO,
} from '../../lib/modelos3d.js';
import { TEXTOS } from '../../lib/textos.js';
import { suaviza } from './palco.js';
import { carregarCofrinho } from './precarga.js';
import { criaAnimaPavio, criarPavio3D, escalaPiscada, pivoBraco } from './pavio3d.js';

const R = TEXTOS.modelos3d.rotulos;
// Metal grafite (texto suave misturado ao fundo): haste escura, pratos um tom mais claros, chão mais escuro.
const METAL = ['--cor-texto-suave', '--cor-fundo', 0.7];
const METAL_CLARO = ['--cor-texto-suave', '--cor-fundo', 0.42];
const CHAO = ['--cor-texto-suave', '--cor-fundo', 0.86];
// Acento (neutro) escurecido 25% sobre o fundo, com contorno escuro.
const ACENTO_ESCURO = ['--cor-acento', '--cor-fundo', 0.25];
const CONTORNO_ESCURO = { tracoTok: '--cor-fundo', tracoOp: 0.7 };
const TRACO = '--cor-texto-suave';
const finito = (v) => typeof v === 'number' && Number.isFinite(v);
const n1 = (v) => numero(v, { casas: 1 });
const reais = (frac) => `R$ ${numero(frac * 100, { casas: 2 })}`;

/** Queda de cada moeda: 0,35 s com ease-out. Ao assentar, afunda 2% da espessura (0,12 s) e volta: sem quique. */
const DUR_QUEDA = 0.35;
const DUR_ASSENTA = 0.12;
const AFUNDA_MOEDA = 0.02 * 0.2;

/** Moedas caindo uma a uma até a pilha; com movimento reduzido já nascem no lugar. */
function animaQueda(cair, reduz) {
  let t0 = null;
  return (s) => {
    if (reduz) return false;
    if (t0 == null) t0 = s;
    const t = s - t0;
    let mexendo = false;
    for (const o of cair) {
      const p = (t - o.at) / DUR_QUEDA;
      if (p < 1) {
        mexendo = true;
        o.m.position.y = o.y0 + (o.y - o.y0) * suaviza(p);
        continue;
      }
      const q = (t - o.at - DUR_QUEDA) / DUR_ASSENTA;
      if (q < 1) {
        mexendo = true;
        o.m.position.y = o.y - AFUNDA_MOEDA * Math.sin(Math.PI * q);
      } else {
        o.m.position.y = o.y;
      }
    }
    return mexendo;
  };
}

export function balanca(d, ticker, reduz) {
  const { caixa, divida } = blocosBalanca(d.dlEbitda);
  const alvoAng = inclinacaoBalanca(d.dlEbitda);
  let ang = 0;
  let viga;
  let pE;
  let pD;
  let rE;
  let rD;
  let aura;
  let tAnt = null;
  let animaPav = null;
  return {
    altura: 9.5,
    largura: 13,
    alvo: [0, 3.2, 0],
    az: 0.35,
    elev: 0.28,
    monta(P) {
      const pe = P.peca(new CylinderGeometry(2.2, 2.6, 0.45, 40), CHAO, { solido: true });
      pe.position.y = 0.22;
      const poste = P.peca(new CylinderGeometry(0.18, 0.18, 5, 16), METAL, { solido: true });
      poste.position.y = 2.9;
      viga = new Group();
      viga.position.y = 5.4;
      viga.add(P.peca(new BoxGeometry(10, 0.3, 0.42), METAL, { solido: true }));
      viga.add(P.peca(new SphereGeometry(0.42, 20, 14), '--cor-acento', { solido: true, arestas: false }));
      // Aura clara translúcida sobre a viga: pulsa devagar (sem movimento reduzido, fica apagada).
      aura = new Mesh(new BoxGeometry(10.14, 0.44, 0.56), P.M.veu('--cor-acento', 0));
      aura.visible = !reduz;
      viga.add(aura);
      // Cotinha em pé sobre o fulcro, no meio da viga: como é filho da viga, acompanha a inclinação.
      const pavio = criarPavio3D({ escala: 2.1, M: P.M });
      pavio.grupo.position.set(0, 0.42, 0);
      viga.add(pavio.grupo);
      animaPav = reduz ? null : criaAnimaPavio(pavio);
      P.cena.add(pe, poste, viga);
      const prato = () => {
        const g = new Group();
        g.add(P.linha([[-1.2, -2.3, 0], [0, 0, 0], [1.2, -2.3, 0]]));
        const p = P.peca(new CylinderGeometry(1.75, 1.45, 0.22, 40), METAL_CLARO, { solido: true });
        p.position.y = -2.4;
        g.add(p);
        P.cena.add(g);
        return g;
      };
      pE = prato();
      pD = prato();
      const bloco = (g, n, tok) => {
        for (let i = 0; i < n; i++) {
          const b = P.peca(new BoxGeometry(0.9, 0.5, 0.9), tok, { solido: true, ...CONTORNO_ESCURO });
          b.position.set(((i % 3) - 1) * 0.98, -2.04 + Math.floor(i / 3) * 0.52, 0);
          g.add(b);
        }
      };
      bloco(pE, caixa, '--cor-alta');
      bloco(pD, divida, '--cor-queda');
      rE = P.rotulo(R.caixa, [0, 0, 0]);
      rD = P.rotulo(R.divida, [0, 0, 0]);
    },
    anima(t) {
      // dt limitado: ao voltar de aba oculta a balança não dá um salto
      const dt = tAnt == null ? 0 : Math.min(0.05, t - tAnt);
      tAnt = t;
      const dif = alvoAng - ang;
      const assentada = Math.abs(dif) < 0.0005 && ang !== 0;
      if (!assentada) {
        // 7% por 1/60 s, qualquer que seja a taxa de quadros
        ang += reduz ? dif : dif * (1 - Math.pow(1 - 0.07, dt * 60));
        viga.rotation.z = -ang;
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        pE.position.set(-4.6 * c, 5.4 + 4.6 * s, 0);
        pD.position.set(4.6 * c, 5.4 - 4.6 * s, 0);
        rE.pos.set(pE.position.x, pE.position.y - 3.3, 0);
        rD.pos.set(pD.position.x, pD.position.y - 3.3, 0);
      }
      if (reduz) return false;
      animaPav?.(t);
      // Pulso da aura (translúcida, então o pulso é de opacidade): de 0 a 0,35 e de volta a 0 em 3 s.
      aura.material.opacity = 0.35 * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 3));
      return true;
    },
  };
}

export function moedas(d, ticker, reduz) {
  const nA = contarMoedasPl(d.pl);
  const nS = contarMoedasPl(d.plSetor);
  const H = 0.2;
  const topo = Math.max(7, Math.max(nA, nS) * H + 3.6);
  const cair = [];
  // Reflexo claro que sobe por cada pilha em loop de 4 s, depois que as moedas assentam.
  const reflexos = [];
  const caiPilha = animaQueda(cair, reduz);
  let t0 = null;
  let animaPav = null;
  return {
    altura: topo,
    largura: 9,
    alvo: [0, topo / 2 - 1.2, 0],
    az: 0.5,
    elev: 0.32,
    monta(P) {
      const base = P.peca(new BoxGeometry(8.4, 0.2, 3.4), CHAO, { solido: true });
      base.position.y = -0.1;
      P.cena.add(base);
      // Cotinha de pé no chão, encostada na pilha maior (a da ação, se empatar). Se a maior é a do setor, espelha.
      const maior = nS > nA;
      const pavio = criarPavio3D({ escala: 1.4, bracos: 'apoiado', M: P.M });
      pavio.grupo.position.set(maior ? 3.7 : -3.7, 0, 0);
      pavio.grupo.rotation.z = maior ? 0.08 : -0.08;
      if (maior) pavio.grupo.scale.x = -1;
      P.cena.add(pavio.grupo);
      animaPav = reduz ? null : criaAnimaPavio(pavio);
      const geo = new CylinderGeometry(1.05, 1.05, H * 0.92, 40);
      [
        [-2.1, nA, false],
        [2.1, nS, true],
      ].forEach(([x, n, setor], j) => {
        for (let i = 0; i < n; i++) {
          const m = P.peca(geo, setor ? METAL_CLARO : ACENTO_ESCURO, { ang: 40, solido: setor, ...CONTORNO_ESCURO });
          const y = H / 2 + i * H;
          m.position.set(x, reduz ? y : y + 6 + i * 0.02, 0);
          P.cena.add(m);
          cair.push({ m, y, y0: m.position.y, at: i * 0.045 + j * 0.15 });
        }
        if (n > 0) {
          const texto = setor ? R.setor(n1(d.plSetor)) : R.acaoAnos(ticker, n1(d.pl), pilhaCortada(d.pl));
          P.rotulo(texto, [x, n * H + 0.9, 0]);
          if (!reduz) {
            const reflexo = new Mesh(new CylinderGeometry(1.12, 1.12, 0.5, 40, 1, true), P.M.veu('--cor-acento', 0));
            reflexo.position.x = x;
            reflexo.visible = false;
            P.cena.add(reflexo);
            reflexos.push({ m: reflexo, topo: n * H, atraso: 2 + j * 0.4 });
          }
        }
      });
    },
    anima(s) {
      const mexendo = caiPilha(s);
      if (reduz) return mexendo;
      animaPav?.(s);
      if (t0 == null) t0 = s;
      for (const r of reflexos) {
        const t = s - t0 - r.atraso;
        r.m.visible = t >= 0;
        if (t < 0) continue;
        const p = (t % 4) / 4;
        r.m.position.y = -0.25 + p * (r.topo + 0.5);
        r.m.material.opacity = 0.22 * Math.sin(Math.PI * p);
      }
      return true;
    },
  };
}

/** Grava em `alvo` o ponto de raio r na direção (elevação el, giro yw) em torno do eixo +x do olho (+x aponta para fora). */
function pontoOlho(el, yw, r, alvo) {
  return alvo.set(r * Math.cos(el) * Math.cos(yw), r * Math.sin(el), r * Math.cos(el) * Math.sin(yw));
}
/** Brilho do olho: fica no alto da frente do olho oval; o giro (yaw) desloca o brilho. */
function posBrilho(o, yaw) {
  // dentro da casca do olho (0,62 do raio em profundidade), para o brilho não sair como bolinha branca
  pontoOlho(0.55, yaw, 0.6, o.grande.position).multiply(o.semi);
}
/** Olho no estilo do Cotinha: oval vertical escuro (frente em +x do grupo), com um pontinho de brilho branco. */
function criaOlho(P, raio) {
  const grupo = new Group();
  const semi = new Vector3(0.5 * raio, raio, 0.65 * raio);
  // fosco: o verniz do material físico deixava o olho escuro quase branco de lado
  const globo = new Mesh(new SphereGeometry(1, 32, 24), P.M.solido('--cor-mascote-olho'));
  globo.scale.copy(semi);
  const grande = new Mesh(new SphereGeometry(raio * 0.28, 16, 12), P.M.solido('--cor-mascote-brilho'));
  grupo.add(globo, grande);
  return { grupo, grande, semi };
}
/** Cofrinho infantil: corpo de cerâmica rosa, focinho, olhos brilhantes, orelhas e fenda no topo. */
const RAIO_CORPO = 1.6;
const ESC_CORPO = { x: 1.12, y: 1, z: 1.04 };
/** Semieixos do corpo: a base encosta em y = 0 (topo da prateleira) e o centro fica a uma altura de CENTRO_Y. */
const SEMI = { x: RAIO_CORPO * ESC_CORPO.x, y: RAIO_CORPO * ESC_CORPO.y, z: RAIO_CORPO * ESC_CORPO.z };
const CENTRO_Y = SEMI.y;
const ALTURA_CORPO = 2 * SEMI.y;
/** Altura total, com as pernas: é a medida do .glb normalizado e o que define a altura da fenda. */
const ALTURA_PORQUINHO = ALTURA_CORPO * (1 + FRACAO_PERNA);
const RAIO_OLHO = 0.21;
const OLHO_Y = 2.45;
const OLHO_Z = 0.72;
/** Azimute da câmera deste objeto (ver `az` abaixo). */
const AZ_COFRINHO = 0.62;
/**
 * Rotação em y do porquinho (rad). Com o focinho em +x, girar em -π/2 + az põe o focinho na direção da câmera;
 * o -0,25 vira um pouco para a esquerda, em direção às pilhas de moedas. Ajuste este valor para mudar a pose.
 */
const ROTACAO_PORQUINHO = AZ_COFRINHO - Math.PI / 2 - 0.25;
/** Moeda: espessura e fração do ciclo de 4 s em que ela cai (a queda começa na mão, em SOLTURA_MOEDA). */
const ESP_MOEDA = 0.1;
const CICLO_MOEDA = 4;
/** Depois de tocar a fenda, a moeda segue para dentro do corpo em 120 ms e some atrás dele, sem estalo. */
const ENGOLE_MOEDA = 0.12;
/** A frente do .glb é +z: esta rotação põe o focinho na mesma direção que o procedural (+x). */
const ROTACAO_GLB = ROTACAO_PORQUINHO + Math.PI / 2;
/** Orelhas: balanço calmo de ±0,06 rad num ciclo de 4 s; o abano vem da moeda (lib/cofrinho3d.js). */
const PERIODO_ORELHA = 4;
const BALANCO_ORELHA = 0.06;
/** Rabo do .glb: balanço calmo de ±0,12 rad em 2,4 s; a moeda faz ele abanar mais. */
const AMP_RABO = 0.12;
const PERIODO_RABO = 2.4;
/** Entrada do .glb: escala de 0,85 a 1 em 0,35 s com ease-out exponencial. Sem .glb em 4 s, o procedural aparece. */
const ESCALA_ENTRADA = 0.85;
const DUR_ENTRADA = 0.35;
const ESPERA_GLB = 4000;
/** Prateleira: topo da tábua (y). O porquinho pousa nela pela base. */
const PRAT_TOPO = 1.1;
/**
 * Cotinha sentado em cima do porco, ao lado da fenda e de frente para a câmera. O braço direito pende sobre a
 * fenda (x = 0, z = 0 no referencial do porco) com a moeda em pé.
 */
const ESCALA_PAVIO = 2;
const COMPRIMENTO_BRACO = 0.2;
/** Giro do Cotinha no referencial do porco: desfaz o giro do porco para ele olhar para a câmera. */
const GIRO_PAVIO = Math.PI / 2 + 0.25;
/** Centro do Cotinha (x, z) no porco: o ombro direito fica logo acima da fenda. */
const CENTRO_PAVIO = {
  x: -pivoBraco(1).x * ESCALA_PAVIO * Math.cos(GIRO_PAVIO),
  z: pivoBraco(1).x * ESCALA_PAVIO * Math.sin(GIRO_PAVIO),
};
/** Raio da moeda que o Cotinha põe na fenda. */
const RAIO_MOEDA_FENDA = 0.3;
/**
 * Ciclo da moeda (s, de 4 s): a moeda nova surge na mão erguida em 3,2. O braço baixa até a fenda entre 0,55 e
 * 1,0, solta, e ela entra em 1,4 (pulinho e tilintar). O braço descansa e sobe de novo entre 2,6 e 3,2.
 */
const SOLTURA_MOEDA = 1.0;
const ENTRADA_MOEDA = 1.4;
const INICIO_DESCIDA = 0.55;
const INICIO_SUBIDA = 2.6;
const PEGA_MOEDA = 3.2;
/** Moeda nova cresce de 0 a 1 em 0,35 s, e o brilhinho da mão dura 0,6 s (só com movimento normal). */
const DUR_MOEDA_NOVA = 0.35;
const DUR_BRILHO = 0.6;
/** Onde o brilhinho fica em relação à mão, no lombo: ao lado do Cotinha, acima da moeda e mais perto da câmera. */
const DESLOC_BRILHO = new Vector3(0.35, 0.3, -0.25);
/** Tamanho máximo da estrela do brilhinho. */
const TAM_BRILHO = 0.6;
/** Braço direito erguido com a moeda (rad, eixo z; 0 = pendido sobre a fenda) e o balanço enquanto a segura. */
const ANG_ERGUIDO = 2.1;
const BALANCO_BRACO = 0.08;
/** Tokens do porquinho: pele e focinho claros de cerâmica; a cor sai dos tokens, não do arquivo. */
const PELE = '--cor-porquinho';
const PELE_FOCINHO = '--cor-porquinho-focinho';
/** Casco (ponta da perna): token fixo do tema, rosa escurecido. */
const ROSA_CASCO = '--cor-mascote-casco';

/** Smoothstep: 0 em x = 0, 1 em x = 1, com entrada e saída suaves. */
const suavizaSS = (x) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};

/** Altura da superfície do corpo sobre (x, z), no referencial do porco (com as pernas). */
const alturaDorso = (x, z) => {
  const u = 1 - (x / SEMI.x) ** 2 - (z / SEMI.z) ** 2;
  return ALTURA_CORPO * FRACAO_PERNA + CENTRO_Y + SEMI.y * Math.sqrt(Math.max(0, u));
};
const interpola = (a, b, u) => a + (b - a) * suavizaSS(u);
/** Balanço da mão erguida: uma ida e volta entre PEGA_MOEDA e INICIO_DESCIDA, zerando nas pontas para não dar salto. */
const balancoErguido = (ph) => {
  const janela = CICLO_MOEDA - PEGA_MOEDA + INICIO_DESCIDA;
  const u = (ph >= PEGA_MOEDA ? ph - PEGA_MOEDA : ph + CICLO_MOEDA - PEGA_MOEDA) / janela;
  return BALANCO_BRACO * Math.sin(2 * Math.PI * u);
};
/** Ângulo do braço direito no ciclo de 4 s: erguido com a moeda, baixa até a fenda, descansa e sobe de novo. */
const anguloBraco = (ph) => {
  if (ph < INICIO_DESCIDA) return ANG_ERGUIDO + balancoErguido(ph);
  if (ph < SOLTURA_MOEDA) return interpola(ANG_ERGUIDO, 0, (ph - INICIO_DESCIDA) / (SOLTURA_MOEDA - INICIO_DESCIDA));
  if (ph < INICIO_SUBIDA) return 0;
  if (ph < PEGA_MOEDA) return interpola(0, ANG_ERGUIDO, (ph - INICIO_SUBIDA) / (PEGA_MOEDA - INICIO_SUBIDA));
  return ANG_ERGUIDO + balancoErguido(ph);
};

/** Ease-out exponencial 1 - 2^(-10x), normalizado para valer exatamente 1 em x = 1. */
function suavizaExp(x) {
  const u = Math.min(1, Math.max(0, x));
  return (1 - Math.pow(2, -10 * u)) / (1 - Math.pow(2, -10));
}

/** Ângulo de uma orelha (rad): balanço defasado entre as duas. */
function anguloOrelha(s, fase) {
  return BALANCO_ORELHA * Math.sin((2 * Math.PI * s) / PERIODO_ORELHA + fase);
}

/** Centra o .glb em x/z, apoia a base em y = 0 e escala a altura para ALTURA_PORQUINHO. Tira luzes e câmeras. Sem volume: null. */
function normalizaGlb(raiz) {
  if (!raiz) return null;
  const intrusos = [];
  raiz.traverse((o) => {
    if (o.isLight || o.isCamera) intrusos.push(o);
  });
  intrusos.forEach((o) => o.removeFromParent());
  raiz.updateMatrixWorld(true);
  const caixa = new Box3().setFromObject(raiz);
  const medida = caixa.getSize(new Vector3());
  if (caixa.isEmpty() || !(medida.y > 0)) return null;
  const centro = caixa.getCenter(new Vector3());
  raiz.position.set(-centro.x, -caixa.min.y, -centro.z);
  const envelope = new Group();
  envelope.scale.setScalar(ALTURA_PORQUINHO / medida.y);
  envelope.add(raiz);
  return envelope;
}

/** Peças nomeadas do .glb (contrato do Blender) com a pose de montagem, para voltar a ela a cada quadro. */
function ligaPartes(raiz) {
  const pega = (nome) => {
    const no = raiz.getObjectByName(nome);
    return no ? { no, pos: no.position.clone(), rot: no.rotation.clone() } : null;
  };
  return {
    olhoE: pega('OlhoE'),
    olhoD: pega('OlhoD'),
    orelhaE: pega('OrelhaE'),
    orelhaD: pega('OrelhaD'),
    rabo: pega('Rabo'),
  };
}

/**
 * Quatro perninhas medidas pela caixa do corpo: cápsulas um pouco mais grossas e mais curtas que a medida,
 * com a ponta (casco) numa tampa de meia esfera escura. Devolve as malhas e as geometrias (para liberar).
 */
function criaPernas(caixa, material, materialCasco) {
  const { raio, miolo, centros } = medidasPernas(caixa);
  // Perna mais fina; o miolo cresce o que o raio perdeu, para a altura total (e o pé no chão) não mudar.
  const r = raio * 0.85;
  const m = miolo * 0.7 + 2 * (raio * 1.2 - r);
  const geo = new CapsuleGeometry(r, m, 10, 24);
  const geoCasco = new SphereGeometry(r * 1.01, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const malhas = [];
  centros.forEach(([x, y, z]) => {
    const perna = new Mesh(geo, material);
    perna.position.set(x, y, z);
    // Casco achatado e um pouco mais largo que a perna: a pata assenta no chão (a base fica no pé da cápsula).
    const casco = new Mesh(geoCasco, materialCasco);
    casco.scale.set(1.15, 0.6, 1.15);
    casco.position.set(x, y - m / 2 - 0.4 * r, z);
    malhas.push(perna, casco);
  });
  return { malhas, geos: [geo, geoCasco] };
}

/**
 * Põe as pernas na raiz do .glb. Devolve as geometrias, para liberar depois; os materiais vêm do palco e são
 * liberados por ele.
 */
function poePernasNoGlb(raiz, material, materialCasco) {
  const corpo = raiz.getObjectByName('Corpo');
  if (!corpo?.isMesh) return null;
  raiz.updateMatrixWorld(true);
  const { malhas, geos } = criaPernas(new Box3().setFromObject(corpo), material, materialCasco);
  raiz.add(...malhas);
  return { geos };
}

/**
 * Troca o acabamento do .glb pelo do palco (cerâmica com verniz, como o Cotinha), peça por peça. Só muda a malha
 * deste clone: os materiais do cache ficam intactos.
 */
function vesteGlb(raiz, P) {
  const pele = P.M.ceramica(PELE, { rough: 0.36, verniz: 0.55 });
  const focinho = P.M.ceramica(PELE_FOCINHO, { rough: 0.38, verniz: 0.45 });
  // as orelhas são cascas finas, vistas dos dois lados, como no arquivo
  pele.side = DoubleSide;
  focinho.side = DoubleSide;
  const porMaterial = {
    'Cofrinho Corpo': pele,
    'Cofrinho Focinho': focinho,
    'Cofrinho Bochecha': P.M.veu('--cor-mascote-bochecha', 0.7),
  };
  raiz.traverse((o) => {
    if (o.isMesh && porMaterial[o.material?.name]) o.material = porMaterial[o.material.name];
  });
  return pele;
}

/** Ponto da superfície do corpo do .glb visto de `origem` em direção a `alvo` (no envelope). Sem acerto: null. */
function pontoGlb(envelope, corpo, origem, alvo) {
  const de = envelope.localToWorld(origem.clone());
  const para = envelope.localToWorld(alvo.clone());
  const acerto = new Raycaster(de, para.sub(de).normalize()).intersectObject(corpo, true)[0];
  return acerto ? envelope.worldToLocal(acerto.point.clone()) : null;
}

/** Fita fina que acompanha a superfície do corpo; `pares` são [origem, alvo] de cada raio. */
function fitaNoCorpo(envelope, corpo, pares, raio, material, recuo) {
  const pontos = pares.map(([o, a]) => {
    const p = pontoGlb(envelope, corpo, o, a);
    return p?.addScaledVector(o.clone().sub(a).normalize(), recuo);
  });
  if (pontos.some((p) => !p)) return null;
  return new Mesh(new TubeGeometry(new CatmullRomCurve3(pontos), 24, raio, 8, false), material);
}

/**
 * Sorriso sob o focinho e reflexo no dorso (o mesmo traço claro do Cotinha). Ficam no envelope, sobre a superfície
 * medida por raios: seguem o corpo que vier no arquivo. Devolve as malhas criadas.
 */
function poeDetalhesGlb(envelope, P) {
  const corpo = envelope.getObjectByName('Corpo');
  const focinho = envelope.getObjectByName('Focinho');
  if (!corpo || !focinho) return [];
  envelope.updateMatrixWorld(true);
  const k = envelope.getWorldScale(new Vector3()).x;
  const caixa = new Box3().setFromObject(corpo);
  const centro = envelope.worldToLocal(caixa.getCenter(new Vector3()));
  const medida = caixa.getSize(new Vector3()).divideScalar(k);
  const caixaF = new Box3().setFromObject(focinho);
  const centroF = envelope.worldToLocal(caixaF.getCenter(new Vector3()));
  const altF = caixaF.getSize(new Vector3()).y / k;
  // sorriso: arco curto logo abaixo do focinho, num rosa escuro, para ser um detalhe e não um risco
  const larg = medida.x * 0.09;
  const pares = [-1, -0.5, 0, 0.5, 1].map((u) => {
    const y = centroF.y - altF * 0.66 + altF * 0.16 * u * u;
    const x = centroF.x + larg * u;
    return [new Vector3(x, y, centro.z + medida.z * 2), new Vector3(x, y, centro.z)];
  });
  const sorriso = fitaNoCorpo(envelope, corpo, pares, medida.x * 0.008, P.M.solido('--cor-porquinho-traco'), 0.004);
  // brilho: traço pequeno no alto do lado esquerdo do quadro, o mesmo lado do reflexo do Cotinha
  const paresReflexo = [0, 1, 2].map((i) => {
    const elev = 0.82 + i * 0.09;
    const azim = 2.3;
    const dir = new Vector3(Math.cos(azim) * Math.cos(elev), Math.sin(elev), Math.sin(azim) * Math.cos(elev));
    return [centro.clone().add(dir.multiply(medida).multiplyScalar(1.4)), centro];
  });
  const reflexo = fitaNoCorpo(envelope, corpo, paresReflexo, medida.x * 0.009, P.M.veu('--cor-mascote-brilho', 0.6), 0.012);
  const malhas = [sorriso, reflexo].filter(Boolean);
  if (malhas.length) envelope.add(...malhas);
  return malhas;
}

/**
 * Olhos no estilo do Cotinha sobre os do .glb, que ficam ocultos. Ficam na posição dos nós OlhoE/OlhoD e
 * são filhos da raiz do .glb (com o tamanho desfeito da escala, para medir na unidade do arquivo).
 */
function poeOlhosGlb(envelope, partes, P) {
  const k = envelope.scale.x;
  return ['olhoE', 'olhoD']
    .map((nome) => partes[nome]?.no)
    .filter(Boolean)
    .map((no) => {
      no.visible = false;
      const pos = new Vector3();
      no.getWorldPosition(pos);
      envelope.worldToLocal(pos);
      const o = criaOlho(P, RAIO_OLHO / k);
      o.grupo.position.copy(pos);
      // a frente do olho (+x do grupo) aponta para +z, que é a frente do .glb
      o.grupo.rotation.y = -Math.PI / 2;
      posBrilho(o, 0);
      envelope.add(o.grupo);
      return o;
    });
}

/** Ponto na superfície do corpo, no lado de (y, z), e a normal para fora. O recuo afasta o ponto ao longo da normal. */
function pontoCorpo(y, z, recuo = 0) {
  const dy = (y - CENTRO_Y) / SEMI.y;
  const dz = z / SEMI.z;
  const x = SEMI.x * Math.sqrt(Math.max(0, 1 - dy * dy - dz * dz));
  const n = new Vector3(x / (SEMI.x * SEMI.x), (y - CENTRO_Y) / (SEMI.y * SEMI.y), z / (SEMI.z * SEMI.z)).normalize();
  return { p: new Vector3(x, y, z).addScaledVector(n, recuo), n };
}

/** Altura do dorso do .glb sobre (x, z) do referencial do porco: um raio de cima para baixo. Sem acerto: null. */
function alturaGlb(envelope, x, z) {
  const ref = envelope.parent;
  ref.updateWorldMatrix(true, true);
  // o lombo gira -π/2 dentro do grupo do .glb; o ponto passa pelo mesmo giro
  const p = new Vector3(x, 0, z).applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2);
  const origem = ref.localToWorld(new Vector3(p.x, ALTURA_PORQUINHO * 3, p.z));
  const acerto = new Raycaster(origem, new Vector3(0, -1, 0)).intersectObject(envelope, true)[0];
  return acerto ? ref.worldToLocal(acerto.point.clone()).y : null;
}

export function cofrinho(d, ticker, reduz) {
  const nA = contarMoedasProvento(d.dy);
  const nS = contarMoedasProvento(d.dySetor);
  const H = 0.2;
  // Ponto da fenda onde a moeda entra (no lombo, que segue o porco). A altura vem do dorso de cada porco.
  const ALVO_MOEDA = new Vector3(0, ALTURA_PORQUINHO, 0);
  const topo = Math.max(8, Math.max(nA, nS) * H + 4);
  const cair = [];
  const caiStack = animaQueda(cair, reduz);
  // Moeda que cai na fenda só aparece quando há proventos nos dados.
  const temProvento = nA > 0;
  let pig;
  let moeda;
  let brilhoMao = null;
  let olhos = [];
  // Piscadas a cada 3 a 5 s (intervalo variado de forma determinística).
  let proximaPiscada = 2.2;
  let inicioPiscada = -Infinity;
  let numPiscadas = 0;
  // Porco .glb (quando chega) e suas peças. O procedural só aparece se o .glb falhar ou passar de ESPERA_GLB.
  let destruido = false;
  let palco = null;
  let glbGrupo = null;
  let glbRaiz = null;
  let partes = null;
  let olhosGlb = [];
  let pernasGlb = null;
  let detalhesGlb = [];
  let sombras = [];
  let esperaGlb = null;
  let entradaT0 = null;
  // Cotinha sobre o lombo: anima o corpo (respiração e piscada) e o braço que segura a moeda.
  // O lombo é o grupo do Cotinha e da moeda; fica no porco procedural e passa para o .glb quando ele chega.
  let lombo = null;
  let pavio = null;
  let animaPav = null;
  // Mão no instante da soltura (no lombo): de onde a moeda desce reta.
  const maoSolta = new Vector3();

  /** Senta o Cotinha no dorso (altura(x, z) no referencial do porco) e põe a fenda na altura do dorso. */
  function assentaPavio(altura) {
    const yFenda = altura(0, 0);
    // a moeda termina meio enfiada na fenda
    if (yFenda != null) ALVO_MOEDA.y = yFenda - RAIO_MOEDA_FENDA * 0.5;
    const yBase = altura(CENTRO_PAVIO.x, CENTRO_PAVIO.z) ?? ALVO_MOEDA.y;
    // a ponta do pavio de baixo afunda no dorso: ele fica sentado, não em pé
    pavio.grupo.position.set(CENTRO_PAVIO.x, yBase - 0.05 * ESCALA_PAVIO, CENTRO_PAVIO.z);
    // braço direito pendido sobre a fenda (a pose 'soltos' o deixa solto)
    pavio.bracos[1].rotation.z = 0;
    maoSolta.copy(centroMoeda());
    // começa (e fica, com movimento reduzido) com o braço erguido, a moeda à vista
    pavio.bracos[1].rotation.z = ANG_ERGUIDO;
    moeda?.position.copy(centroMoeda());
  }

  /** Centro da moeda (no lombo): além da ponta da mão, na direção do braço, para não ficar dentro dele. */
  function centroMoeda() {
    const mao = pavio.grupoMao[1];
    const ombro = pavio.bracos[1];
    mao.updateWorldMatrix(true, false);
    lombo.updateWorldMatrix(true, false);
    const ponta = lombo.worldToLocal(mao.getWorldPosition(new Vector3()));
    const raiz = lombo.worldToLocal(ombro.getWorldPosition(new Vector3()));
    const direcao = ponta.clone().sub(raiz).normalize();
    return ponta.addScaledVector(direcao, RAIO_MOEDA_FENDA * 1.05);
  }

  /** Mostra o procedural (falha do .glb ou espera longa). Se o .glb chegar depois, ele assume. */
  function mostraProcedural() {
    if (destruido || glbRaiz) return;
    pig.visible = true;
    palco?.redesenha?.();
  }

  /** Pega o .glb (cache de precarga) e põe um clone na cena. Sem o .glb em ESPERA_GLB, mostra o procedural. */
  function carregaGlb() {
    esperaGlb = setTimeout(mostraProcedural, ESPERA_GLB);
    carregarCofrinho()
      .then((gltf) => {
        if (destruido) return;
        // Clone: compartilha geometrias e materiais com o cache, por isso não é liberado aqui.
        // As pernas entram antes de normalizar, para os pés pousarem na prateleira.
        const raiz = gltf.scene.clone(true);
        const pele = vesteGlb(raiz, palco);
        pernasGlb = poePernasNoGlb(raiz, pele, palco.M.solido(ROSA_CASCO));
        const envelope = normalizaGlb(raiz);
        if (!envelope) {
          mostraProcedural();
          return;
        }
        clearTimeout(esperaGlb);
        glbRaiz = envelope;
        glbGrupo.add(envelope);
        // O Cotinha passa para o .glb: o lombo gira -π/2 para ficar no mesmo lugar no palco.
        lombo.rotation.y = -Math.PI / 2;
        glbGrupo.add(lombo);
        assentaPavio((x, z) => alturaGlb(envelope, x, z));
        partes = ligaPartes(envelope);
        olhosGlb = poeOlhosGlb(envelope, partes, palco);
        detalhesGlb = poeDetalhesGlb(envelope, palco);
        pig.visible = false;
        glbGrupo.visible = true;
        palco?.redesenha?.();
      })
      .catch(mostraProcedural);
  }

  return {
    altura: topo,
    largura: 14,
    alvo: [0, topo / 2 - 1, 0],
    az: AZ_COFRINHO,
    elev: 0.3,
    monta(P) {
      // Tábua da prateleira sobre dois suportes em L (apoiados no chão).
      const tabua = P.peca(new BoxGeometry(12.4, 0.3, 4.4), CHAO, { solido: true });
      tabua.position.y = PRAT_TOPO - 0.15;
      const suportes = [-5.2, 5.2].map((x) => {
        const s = P.peca(new BoxGeometry(0.35, PRAT_TOPO - 0.3, 3.6), METAL, { solido: true });
        s.position.set(x, (PRAT_TOPO - 0.3) / 2, 0);
        return s;
      });
      P.cena.add(tabua, ...suportes);
      const g = new Group();
      g.position.set(2.6, 0, 0);
      P.cena.add(g);

      const ROSA = ['--cor-dado-7', '--cor-queda', 0.2];
      const ROSA_FOCINHO = ['--cor-dado-7', '--cor-queda', 0.55];
      const BOCHECHA = ['--cor-queda', '--cor-dado-7', 0.3];
      const ESCURO = '--cor-fundo';
      const UP = new Vector3(0, 1, 0);
      const EIXO_X = new Vector3(1, 0, 0);
      const malha = (geo, mat) => new Mesh(geo, mat);
      const cer = (tok, o) => P.M.ceramica(tok, o);

      // Sombra de contato: discos escuros translúcidos empilhados (mais denso no centro).
      sombras = [3.7, 3.0, 2.3, 1.6].map((raio, i) => {
        const s = malha(new CircleGeometry(raio, 40), P.M.veu(ESCURO, 0.14 + i * 0.02));
        s.rotation.x = -Math.PI / 2;
        s.scale.set(1.3, 0.8, 1);
        s.position.y = PRAT_TOPO + 0.02 + i * 0.002;
        g.add(s);
        return s;
      });

      // Porquinho: a origem fica sobre a tábua, então a respiração e o pulinho partem da base.
      // Começa invisível: enquanto o .glb carrega, nenhum porco procedural aparece (ver mostraProcedural).
      pig = new Group();
      pig.position.y = PRAT_TOPO;
      pig.rotation.y = ROTACAO_PORQUINHO;
      pig.visible = false;
      g.add(pig);

      const corpo = malha(new SphereGeometry(RAIO_CORPO, 48, 32), cer(ROSA));
      corpo.scale.set(ESC_CORPO.x, ESC_CORPO.y, ESC_CORPO.z);
      corpo.position.y = CENTRO_Y;

      // Focinho: cilindro deitado em +x, com um aro fino na borda da face.
      const focinho = malha(new CylinderGeometry(0.55, 0.6, 0.38, 40), cer(ROSA_FOCINHO, { rough: 0.5 }));
      focinho.rotation.z = -Math.PI / 2;
      focinho.position.set(1.98, 1.5, 0);
      const aro = malha(new TorusGeometry(0.56, 0.035, 12, 40), cer(ROSA_FOCINHO, { rough: 0.5 }));
      aro.rotation.y = Math.PI / 2;
      aro.position.set(2.17, 1.5, 0);

      // Narinas: ovais, achatadas no eixo x (a face do focinho).
      const narinas = [0.13, -0.13].map((z) => {
        const n = malha(new SphereGeometry(0.1, 16, 12), cer(ESCURO, { rough: 0.7, verniz: 0 }));
        n.scale.set(1, 1.25, 0.35);
        n.rotation.y = Math.PI / 2;
        n.position.set(2.15, 1.5, z);
        return n;
      });

      // Cada olho é um grupo (globo + brilhos) assentado na superfície, com a frente na normal.
      // O grupo achata em Y para a piscada.
      olhos = [1, -1].map((lado) => {
        const { p, n } = pontoCorpo(OLHO_Y, lado * OLHO_Z, -0.02);
        const o = criaOlho(P, RAIO_OLHO);
        o.grupo.position.copy(p);
        o.grupo.quaternion.setFromUnitVectors(EIXO_X, n);
        posBrilho(o, 0);
        return o;
      });

      // Bochechas: discos rosados translúcidos colados na superfície, com a normal para fora.
      const bochechas = [1, -1].map((lado) => {
        const { p, n } = pontoCorpo(2.05, lado * 1.18, 0.02);
        const b = malha(new CircleGeometry(0.34, 32), P.M.veu(BOCHECHA, 0.6));
        b.position.copy(p);
        b.rotation.y = Math.atan2(n.x, n.z);
        return b;
      });

      // Orelhas: cone achatado com a ponta arredondada, inclinado para a frente; a parte interna fica um pouco à frente.
      const orelhas = [1, -1].map((lado) => {
        const { p } = pontoCorpo(2.7, lado * 0.95, -0.12);
        const dir = new Vector3(0.35, 1, 0.55 * lado).normalize();
        const orelha = new Group();
        orelha.position.copy(p);
        orelha.quaternion.setFromUnitVectors(UP, dir);
        const externa = malha(new ConeGeometry(0.46, 0.66, 32), cer(ROSA));
        externa.position.y = 0.33;
        externa.scale.set(1, 1, 0.6);
        const ponta = malha(new SphereGeometry(0.1, 16, 12), cer(ROSA));
        ponta.position.y = 0.6;
        ponta.scale.set(1, 1, 0.6);
        const interna = malha(new ConeGeometry(0.26, 0.42, 24), cer(ROSA_FOCINHO));
        interna.position.set(0, 0.22, 0.17);
        interna.scale.set(1, 1, 0.5);
        orelha.add(externa, ponta, interna);
        return orelha;
      });

      // Rabinho em espiral enrolada na traseira (uma volta e meia, mais grossa que um fio).
      const pontosRabo = Array.from({ length: 14 }, (_, i) => {
        const t = i / 13;
        const a = Math.PI * 0.4 + t * Math.PI * 2.6;
        const r = 0.2 - 0.09 * t;
        return new Vector3(-0.3 * t, r * Math.sin(a), r * Math.cos(a));
      });
      const rabo = malha(new TubeGeometry(new CatmullRomCurve3(pontosRabo), 40, 0.055, 10, false), cer(ROSA));
      rabo.position.set(-2.1, 1.9, 0);

      // Fenda da moeda: caixa escura fina no topo do corpo, de lado a lado (visível da câmera).
      const fenda = malha(new BoxGeometry(0.18, 0.06, 0.9), cer(ESCURO, { rough: 0.8, verniz: 0 }));
      fenda.position.set(0, ALTURA_CORPO - 0.01, 0);

      // Pernas: o corpo sobe a altura delas, e os pés ficam na origem de `pig`, sobre a tábua.
      const pernas = criaPernas(
        { min: { x: -SEMI.x, y: 0, z: -SEMI.z }, max: { x: SEMI.x, y: ALTURA_CORPO, z: SEMI.z } },
        cer(ROSA),
        P.M.solido(ROSA_CASCO),
      ).malhas;
      const montado = new Group();
      montado.position.y = ALTURA_CORPO * FRACAO_PERNA;
      montado.add(corpo, focinho, aro, ...narinas, ...olhos.map((o) => o.grupo), ...bochechas, ...orelhas, rabo, fenda, ...pernas);
      pig.add(montado);

      // Cotinha sentado no lombo, do lado da cauda, com a base sobre o dorso. O braço direito (+x) pende sobre a
      // fenda e solta a moeda; comprimento e ângulos saem da posição do ombro, em unidades do Cotinha.
      lombo = new Group();
      pig.add(lombo);
      pavio = criarPavio3D({ escala: ESCALA_PAVIO, comprimentoBraco: COMPRIMENTO_BRACO, M: P.M });
      pavio.grupo.rotation.y = GIRO_PAVIO;
      lombo.add(pavio.grupo);
      assentaPavio(alturaDorso);
      // o braço direito é da moeda (abaixo); o esquerdo fica livre para a respiração
      const animaCorpo = criaAnimaPavio(pavio, { bracosLivres: [0] });
      animaPav = reduz
        ? null
        : (s) => {
            animaCorpo(s);
            pavio.bracos[1].rotation.z = anguloBraco(s % CICLO_MOEDA);
          };

      // Moeda: segurada na mão, sobre a fenda; com movimento reduzido fica ali, parada.
      if (temProvento) {
        moeda = malha(new CylinderGeometry(RAIO_MOEDA_FENDA, RAIO_MOEDA_FENDA, ESP_MOEDA, 28), P.M.solido('--cor-atencao'));
        // Em pé, de face para a câmera, alinhada com a fenda (que corre em z).
        moeda.rotation.set(0, 0, Math.PI / 2);
        moeda.position.copy(centroMoeda());
        // Com movimento reduzido fica parada na mão; senão, a animação a solta na fenda.
        moeda.visible = reduz;
        lombo.add(moeda);
        // Brilhinho de 4 pontas: duas lâminas finas cruzadas. Sem movimento reduzido, não existe.
        if (!reduz) {
          const lamina = new OctahedronGeometry(1, 0);
          brilhoMao = new Group();
          brilhoMao.visible = false;
          // de frente para a câmera, como o Cotinha
          brilhoMao.rotation.y = GIRO_PAVIO;
          for (const rz of [0, Math.PI / 2]) {
            const m = malha(lamina, P.M.solido('--cor-mascote-brilho'));
            m.rotation.z = rz;
            m.scale.set(0.16, 1, 0.16);
            brilhoMao.add(m);
          }
          lombo.add(brilhoMao);
        }
      }

      // Porco .glb: o grupo fica invisível até o arquivo chegar.
      palco = P;
      glbGrupo = new Group();
      glbGrupo.position.y = PRAT_TOPO;
      glbGrupo.rotation.y = ROTACAO_GLB;
      glbGrupo.visible = false;
      g.add(glbGrupo);
      carregaGlb();

      const geo = new CylinderGeometry(0.75, 0.75, H * 0.9, 36);
      [
        [-4.4, nA, false],
        [-2.0, nS, true],
      ].forEach(([x, n, setor], j) => {
        for (let i = 0; i < n; i++) {
          const m = P.peca(geo, setor ? METAL_CLARO : ACENTO_ESCURO, { ang: 40, solido: setor, ...CONTORNO_ESCURO });
          const y = PRAT_TOPO + H / 2 + i * H;
          m.position.set(x, reduz ? y : y + 6, 0.4);
          P.cena.add(m);
          cair.push({ m, y, y0: m.position.y, at: j * 0.25 + i * 0.06 });
        }
        if (setor ? finito(d.dySetor) : finito(d.dy)) {
          const texto = setor ? R.setorReais(reais(d.dySetor)) : R.acaoReais(ticker, reais(d.dy));
          P.rotulo(texto, [x, PRAT_TOPO + Math.max(n, 1) * H + 0.9, 0.4]);
        }
      });
    },
    aoDestruir() {
      // Roda antes de o palco percorrer a cena para dar dispose: tira o clone do .glb da cena, para que o palco
      // não libere geometrias compartilhadas com o cache. Só as pernas, que são deste clone, são liberadas aqui.
      destruido = true;
      clearTimeout(esperaGlb);
      glbRaiz?.removeFromParent();
      pernasGlb?.geos.forEach((g) => g.dispose());
      detalhesGlb.forEach((m) => m.geometry.dispose());
      // Os olhos do Cotinha sobre o .glb saem junto com ele, então as geometrias deles são liberadas aqui.
      olhosGlb.forEach((o) => o.grupo.traverse((x) => x.geometry?.dispose()));
    },
    anima(s) {
      const pilha = caiStack(s);
      if (reduz) return pilha;
      animaPav?.(s);
      // Piscada: pálpebra fecha e abre em 120 ms; a próxima vem em 3 a 5 s. Vale para o procedural e para o .glb.
      if (s >= proximaPiscada) {
        inicioPiscada = s;
        numPiscadas++;
        proximaPiscada = s + 3 + 2 * ((numPiscadas * 0.618) % 1);
      }
      const escala = escalaPiscada(s - inicioPiscada);
      // Respiração de 1 a 1,015 em 3 s e balanço leve em torno da pose de montagem.
      const respira = 1 + 0.0075 * (1 + Math.sin((2 * Math.PI * s) / 3));
      // Tempo desde a moeda entrar na fenda; sem proventos, nada reage.
      const dt = (s % CICLO_MOEDA) - ENTRADA_MOEDA;
      const reacao = temProvento ? dt : -Infinity;
      const { altura, escalaY, inclina } = formaDoCofrinho(reacao);
      const sxz = 1 + (1 - escalaY) * 0.5;
      // Entrada do .glb: cresce de ESCALA_ENTRADA a 1 em DUR_ENTRADA, a partir do primeiro quadro depois da chegada.
      let entrada = 1;
      if (glbRaiz) {
        if (entradaT0 == null) entradaT0 = s;
        entrada = ESCALA_ENTRADA + (1 - ESCALA_ENTRADA) * suavizaExp((s - entradaT0) / DUR_ENTRADA);
      }
      // Um corpo só recebe a coreografia: o .glb quando carregou, senão o procedural.
      const ativo = partes ? glbGrupo : pig.visible ? pig : null;
      if (ativo) {
        ativo.scale.set(entrada * respira * sxz, entrada * respira * escalaY, entrada * respira * sxz);
        ativo.position.y = PRAT_TOPO + altura;
        ativo.rotation.y = (partes ? ROTACAO_GLB : ROTACAO_PORQUINHO) + Math.sin(s * 0.7) * 0.06;
        ativo.rotation.z = inclina;
      }
      // A sombra encolhe enquanto ele está no ar.
      const sombra = 1 - altura * 0.5;
      sombras.forEach((d) => d.scale.set(1.3 * sombra, 0.8 * sombra, 1));
      // Olhar lento de um lado para o outro (~12 s por ida e volta), nos olhos procedurais e nos do .glb.
      const yaw = 0.35 * Math.sin(s * 0.5);
      const contente = olhoContente(reacao);
      for (const o of [...olhos, ...olhosGlb]) {
        posBrilho(o, yaw);
        o.grupo.scale.y = Math.min(escala, contente);
      }
      // Orelhas e rabo do .glb: balanço calmo, mais o abano que a moeda provoca.
      if (partes) {
        const { orelhaE, orelhaD, rabo } = partes;
        const abano = abanoDasOrelhas(reacao);
        if (orelhaE) orelhaE.no.rotation.z = orelhaE.rot.z + anguloOrelha(s, 0) + abano;
        if (orelhaD) orelhaD.no.rotation.z = orelhaD.rot.z + anguloOrelha(s, Math.PI) - abano;
        if (rabo) rabo.no.rotation.y = rabo.rot.y + AMP_RABO * Math.sin((2 * Math.PI * s) / PERIODO_RABO) + abanoDoRabo(reacao);
      }
      if (moeda) {
        const ph = s % CICLO_MOEDA;
        if (ph < SOLTURA_MOEDA || ph >= PEGA_MOEDA) {
          // Na mão do Cotinha, sobre a fenda, até soltar; some ao cair e volta quando ele pega de novo.
          // A moeda nova cresce de 0 a 1 logo depois de PEGA_MOEDA.
          moeda.visible = true;
          moeda.position.copy(centroMoeda());
          moeda.rotation.set(0, 0, Math.PI / 2);
          moeda.scale.setScalar(ph >= PEGA_MOEDA ? suavizaExp((ph - PEGA_MOEDA) / DUR_MOEDA_NOVA) : 1);
        } else if (ph < ENTRADA_MOEDA) {
          // Cai reta da mão até a fenda, acelerando como queda de verdade.
          const u = ((ph - SOLTURA_MOEDA) / (ENTRADA_MOEDA - SOLTURA_MOEDA)) ** 2;
          moeda.visible = true;
          moeda.position.lerpVectors(maoSolta, ALVO_MOEDA, u);
          moeda.rotation.set(0, 0, Math.PI / 2);
          moeda.scale.setScalar(1);
        } else if (temProvento && dt >= 0 && dt < ENGOLE_MOEDA) {
          // Segue fenda adentro: o próprio corpo esconde a moeda.
          moeda.visible = true;
          moeda.position.copy(ALVO_MOEDA);
          moeda.position.y -= RAIO_MOEDA_FENDA * 2.2 * (dt / ENGOLE_MOEDA);
          moeda.rotation.set(0, 0, Math.PI / 2);
          moeda.scale.setScalar(1);
        } else {
          moeda.visible = false;
        }
      }
      // Brilhinho na mão: cresce, gira um pouco e some em DUR_BRILHO, logo depois de a moeda nova aparecer.
      if (brilhoMao) {
        const ph = s % CICLO_MOEDA;
        const ativo = ph >= PEGA_MOEDA && ph < PEGA_MOEDA + DUR_BRILHO;
        brilhoMao.visible = ativo;
        if (ativo) {
          const u = (ph - PEGA_MOEDA) / DUR_BRILHO;
          brilhoMao.position.copy(centroMoeda()).add(DESLOC_BRILHO);
          brilhoMao.rotation.z = u * 0.6;
          brilhoMao.scale.setScalar(TAM_BRILHO * Math.sin(Math.PI * u));
        }
      }
      return true;
    },
  };
}
/** Pêndulo: solta do repouso a 0,6 rad e assenta num movimento de período fixo. */
const PERIODO_PENDULO = 2.2;
const OMEGA_PENDULO = (2 * Math.PI) / PERIODO_PENDULO;
/** Amortecimento (1/s): o transitório da soltura some em uns 4 s. */
const GAMA_PENDULO = 0.9;
const SOLTURA_PENDULO = MEDIDAS_PENDULO.soltura;
const COMPRIMENTO_HASTE = MEDIDAS_PENDULO.haste;

/**
 * Ângulo (rad) de um pêndulo amortecido de amplitude A, t segundos depois da soltura. Solto do repouso em
 * SOLTURA_PENDULO, o transitório decai com e^(-γt) e a oscilação estável fica em ±A (velocidade inicial nula).
 */
function oscila(A, t) {
  const fase = OMEGA_PENDULO * t;
  const transitorio = Math.exp(-GAMA_PENDULO * t) * (Math.cos(fase) + (GAMA_PENDULO / OMEGA_PENDULO) * Math.sin(fase));
  return A * Math.cos(fase) + (SOLTURA_PENDULO - A) * transitorio;
}

/** Move um pêndulo ao instante tt: haste e o brilho que corre no peso. */
function moveP(p, tt) {
  p.g.rotation.z = oscila(p.amp, tt);
  // O brilho varre a face iluminada (lado +x e +z) de um lado ao outro em cada período.
  const th = Math.sin((2 * Math.PI * tt) / PERIODO_PENDULO);
  const raio = 0.635;
  p.brilho.position.set(raio * Math.sin(th), -COMPRIMENTO_HASTE + 0.18, raio * Math.cos(th));
  p.brilho.material.opacity = 0.9 * (0.4 + 0.6 * Math.cos(th));
}

export function pendulo(d, ticker, reduz) {
  const A0 = AMPLITUDE_BOLSA;
  const Aa = amplitudePendulo(d.beta) ?? A0;
  let pI;
  let pA;
  let t0 = null;
  let animaPav = null;
  return {
    // altura inclui o Cotinha sentado na quina do topo, inteira no quadro
    altura: 11,
    largura: 14.4,
    alvo: [0, 3.9, 0],
    az: 0.18,
    elev: 0.16,
    monta(P) {
      const { coluna, meiaColuna, eixo, raio } = MEDIDAS_PENDULO;
      const pes = [-coluna, coluna].map((x) => {
        const p = P.peca(new BoxGeometry(meiaColuna * 2, 7.4, 0.3), METAL, { solido: true });
        p.position.set(x, 3.7, 0);
        return p;
      });
      const topo = P.peca(new BoxGeometry(coluna * 2 + 0.6, 0.3, 0.4), METAL, { solido: true });
      topo.position.y = 7.4;
      const base = P.peca(new BoxGeometry(coluna * 2 + 1.4, 0.25, 2.4), CHAO, { solido: true });
      base.position.y = 0.12;
      P.cena.add(...pes, topo, base);
      // Cotinha sentado reto na quina direita da travessa; o pavio de baixo pende para fora da quina.
      const pavio = criarPavio3D({ escala: 1.76, M: P.M });
      pavio.grupo.position.set(coluna + 0.35, 7.55, 0);
      pavio.grupo.rotation.z = 0.15;
      P.cena.add(pavio.grupo);
      animaPav = reduz ? null : criaAnimaPavio(pavio);
      const L = COMPRIMENTO_HASTE;
      const faz = (x, amp, tok, nome) => {
        const g = new Group();
        g.position.set(x, 7.25, 0);
        g.add(P.linha([[0, 0, 0], [0, -L, 0]]));
        const b = P.peca(new SphereGeometry(raio, 24, 16), tok, { solido: true, arestas: false });
        b.position.y = -L;
        g.add(b);
        P.cena.add(g);
        const arco = [];
        for (let k = 0; k <= 32; k++) {
          const th = -amp + (2 * amp * k) / 32;
          arco.push([x + Math.sin(th) * L, 7.25 - Math.cos(th) * L, 0]);
        }
        P.cena.add(P.linha(arco, TRACO, 0.5));
        P.rotulo(nome, [x, -0.5, 1.2]);
        const p = { g, amp, brilho: null };
        // Movimento reduzido: sem brilho, só a pose final.
        if (!reduz) {
          p.brilho = new Mesh(new SphereGeometry(0.1, 12, 8), P.M.veu('--cor-texto', 0.9));
          p.brilho.position.y = -L;
          g.add(p.brilho);
        }
        return p;
      };
      pI = faz(-eixo, A0, TRACO, R.bolsa);
      pA = faz(eixo, Aa, '--cor-acento', R.acaoBeta(ticker, numero(d.beta, { casas: 2 })));
      if (reduz) {
        pI.g.rotation.z = A0;
        pA.g.rotation.z = Aa;
      }
    },
    anima(s) {
      if (reduz) return false;
      if (t0 == null) t0 = s;
      const tt = s - t0;
      moveP(pI, tt);
      moveP(pA, tt);
      animaPav?.(s);
      return true;
    },
  };
}

export const CONSTRUTORES = { balanca, moedas, cofrinho, pendulo };
