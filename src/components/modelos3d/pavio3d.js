/**
 * Cotinha 3D: o mascote (vela de gráfico com olhos) montado em three.js, fiel ao desenho 2D de ui/Mascote.jsx.
 * Origem do grupo: ponta de baixo do pavio de baixo, para o Cotinha "pousar" pelo pé. Funções de montagem e de
 * animação ociosa; quem chama decide onde pôr o grupo na cena.
 */
import {
  CapsuleGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** Medidas em unidades do palco (corpo 0,42 × 0,56 × 0,36, como a proporção do 2D). */
const LARGURA = 0.42;
const ALTURA = 0.56;
const PROFUNDIDADE = 0.36;
const RAIO_CANTO = 0.165;
const PAVIO_BAIXO = 0.15;
const PAVIO_CIMA = 0.15;
const RAIO_PAVIO = 0.028;
const RAIO_BRACO = 0.045;
const RAIO_MAO = 0.056;
const COMPRIMENTO_BRACO = 0.26;
/** Altura total (ponta de baixo ao topo do pavio de cima). */
export const ALTURA_PAVIO = PAVIO_BAIXO + ALTURA + PAVIO_CIMA;
/** Base do corpo na origem do grupo. */
const BASE_CORPO = PAVIO_BAIXO;
const CENTRO_CORPO = BASE_CORPO + ALTURA / 2;
/** Metades do miolo reto do corpo: a curva das arestas (raio RAIO_CANTO) fica por fora delas. */
const MEIA_X = LARGURA / 2 - RAIO_CANTO;
const MEIA_Y = ALTURA / 2 - RAIO_CANTO;
const MEIA_Z = PROFUNDIDADE / 2 - RAIO_CANTO;
/** Olhos: ovais verticais, em x ±0,07 e y 0,46 (como o 2D), levemente embutidos na frente. */
const OLHO_X = 0.07;
const OLHO_Y = BASE_CORPO + ALTURA - 0.25;
const OLHO_RX = 0.05;
const OLHO_RY = 0.1;
const OLHO_RZ = 0.04;
const OLHO_RECUO = 0.02;
/** Luz própria do corpo (emissivo): o verde-água da marca aparece sob a luz do palco. */
const EMISSAO_CORPO = 0.2;
/** Ponto de articulação do braço, dentro da borda do corpo. */
export const PIVO_BRACO = { x: LARGURA / 2 - 0.02, y: CENTRO_CORPO - 0.04 };
const EIXO_Z = new Vector3(0, 0, 1);

/** Ângulos dos braços (rad, eixo z; 0 = pendurado): esquerdo (-x) e direito (+x). */
const ANGULOS = {
  soltos: [-0.35, 0.35],
  segurando: [-2.2, 0.35],
  apoiado: [-0.35, 1.45],
};
export const POSES_BRACOS = Object.keys(ANGULOS);

/** Cores de reserva (os tokens --cor-mascote-* do CSS, quando o palco não os resolve). */
const RESERVA = {
  '--cor-mascote': '#5fc9c0',
  '--cor-mascote-olho': '#111113',
  '--cor-mascote-brilho': '#ffffff',
  '--cor-mascote-bochecha': '#f08fa8',
};
/** Materiais padrão, para uso sem o palco (testes): ignoram o tema e usam a reserva. */
const MATERIAIS_PADRAO = {
  ceramica: (tok) => new MeshStandardMaterial({ color: RESERVA[tok] ?? tok, roughness: 0.4 }),
  solido: (tok) => new MeshLambertMaterial({ color: RESERVA[tok] ?? tok }),
  veu: (tok, op) =>
    new MeshBasicMaterial({ color: RESERVA[tok] ?? tok, transparent: true, opacity: op, side: DoubleSide, depthWrite: false }),
};

/** Piscada: a pálpebra fecha em 60 ms e abre em 120 ms (fechar mais rápido que abrir). */
const FECHA_PISCADA = 0.06;
const ABRE_PISCADA = 0.12;
/** Olhar: trocas de direção (deslocamento em x e y, em unidades do Cotinha) entre um e outro. */
const OLHARES = [
  [0.01, 0],
  [-0.01, 0.005],
  [0, -0.008],
  [-0.01, -0.006],
  [0.01, 0.008],
  [0, 0],
];

/** Escala Y da pálpebra: 1 = aberto, 0,1 = fechado. */
export function escalaPiscada(dt) {
  if (dt < 0 || dt >= FECHA_PISCADA + ABRE_PISCADA) return 1;
  const q = dt < FECHA_PISCADA ? dt / FECHA_PISCADA : (FECHA_PISCADA + ABRE_PISCADA - dt) / ABRE_PISCADA;
  return 1 - 0.9 * q;
}

/**
 * Ponto da frente do corpo em (x, y), seguindo a curva das arestas, e a normal ali.
 * afasta: quanto sair ao longo da normal (negativo entra no corpo). y é do grupo, como o olho.
 */
function frenteEm(x, y, afasta = 0) {
  const cx = Math.max(-MEIA_X, Math.min(MEIA_X, x));
  const cy = Math.max(-MEIA_Y, Math.min(MEIA_Y, y - CENTRO_CORPO)) + CENTRO_CORPO;
  const dx = x - cx;
  const dy = y - cy;
  const nz = Math.sqrt(Math.max(0, RAIO_CANTO * RAIO_CANTO - dx * dx - dy * dy));
  const k = afasta / RAIO_CANTO;
  const p = new Vector3(x + dx * k, y + dy * k, MEIA_Z + nz * (1 + k));
  const n = new Vector3(dx, dy, nz).normalize();
  return { p, n };
}

/** Altura do brilho sobre o olho: a superfície do elipsoide em (x, y), relativa ao centro do olho. */
const superficieOlho = (x, y) => OLHO_RZ * Math.sqrt(Math.max(0, 1 - (x / OLHO_RX) ** 2 - (y / OLHO_RY) ** 2));

/**
 * Monta o Cotinha. opcoes: { escala (1), bracos ('soltos' | 'segurando' | 'apoiado'), comprimentoBraco (medida base),
 * M (materiais do palco: { ceramica(tok, o), solido(tok), veu(tok, op) }) }.
 * Devolve { grupo (Group nomeado 'pavio'), corpo, olhos [esq, dir], bracos [esq, dir] (articulações),
 * grupoMao [esq, dir] (ponta de cada braço), pavios [cima, baixo], antena (base do pavio de cima, dentro do corpo) }.
 * Os braços não ficam fixos: a pose aplica ângulos.
 */
export function criarPavio3D({ escala = 1, bracos = 'soltos', comprimentoBraco = COMPRIMENTO_BRACO, M = MATERIAIS_PADRAO } = {}) {
  const grupo = new Group();
  grupo.name = 'pavio';
  grupo.scale.setScalar(escala);

  // Corpo: caixa arredondada, com verniz leve (o brilho fica sutil e o verde-água não lava para cinza).
  const corpo = new Group();
  const mCorpo = M.ceramica('--cor-mascote', { rough: 0.42, verniz: 0.15, emissivo: EMISSAO_CORPO });
  const caixa = new Mesh(new RoundedBoxGeometry(LARGURA, ALTURA, PROFUNDIDADE, 10, RAIO_CANTO), mCorpo);
  caixa.position.y = CENTRO_CORPO;
  corpo.add(caixa);

  // Reflexo: traço claro fino na frente, no alto à esquerda (como o 2D), colado à curva do corpo.
  const curvaReflexo = new CatmullRomCurve3(
    [0.19, 0.17, 0.15, 0.13, 0.11].map((dy) => frenteEm(-0.14, CENTRO_CORPO + dy, 0.006).p),
  );
  corpo.add(new Mesh(new TubeGeometry(curvaReflexo, 12, 0.011, 8, false), M.veu('--cor-mascote-brilho', 0.45)));

  // Olhos: ovais verticais escuros com brilho maior e um pontinho menor; cada um num grupo (para a piscada).
  const mOlho = M.solido('--cor-mascote-olho');
  const mBrilho = M.solido('--cor-mascote-brilho');
  const olhos = [1, -1].map((lado) => {
    const olho = new Group();
    const x = lado * OLHO_X;
    olho.position.set(x, OLHO_Y, frenteEm(x, OLHO_Y).p.z - OLHO_RECUO);
    const globo = new Mesh(new SphereGeometry(1, 32, 24), mOlho);
    globo.scale.set(OLHO_RX, OLHO_RY, OLHO_RZ);
    const brilho = new Mesh(new SphereGeometry(0.024, 16, 12), mBrilho);
    brilho.position.set(0.016, 0.046, superficieOlho(0.016, 0.046) + 0.001);
    const brilho2 = new Mesh(new SphereGeometry(0.011, 12, 10), mBrilho);
    brilho2.position.set(0.008, -0.03, superficieOlho(0.008, -0.03));
    olho.add(globo, brilho, brilho2);
    corpo.add(olho);
    return olho;
  });

  // Bochechas discretas (rosa do tema), meio embutidas na frente, com a curva do corpo.
  const mBochecha = M.veu('--cor-mascote-bochecha', 0.5);
  for (const lado of [1, -1]) {
    const { p, n } = frenteEm(lado * 0.14, CENTRO_CORPO - 0.05);
    const bochecha = new Mesh(new SphereGeometry(1, 16, 12), mBochecha);
    bochecha.scale.set(0.03, 0.022, 0.008);
    bochecha.position.copy(p).addScaledVector(n, -0.002);
    bochecha.quaternion.setFromUnitVectors(EIXO_Z, n);
    corpo.add(bochecha);
  }

  // Sorriso curto (humor contente do 2D): arco de toro, meio embutido na frente.
  const arco = Math.PI * 0.7;
  const yBoca = CENTRO_CORPO - 0.07;
  const boca = new Mesh(new TorusGeometry(0.034, 0.0105, 10, 28, arco), mOlho);
  boca.position.set(0, yBoca, frenteEm(0, yBoca).p.z - 0.004);
  boca.rotation.z = -Math.PI / 2 - arco / 2;
  corpo.add(boca);

  // Pavio de cima: antena na base (topo do corpo), com uma pontinha de brilho leve.
  const capsula = (raio, comp) => new CapsuleGeometry(raio, comp - 2 * raio, 10, 24);
  const antena = new Group();
  antena.position.y = BASE_CORPO + ALTURA;
  const pavioCima = new Mesh(capsula(RAIO_PAVIO, PAVIO_CIMA), mCorpo);
  pavioCima.position.y = PAVIO_CIMA / 2;
  const pontinha = new Mesh(new SphereGeometry(0.007, 12, 8), M.veu('--cor-mascote-brilho', 0.5));
  pontinha.position.set(-0.013, 0.035, 0.023);
  pavioCima.add(pontinha);
  antena.add(pavioCima);
  corpo.add(antena);

  // Pavio de baixo: igual ao corpo, parado no pé.
  const pavioBaixo = new Mesh(capsula(RAIO_PAVIO, PAVIO_BAIXO), mCorpo);
  pavioBaixo.position.y = PAVIO_BAIXO / 2;

  // Braços: articulação no ombro; a mão é uma bolinha na ponta, para segurar algo.
  const lados = [-1, 1];
  const articulacoes = lados.map((lado) => {
    const pivo = new Group();
    pivo.position.set(lado * PIVO_BRACO.x, PIVO_BRACO.y, 0);
    const braco = new Mesh(capsula(RAIO_BRACO, comprimentoBraco), mCorpo);
    braco.position.y = -comprimentoBraco / 2;
    const mao = new Group();
    mao.position.y = -comprimentoBraco;
    mao.add(new Mesh(new SphereGeometry(RAIO_MAO, 16, 12), mCorpo));
    pivo.add(braco, mao);
    grupo.add(pivo);
    return { pivo, mao };
  });

  grupo.add(corpo, pavioBaixo);
  const refs = {
    grupo,
    corpo,
    olhos,
    bracos: articulacoes.map((a) => a.pivo),
    grupoMao: articulacoes.map((a) => a.mao),
    pavios: [pavioCima, pavioBaixo],
    antena,
  };
  aplicaPose(refs, bracos);
  return refs;
}

/** Põe os braços numa pose (rad no eixo z). Pose desconhecida vira 'soltos'. */
export function aplicaPose(pavio, pose = 'soltos') {
  const [esq, dir] = ANGULOS[pose] ?? ANGULOS.soltos;
  pavio.bracos[0].rotation.z = esq;
  pavio.bracos[1].rotation.z = dir;
}

/**
 * Animação ociosa do Cotinha: respiração leve (1,5% em 3 s), balanço lento do corpo, antena com atraso, piscada a
 * cada 3 a 5 s e olhar que muda de direção de vez em quando. Os braços em bracosLivres acompanham a respiração
 * (±0,03 rad) sobre a pose que já têm; os demais são de quem chama (ex.: cofrinho controla o direito).
 * Devolve a função `anima(s)`; quem chama só a usa sem movimento reduzido.
 */
export function criaAnimaPavio(pavio, { bracosLivres = [0, 1] } = {}) {
  let proxima = 2.5;
  let inicio = -Infinity;
  let n = 0;
  let proximoOlhar = 4;
  let trocas = 0;
  let alvo = [0, 0];
  const olhar = { x: 0, y: 0 };
  const origens = pavio.olhos.map((o) => o.position.clone());
  // base de cada braço livre (sem a respiração) e o último ângulo posto, para não acumular
  const base = [null, null];
  const posto = [null, null];
  let antes = null;
  return (s) => {
    if (s >= proxima) {
      inicio = s;
      n++;
      proxima = s + 3 + 2 * ((n * 0.618) % 1);
    }
    if (s >= proximoOlhar) {
      alvo = OLHARES[trocas % OLHARES.length];
      trocas++;
      proximoOlhar = s + 3 + 3 * ((trocas * 0.381) % 1);
    }
    // o olhar desliza até o alvo (sem salto)
    const dt = antes == null ? 0 : Math.min(0.1, s - antes);
    antes = s;
    const f = 1 - Math.exp(-6 * dt);
    olhar.x += (alvo[0] - olhar.x) * f;
    olhar.y += (alvo[1] - olhar.y) * f;

    const e = escalaPiscada(s - inicio);
    pavio.olhos.forEach((olho, i) => {
      olho.scale.y = e;
      olho.position.x = origens[i].x + olhar.x;
      olho.position.y = origens[i].y + olhar.y;
    });

    const k = 0.5 + 0.5 * Math.sin((2 * Math.PI * s) / 3);
    pavio.corpo.scale.set(1 - 0.006 * k, 1 + 0.015 * k, 1 - 0.006 * k);
    // balanço lento do corpo (±1,5°) em volta do pé; a antena, dentro do corpo, ondula atrasada
    pavio.corpo.rotation.z = 0.026 * Math.sin((2 * Math.PI * s) / 6);
    pavio.antena.rotation.z = 0.08 * Math.sin((2 * Math.PI * (s - 0.6)) / 4);

    const ondula = 0.03 * (2 * k - 1);
    for (const i of bracosLivres) {
      const braco = pavio.bracos[i];
      // se outra cena pôs uma pose nova, ela vira a base; senão a base não se acumula
      if (braco.rotation.z !== posto[i]) base[i] = braco.rotation.z;
      posto[i] = base[i] + ondula;
      braco.rotation.z = posto[i];
    }
  };
}

/** Cena do palco: ponto de articulação do braço (esq. = -x), em unidades do Cotinha sem escala. */
export const pivoBraco = (lado) => ({ x: lado * PIVO_BRACO.x, y: PIVO_BRACO.y });
