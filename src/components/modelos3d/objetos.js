/**
 * Os quatro objetos. Cada construtor recebe (dados, ticker, reduz) e devolve as opções do palco:
 * medidas, câmera, monta(P) e anima(segundos). Quantidades e ângulos vêm de lib/modelos3d.js.
 */
import {
  Box3,
  BoxGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { numero } from '../../lib/formato.js';
import {
  AMPLITUDE_BOLSA,
  amplitudePendulo,
  blocosBalanca,
  contarMoedasPl,
  contarMoedasProvento,
  inclinacaoBalanca,
  pilhaCortada,
} from '../../lib/modelos3d.js';
import { TEXTOS } from '../../lib/textos.js';
import { suaviza } from './palco.js';
import { carregarCofrinho } from './precarga.js';

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
/** Brilhos do olho: o grande fica no alto e o pequeno um pouco para o lado; o giro (yaw) desloca os dois. */
function posBrilho(o, yaw) {
  pontoOlho(0.62, yaw, RAIO_OLHO * 0.9, o.grande.position);
  pontoOlho(0.32, yaw - 0.5, RAIO_OLHO * 0.9, o.pequeno.position);
}
/** Piscada: a pálpebra fecha em 60 ms e abre em 120 ms (fechar mais rápido que abrir). */
const FECHA_PISCADA = 0.06;
const ABRE_PISCADA = 0.12;
/** Escala Y da pálpebra: 0 = aberto, 1 = fechado a 0,1. */
function escalaPiscada(dt) {
  if (dt < 0 || dt >= FECHA_PISCADA + ABRE_PISCADA) return 1;
  const q = dt < FECHA_PISCADA ? dt / FECHA_PISCADA : (FECHA_PISCADA + ABRE_PISCADA - dt) / ABRE_PISCADA;
  return 1 - 0.9 * q;
}
/** Squash-and-stretch do pulinho: u vai de 0 a 1; a escala y vai de 0,94 a 1,04 e volta a 1. */
function escalaPulo(u) {
  return u < 0.4 ? 0.94 + 0.1 * (u / 0.4) : 1.04 - 0.04 * ((u - 0.4) / 0.6);
}

/** Cofrinho infantil: corpo de cerâmica rosa, focinho, olhos brilhantes, orelhas e fenda no topo. */
const RAIO_CORPO = 1.6;
const ESC_CORPO = { x: 1.2, y: 1, z: 1.05 };
/** Semieixos do corpo: a base encosta em y = 0 (topo da prateleira) e o centro fica a uma altura de CENTRO_Y. */
const SEMI = { x: RAIO_CORPO * ESC_CORPO.x, y: RAIO_CORPO * ESC_CORPO.y, z: RAIO_CORPO * ESC_CORPO.z };
const CENTRO_Y = SEMI.y;
const ALTURA_PORQUINHO = 2 * SEMI.y;
const RAIO_OLHO = 0.24;
const OLHO_Y = 2.45;
const OLHO_Z = 0.72;
/** Azimute da câmera deste objeto (ver `az` abaixo). */
const AZ_COFRINHO = 0.62;
/**
 * Rotação em y do porquinho (rad). Com o focinho em +x, girar em -π/2 + az põe o focinho na direção da câmera;
 * o -0,25 vira um pouco para a esquerda, em direção às pilhas de moedas. Ajuste este valor para mudar a pose.
 */
const ROTACAO_PORQUINHO = AZ_COFRINHO - Math.PI / 2 - 0.25;
/** Duração do pulinho (s), que começa quando a moeda entra na fenda. */
const DUR_PULO = 0.35;
/** Moeda: espessura, altura de onde cai e fração do ciclo de 4 s em que ela cai. */
const ESP_MOEDA = 0.1;
const ALT_QUEDA_MOEDA = 2;
const CICLO_MOEDA = 4;
const FRACAO_QUEDA = 0.25;
/** Instante do ciclo em que a moeda entra na fenda (s). */
const ENTRADA_MOEDA = FRACAO_QUEDA * CICLO_MOEDA;
/** Tilintar na fenda: a moeda fica 120 ms em escala 1,06 logo depois de entrar. */
const TILINTA_MOEDA = 0.12;
const ESCALA_TILINTA = 1.06;
/** A frente do .glb é +z: esta rotação põe o focinho na mesma direção que o procedural (+x). */
const ROTACAO_GLB = ROTACAO_PORQUINHO + Math.PI / 2;
/** Orelhas: balanço de ±0,08 rad num ciclo de 4 s e abano de ±0,04 no início de cada ciclo (somados, ±0,12). */
const PERIODO_ORELHA = 4;
const BALANCO_ORELHA = 0.08;
const ABANO_ORELHA = 0.04;
/** Olhar do .glb (deslocamento dos brilhos, em un) e rabo (±0,25 rad em 1,2 s). */
const DESLOC_BRILHO = 0.05;
const AMP_RABO = 0.25;
const PERIODO_RABO = 1.2;
/** Entrada do .glb: escala de 0,85 a 1 em 0,35 s com ease-out exponencial. Sem .glb em 4 s, o procedural aparece. */
const ESCALA_ENTRADA = 0.85;
const DUR_ENTRADA = 0.35;
const ESPERA_GLB = 4000;

/** Ease-out exponencial 1 - 2^(-10x), normalizado para valer exatamente 1 em x = 1. */
function suavizaExp(x) {
  const u = Math.min(1, Math.max(0, x));
  return (1 - Math.pow(2, -10 * u)) / (1 - Math.pow(2, -10));
}

/** Ângulo de uma orelha (rad): balanço defasado entre as duas e um abano rápido nos primeiros 0,6 s de cada ciclo. */
function anguloOrelha(s, fase) {
  const ciclo = s % PERIODO_ORELHA;
  const abano = ciclo < 0.6 ? ABANO_ORELHA * Math.sin(2 * Math.PI * 4 * ciclo) * Math.sin((Math.PI * ciclo) / 0.6) : 0;
  return BALANCO_ORELHA * Math.sin((2 * Math.PI * s) / PERIODO_ORELHA + fase) + abano;
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
    return no ? { no, pos: no.position.clone(), rot: no.rotation.clone(), esc: no.scale.clone() } : null;
  };
  return {
    olhoE: pega('OlhoE'),
    olhoD: pega('OlhoD'),
    brilhoE: pega('BrilhoE'),
    brilhoD: pega('BrilhoD'),
    orelhaE: pega('OrelhaE'),
    orelhaD: pega('OrelhaD'),
    rabo: pega('Rabo'),
  };
}

/** Ponto na superfície do corpo, no lado de (y, z), e a normal para fora. O recuo afasta o ponto ao longo da normal. */
function pontoCorpo(y, z, recuo = 0) {
  const dy = (y - CENTRO_Y) / SEMI.y;
  const dz = z / SEMI.z;
  const x = SEMI.x * Math.sqrt(Math.max(0, 1 - dy * dy - dz * dz));
  const n = new Vector3(x / (SEMI.x * SEMI.x), (y - CENTRO_Y) / (SEMI.y * SEMI.y), z / (SEMI.z * SEMI.z)).normalize();
  return { p: new Vector3(x, y, z).addScaledVector(n, recuo), n };
}

export function cofrinho(d, ticker, reduz) {
  const nA = contarMoedasProvento(d.dy);
  const nS = contarMoedasProvento(d.dySetor);
  const H = 0.2;
  // Prateleira: topo da tábua. O porquinho pousa nela pela base (y = 0 do seu grupo).
  const PRAT_TOPO = 1.1;
  // Topo do corpo: é onde a moeda entra na fenda.
  const fendaY = PRAT_TOPO + ALTURA_PORQUINHO;
  const topo = Math.max(8, Math.max(nA, nS) * H + 4);
  const cair = [];
  const caiStack = animaQueda(cair, reduz);
  // Moeda que cai na fenda só aparece quando há proventos nos dados.
  const temProvento = nA > 0;
  let pig;
  let moeda;
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
  let esperaGlb = null;
  let entradaT0 = null;

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
        const envelope = normalizaGlb(gltf.scene.clone(true));
        if (!envelope) {
          mostraProcedural();
          return;
        }
        clearTimeout(esperaGlb);
        glbRaiz = envelope;
        glbGrupo.add(envelope);
        partes = ligaPartes(envelope);
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
      [3.7, 3.0, 2.3, 1.6].forEach((raio, i) => {
        const s = malha(new CircleGeometry(raio, 40), P.M.veu(ESCURO, 0.14 + i * 0.02));
        s.rotation.x = -Math.PI / 2;
        s.scale.set(1.3, 0.8, 1);
        s.position.y = PRAT_TOPO + 0.02 + i * 0.002;
        g.add(s);
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
        const { p, n } = pontoCorpo(OLHO_Y, lado * OLHO_Z, -0.04);
        const grupo = new Group();
        grupo.position.copy(p);
        grupo.quaternion.setFromUnitVectors(EIXO_X, n);
        const globo = malha(new SphereGeometry(RAIO_OLHO, 32, 24), cer(ESCURO, { rough: 0.12, verniz: 1 }));
        const grande = malha(new SphereGeometry(0.08, 16, 12), P.M.solido('--cor-texto'));
        const pequeno = malha(new SphereGeometry(0.04, 12, 10), P.M.solido('--cor-texto'));
        grupo.add(globo, grande, pequeno);
        const o = { grupo, grande, pequeno };
        posBrilho(o, 0);
        return o;
      });

      // Bochechas: discos rosados translúcidos colados na superfície, com a normal para fora.
      const bochechas = [1, -1].map((lado) => {
        const { p, n } = pontoCorpo(2.05, lado * 1.18, 0.02);
        const b = malha(new CircleGeometry(0.3, 32), P.M.veu(BOCHECHA, 0.55));
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
        const externa = malha(new ConeGeometry(0.42, 0.6, 32), cer(ROSA));
        externa.position.y = 0.3;
        externa.scale.set(1, 1, 0.6);
        const ponta = malha(new SphereGeometry(0.1, 16, 12), cer(ROSA));
        ponta.position.y = 0.56;
        ponta.scale.set(1, 1, 0.6);
        const interna = malha(new ConeGeometry(0.26, 0.42, 24), cer(ROSA_FOCINHO));
        interna.position.set(0, 0.22, 0.17);
        interna.scale.set(1, 1, 0.5);
        orelha.add(externa, ponta, interna);
        return orelha;
      });

      // Rabinho enrolado na traseira.
      const rabo = malha(new TorusGeometry(0.18, 0.06, 12, 24, Math.PI * 1.6), cer(ROSA));
      rabo.position.set(-2.1, 1.9, 0);

      // Fenda da moeda: caixa escura fina no topo do corpo, de lado a lado (visível da câmera).
      const fenda = malha(new BoxGeometry(0.18, 0.06, 0.9), cer(ESCURO, { rough: 0.8, verniz: 0 }));
      fenda.position.set(0, ALTURA_PORQUINHO - 0.01, 0);

      pig.add(corpo, focinho, aro, ...narinas, ...olhos.map((o) => o.grupo), ...bochechas, ...orelhas, rabo, fenda);

      // Moeda no grupo da prateleira (não no porco): cai até a fenda, no topo do corpo.
      if (temProvento) {
        moeda = malha(new CylinderGeometry(0.38, 0.38, ESP_MOEDA, 28), P.M.solido(ACENTO_ESCURO));
        moeda.position.set(0, fendaY + ESP_MOEDA / 2, 0);
        // Giro em y depois da inclinação em x: a moeda gira em torno do eixo vertical do mundo enquanto cai.
        moeda.rotation.order = 'YXZ';
        // Com movimento reduzido fica pousada na fenda; senão, a animação a faz cair.
        moeda.visible = reduz;
        g.add(moeda);
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
      // não libere geometrias compartilhadas com o cache. Nada é liberado aqui.
      destruido = true;
      clearTimeout(esperaGlb);
      glbRaiz?.removeFromParent();
    },
    anima(s) {
      const pilha = caiStack(s);
      if (reduz) return pilha;
      // Piscada: pálpebra fecha e abre em 120 ms; a próxima vem em 3 a 5 s. Vale para o procedural e para o .glb.
      if (s >= proximaPiscada) {
        inicioPiscada = s;
        numPiscadas++;
        proximaPiscada = s + 3 + 2 * ((numPiscadas * 0.618) % 1);
      }
      const escala = escalaPiscada(s - inicioPiscada);
      // Respiração de 1 a 1,015 em 3 s e balanço leve em torno da pose de montagem.
      const respira = 1 + 0.0075 * (1 + Math.sin((2 * Math.PI * s) / 3));
      // Pulinho quando a moeda entra na fenda (só com proventos).
      const dt = (s % CICLO_MOEDA) - ENTRADA_MOEDA;
      let sy = 1;
      let sxz = 1;
      if (temProvento && dt >= 0 && dt < DUR_PULO) {
        sy = escalaPulo(dt / DUR_PULO);
        sxz = 1 + (1 - sy) * 0.5;
      }
      // Entrada do .glb: cresce de ESCALA_ENTRADA a 1 em DUR_ENTRADA, a partir do primeiro quadro depois da chegada.
      let entrada = 1;
      if (glbRaiz) {
        if (entradaT0 == null) entradaT0 = s;
        entrada = ESCALA_ENTRADA + (1 - ESCALA_ENTRADA) * suavizaExp((s - entradaT0) / DUR_ENTRADA);
      }
      // Porco procedural, enquanto o .glb não chega.
      if (pig.visible) {
        pig.scale.set(respira * sxz, respira * sy, respira * sxz);
        pig.rotation.y = ROTACAO_PORQUINHO + Math.sin(s * 0.7) * 0.06;
        // Olhar lento de um lado para o outro (~12 s por ida e volta).
        const yaw = 0.45 * Math.sin(s * 0.5);
        for (const o of olhos) posBrilho(o, yaw);
        for (const o of olhos) o.grupo.scale.y = escala;
      }
      // Porco do .glb, quando carregou: mesma respiração e pulinho, e as peças nomeadas do contrato.
      if (partes) {
        glbGrupo.scale.set(entrada * respira * sxz, entrada * respira * sy, entrada * respira * sxz);
        glbGrupo.rotation.y = ROTACAO_GLB + Math.sin(s * 0.7) * 0.06;
        const { olhoE, olhoD, brilhoE, brilhoD, orelhaE, orelhaD, rabo } = partes;
        if (olhoE) olhoE.no.scale.y = olhoE.esc.y * escala;
        if (olhoD) olhoD.no.scale.y = olhoD.esc.y * escala;
        // Olhar: os brilhos deslizam pelo olho no eixo z local (como o procedural).
        const desl = DESLOC_BRILHO * Math.sin(s * 0.5);
        if (brilhoE) brilhoE.no.position.set(brilhoE.pos.x, brilhoE.pos.y, brilhoE.pos.z + desl);
        if (brilhoD) brilhoD.no.position.set(brilhoD.pos.x, brilhoD.pos.y, brilhoD.pos.z + desl);
        if (orelhaE) orelhaE.no.rotation.z = orelhaE.rot.z + anguloOrelha(s, 0);
        if (orelhaD) orelhaD.no.rotation.z = orelhaD.rot.z + anguloOrelha(s, Math.PI);
        if (rabo) rabo.no.rotation.y = rabo.rot.y + AMP_RABO * Math.sin((2 * Math.PI * s) / PERIODO_RABO);
      }
      if (moeda) {
        const p = (s % CICLO_MOEDA) / CICLO_MOEDA;
        if (p < FRACAO_QUEDA) {
          // Cai do alto até a fenda, virando de pé para chapada e dando 2 voltas em y.
          const q = p / FRACAO_QUEDA;
          moeda.visible = true;
          moeda.position.y = fendaY + ESP_MOEDA / 2 + ALT_QUEDA_MOEDA * (1 - q * q);
          moeda.rotation.x = (Math.PI / 2) * (1 - q);
          moeda.rotation.y = 4 * Math.PI * q;
          moeda.scale.setScalar(1);
        } else if (temProvento && dt >= 0 && dt < TILINTA_MOEDA) {
          // Ao entrar na fenda, tilinta por 120 ms e some.
          moeda.visible = true;
          moeda.position.y = fendaY + ESP_MOEDA / 2;
          moeda.rotation.set(0, 0, 0);
          moeda.scale.setScalar(ESCALA_TILINTA);
        } else {
          moeda.visible = false;
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
const SOLTURA_PENDULO = 0.6;
const COMPRIMENTO_HASTE = 5.2;

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
  return {
    altura: 9.6,
    largura: 12,
    alvo: [0, 3.3, 0],
    az: 0.18,
    elev: 0.16,
    monta(P) {
      const pes = [-4.6, 4.6].map((x) => {
        const p = P.peca(new BoxGeometry(0.3, 7.4, 0.3), METAL, { solido: true });
        p.position.set(x, 3.7, 0);
        return p;
      });
      const topo = P.peca(new BoxGeometry(9.8, 0.3, 0.4), METAL, { solido: true });
      topo.position.y = 7.4;
      const base = P.peca(new BoxGeometry(10.6, 0.25, 2.4), CHAO, { solido: true });
      base.position.y = 0.12;
      P.cena.add(...pes, topo, base);
      const L = COMPRIMENTO_HASTE;
      const faz = (x, amp, tok, nome) => {
        const g = new Group();
        g.position.set(x, 7.25, 0);
        g.add(P.linha([[0, 0, 0], [0, -L, 0]]));
        const b = P.peca(new SphereGeometry(0.62, 24, 16), tok, { solido: true, arestas: false });
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
      pI = faz(-2.2, A0, TRACO, R.bolsa);
      pA = faz(2.2, Aa, '--cor-acento', R.acaoBeta(ticker, numero(d.beta, { casas: 2 })));
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
      return true;
    },
  };
}

export const CONSTRUTORES = { balanca, moedas, cofrinho, pendulo };
