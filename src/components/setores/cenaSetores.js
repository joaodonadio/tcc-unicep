import { CylinderGeometry, Group, Mesh, Raycaster, Vector2 } from 'three';
import {
  ALTURA_QUADRO, GLB_DISPONIVEIS, LARGURA_QUADRO, LIMITE_TRIANGULOS, TAMANHO_OBJETO, TAU,
  alvoDoGiro, anguloDaFrente, encaixe, indiceDaFrente, urlDoGlb,
} from '../../lib/setores3d.js';
import { suaviza } from '../modelos3d/palco.js';
import { carregarObjetoGlb, descartarGeometrias, descartarMateriais } from './glbSetor.js';
import { objetoProcedural } from './objetosSetor.js';

// Mesmos tons de modelos3d/objetos.js: acento escurecido sobre o fundo e grafite.
const ACENTO_ESCURO = ['--cor-acento', '--cor-fundo', 0.25];
const METAL = ['--cor-texto-suave', '--cor-fundo', 0.7];
// Faixa de tons do .glb: as cores do arquivo viram cinzas entre estes dois, pela luminância.
const TOM_CLARO = ACENTO_ESCURO;
const TOM_ESCURO = ['--cor-texto-suave', '--cor-fundo', 0.55];
const ALVO_Y = 1.5; // centro vertical do objeto em destaque (a base fica em y = 0)
const ELEV = 0.2; // rad: de frente, um pouco acima
const ENTRADA_ATRASO = 0.05; // s entre um objeto e o seguinte, em sequência pelo anel
const ENTRADA_QUEDA = 0.4; // un: altura de onde o objeto desce
const ENTRADA_DURACAO = 0.45; // s, ease-out exponencial
const ENTRADA_GIRO = 0.9; // s: giro de chegada do disco
const ENTRADA_ARCO = Math.PI / 2; // 90 graus até o primeiro setor
const MOLA = 0.12; // s, constante de tempo do encaixe (~400 ms até assentar)
const ESCALA_DESTAQUE = 1.35;
const ESCALA_VITRINE = 2.2; // um setor por vez, sozinho no centro: objeto grande
const SAIDA_VIS = 0.15; // fração da escala abaixo da qual o setor que sai libera a entrada do próximo
const GIRO = 0.35; // rad/s do objeto em destaque
const OCIOSO_ESPERA = 6; // s sem interação até começar o giro ocioso
const OCIOSO_PASSO = 5; // s entre um setor e o seguinte no giro ocioso
const ARRASTE = 0.012; // rad por pixel arrastado
const MOVIMENTO_CLIQUE = 5; // px: menos que isso é clique
const FORCA_DESTAQUE = 2.2;
const FORCA_REPOUSO = 0.4;
const DEFASE = 0.9; // s: fase da assinatura de um setor para o seguinte
const LUZ_EMISSIVA = 0x5fc9c0; // teal das manchas: destaque do setor sem cor de ação

/** Parte fracionária (de 0 a 1), também para tempo negativo. */
const fracao = (x) => x - Math.floor(x);
/** Triângulo: 0 em a, 1 em b, 0 em c (a < b < c); fora do intervalo vale 0. */
const pico = (u, a, b, c) => (u <= a || u >= c ? 0 : u < b ? (u - a) / (b - a) : (c - u) / (c - b));
/** Onda suave de 0 a 1 com período `per` (s). */
const suave = (t, per) => 0.5 - 0.5 * Math.cos((TAU * t) / per);

/** Peças nomeadas de cada assinatura (contrato de nomes dos .glb). Se alguma faltar, o objeto inteiro respira. */
const PECAS = {
  'bens-industriais': ['Fumaca1', 'Fumaca2', 'Fumaca3'],
  comunicacoes: ['Onda1', 'Onda2'],
  'materiais-basicos': ['Picareta', 'Minerio'],
  'utilidade-publica': ['Raio'],
  'consumo-nao-ciclico': ['Fruta1', 'Fruta2', 'Fruta3'],
  'consumo-ciclico': ['Sacola', 'Alca'],
  financeiro: ['Moeda'],
  saude: ['Coracao'],
  petroleo: ['Gota'],
  tecnologia: ['Nucleo', 'Pinos'],
  outros: ['Predio'],
};
/** Peças que piscam (emissivo): ganham material próprio. */
const EMISSIVAS = new Set(['Raio', 'Nucleo', 'Pinos']);
/** Peças que somem aos poucos (opacidade): ganham material próprio e transparente. */
const TRANSLUCIDAS = new Set(['Fumaca1', 'Fumaca2', 'Fumaca3', 'Onda1', 'Onda2']);

/** Escala uniforme a partir da escala de origem da peça. */
function escala(r, s) {
  r.o.scale.set(r.sx0 * s, r.sy0 * s, r.sz0 * s);
}
function opacidade(r, v) {
  const ms = r.ms;
  for (let i = 0; i < ms.length; i++) ms[i].opacity = v;
}
function emite(r, v) {
  const ms = r.ms;
  for (let i = 0; i < ms.length; i++) ms[i].emissiveIntensity = v;
}
function fumaca(r, u, f) {
  r.o.position.set(r.x0, r.y0 + 0.5 * u * f, r.z0);
  escala(r, 1 + 0.6 * u);
  opacidade(r, 1 - u);
}
function onda(r, u) {
  escala(r, 1 + 0.5 * u);
  opacidade(r, 1 - u);
}

/**
 * Assinaturas por chave: (pecas, t, forca) => void, chamadas a cada quadro com as peças já resolvidas.
 * forca vale 2.2 no setor da frente e 0.4 nos demais (multiplica o deslocamento, a rotação e o brilho).
 */
const ASSINATURAS = {
  'bens-industriais': (p, t, f) => {
    fumaca(p.Fumaca1, fracao(t / 3.2), f);
    fumaca(p.Fumaca2, fracao(t / 3.2 + 1 / 3), f);
    fumaca(p.Fumaca3, fracao(t / 3.2 + 2 / 3), f);
  },
  comunicacoes: (p, t) => {
    onda(p.Onda1, fracao(t / 2.4));
    onda(p.Onda2, fracao(t / 2.4 + 0.5));
  },
  'materiais-basicos': (p, t, f) => {
    const u = fracao(t / 2.5);
    p.Picareta.o.rotation.z = p.Picareta.rz0 - 0.4 * (1 - pico(u, 0.5, 0.6, 0.85));
    const m = p.Minerio;
    const tremor = 0.012 * f * pico(u, 0.58, 0.62, 0.7) * Math.sin(t * 60);
    m.o.position.set(m.x0 + tremor, m.y0, m.z0);
  },
  'utilidade-publica': (p, t, f) => {
    emite(p.Raio, 0.8 * Math.min(f, 1.5) * pico(fracao(t / 3), 0, 0.05, 0.2));
  },
  'consumo-nao-ciclico': (p, t, f) => {
    p.Fruta1.o.rotation.z = p.Fruta1.rz0 + 0.08 * f * Math.sin((TAU * t) / 3.2);
    p.Fruta2.o.rotation.z = p.Fruta2.rz0 + 0.08 * f * Math.sin((TAU * t) / 3.2 + 2.1);
    p.Fruta3.o.rotation.z = p.Fruta3.rz0 + 0.08 * f * Math.sin((TAU * t) / 3.2 + 4.2);
  },
  'consumo-ciclico': (p, t, f) => {
    // A origem da Sacola já está no topo (a Alça é filha): gira direto em torno dela, sem deslocar.
    p.Sacola.o.rotation.z = p.Sacola.rz0 + 0.06 * f * Math.sin((TAU * t) / 3.4);
  },
  financeiro: (p, t, f) => {
    const m = p.Moeda;
    m.o.rotation.y = m.ry0 + ((t * 0.9) % TAU);
    m.o.position.set(m.x0, m.y0 + 0.05 * f * Math.sin((TAU * t) / 3.6), m.z0);
  },
  saude: (p, t, f) => {
    const u = fracao(t / 1.6);
    escala(p.Coracao, 1 + f * (0.08 * pico(u, 0, 0.05, 0.12) + 0.05 * pico(u, 0.2, 0.25, 0.32)));
  },
  petroleo: (p, t) => {
    const g = p.Gota;
    const u = fracao(t / 2.8);
    if (u < 0.7) {
      const q = u / 0.7;
      g.o.visible = true;
      g.o.position.set(g.x0, g.y0 + 0.6 * (1 - q * q), g.z0);
    } else {
      g.o.visible = false;
    }
  },
  tecnologia: (p, t, f) => {
    emite(p.Nucleo, 0.35 * f * suave(t, 3.2));
    const ms = p.Pinos.ms;
    for (let k = 0; k < ms.length; k++) {
      ms[k].emissiveIntensity = 0.8 * pico(fracao(t / 2.4 - k * 0.07), 0, 0.1, 0.5);
    }
  },
  outros: (p, t, f) => {
    const r = p.Predio;
    r.o.scale.y = r.sy0 * (1 + 0.02 * f * suave(t, 3.6));
  },
};

/** Fallback para o objeto inteiro (procedural, ou .glb sem as peças nomeadas): escala y de 1 a 1.02. */
function respira(modelo, sy0, t, f) {
  modelo.scale.y = sy0 * (1 + 0.02 * f * suave(t, 3.6));
}

/**
 * Vitrine dos setores: só o objeto do setor da frente, sem moldura, disco nem pedestal, nos tons da paleta.
 * Ao trocar de setor, o que sai encolhe e o que entra cresce, girando. A variação fica na legenda e na lista.
 * Devolve as opções do criarPalco + `controle` ({ atualiza(lista), vaiPara(indice), sobre(bool) }).
 * A frente é o setor de índice `frente`; quando a vitrine muda de frente sozinha (giro ocioso,
 * arrasto, clique), chama aoFrente(indice). Clique num objeto gira até ele.
 */
export function cenaSetores({ colunas = [], frente = 0, reduz = false, aoFrente }) {
  const descartaveis = []; // materiais clonados e originais do .glb: liberados em aoDestruir
  const porSetor = new Map();
  const picks = []; // malhas invisíveis para o clique (só as visíveis entram no raycast)
  const ray = new Raycaster();
  const ndc = new Vector2();
  let P = null;
  let mats = null;
  let geo = null;
  let anel = null;
  let n = colunas.length;
  let alvoIdx = 0; // índice da frente (o que está em destaque)
  let psi = 0; // rotação atual do anel
  let psiAlvo = 0; // rotação para a qual a vitrine caminha
  let entradaT0 = reduz ? -Infinity : null; // -Infinity: entrada encerrada (ou sem entrada)
  let tAnterior = null;
  let proximoOcioso = null; // s do próximo passo do giro ocioso
  let sobre = false; // ponteiro sobre o palco: sem giro ocioso
  let arrastando = false;
  let movido = false;
  let x0 = 0;
  let ativo = true;

  /** Qualquer interação encerra a entrada e reinicia a espera do giro ocioso. */
  function marcaInteracao() {
    entradaT0 = -Infinity;
    proximoOcioso = null;
  }

  /** Vai até o índice pelo menor caminho. marca: se a ação veio de quem usa (reinicia a espera ociosa). */
  function irPara(k, marca = true) {
    if (!P || !n) return;
    const idx = ((k % n) + n) % n;
    if (marca) marcaInteracao();
    if (idx === alvoIdx) return;
    alvoIdx = idx;
    psiAlvo = alvoDoGiro(psi, idx, n);
    if (reduz) psi = psiAlvo;
    P.redesenha();
    aoFrente?.(idx);
  }

  /** Clones os materiais de uma peça (uma vez). Emissivo começa apagado; translúcido liga a transparência. */
  function clonaMateriais(o, nome) {
    const pilha = [];
    o.traverse((no) => {
      if (!no.isMesh || !no.material) return;
      const origem = Array.isArray(no.material) ? no.material : [no.material];
      const copias = origem.map((m) => {
        const c = m.clone();
        if (TRANSLUCIDAS.has(nome)) c.transparent = true;
        if (EMISSIVAS.has(nome) && c.emissive) {
          c.emissive.setHex(LUZ_EMISSIVA);
          c.emissiveIntensity = 0;
        }
        descartaveis.push(c, ...origem);
        pilha.push(c);
        return c;
      });
      no.material = Array.isArray(no.material) ? copias : copias[0];
    });
    return pilha;
  }

  /** Resolve as peças nomeadas do modelo uma vez: referências, pose de origem e materiais clonados. */
  function resolvePecas(modelo, chave) {
    const mapa = {};
    for (const nome of PECAS[chave] ?? []) {
      const o = modelo.getObjectByName(nome);
      if (!o) return null;
      mapa[nome] = {
        o,
        x0: o.position.x, y0: o.position.y, z0: o.position.z,
        rx0: o.rotation.x, ry0: o.rotation.y, rz0: o.rotation.z,
        sx0: o.scale.x, sy0: o.scale.y, sz0: o.scale.z,
        ms: EMISSIVAS.has(nome) || TRANSLUCIDAS.has(nome) ? clonaMateriais(o, nome) : [],
      };
    }
    return mapa;
  }

  /**
   * Troca cada material do .glb por uma cópia em cinza da paleta: a luminância da cor original escolhe o tom
   * entre TOM_ESCURO e TOM_CLARO, então as partes seguem distintas entre si. Sem textura nem brilho próprio.
   */
  function tonsDaPaleta(obj) {
    const copias = new Map();
    obj.traverse((no) => {
      if (!no.isMesh || !no.material) return;
      const troca = (m) => {
        if (!copias.has(m)) {
          const c = m.clone();
          if (c.color) {
            const l = 0.2126 * c.color.r + 0.7152 * c.color.g + 0.0722 * c.color.b; // linear
            c.color.copy(mats.tomEscuro.color).lerp(mats.tomClaro.color, Math.min(1, Math.sqrt(l)));
          }
          c.map = null;
          c.vertexColors = false;
          c.emissive?.setHex(0x000000);
          c.emissiveMap = null;
          descartaveis.push(m);
          copias.set(m, c);
        }
        return copias.get(m);
      };
      no.material = Array.isArray(no.material) ? no.material.map(troca) : troca(no.material);
    });
  }

  function trocaPorGlb(col, chave) {
    carregarObjetoGlb(urlDoGlb(chave), mats.corpo, {
      tamanho: TAMANHO_OBJETO, limite: LIMITE_TRIANGULOS, manterMateriais: true,
    }).then((obj) => {
      if (!obj) return;
      if (!ativo) { descartarGeometrias(obj); descartarMateriais(obj); return; }
      tonsDaPaleta(obj);
      col.giro.remove(col.modelo);
      descartarGeometrias(col.modelo);
      col.modelo = obj;
      col.glb = obj;
      col.giro.add(obj);
      col.sy0 = obj.scale.y;
      col.pecas = resolvePecas(obj, chave);
      P.redesenha();
    });
  }

  /** Um objeto por setor (procedural ou .glb), no centro. Criado uma vez. */
  function criaCelula(c, i) {
    const cel = new Group(); // visível = setor na lista
    const vitrine = new Group(); // visível e em escala cheia só no setor da frente
    vitrine.visible = false;
    vitrine.scale.setScalar(0);
    const giro = new Group();
    const modelo = objetoProcedural(c.chave, mats, TAMANHO_OBJETO);
    giro.add(modelo);
    const pick = new Mesh(geo.pick, mats.hit);
    vitrine.add(giro, pick);
    cel.add(vitrine);
    anel.add(cel);
    const col = {
      setor: c.setor, chave: c.chave, ordem: i, cel, vitrine, giro, modelo, pick,
      glb: null, pecas: null, sy0: modelo.scale.y, escala: 1, forca: FORCA_REPOUSO, destacado: false, queda: 0, vis: 0,
    };
    pick.userData.col = col;
    picks.push(pick);
    porSetor.set(c.setor, col);
    if (GLB_DISPONIVEIS.includes(c.chave)) trocaPorGlb(col, c.chave);
    return col;
  }

  /** Índice do objeto sob o ponteiro (só os visíveis), ou null. */
  function indiceNoPonteiro(e) {
    const r = P.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, P.cam);
    const alvos = picks.filter((m) => m.userData.col.cel.visible && m.userData.col.vitrine.visible);
    const hit = ray.intersectObjects(alvos, false)[0];
    return hit ? hit.object.userData.col.ordem : null;
  }

  /** Encaixa no setor mais próximo da frente, pelo menor caminho. */
  function encaixar() {
    const k = indiceDaFrente(psi, n);
    if (k !== alvoIdx) {
      alvoIdx = k;
      aoFrente?.(k);
    }
    psiAlvo = encaixe(psi, n);
    if (reduz) psi = psiAlvo;
    P.redesenha();
  }

  const aoBaixar = (e) => {
    if (e.button > 0) return;
    arrastando = true;
    movido = false;
    x0 = e.clientX;
    P.canvas.setPointerCapture?.(e.pointerId);
    marcaInteracao();
  };
  const aoMover = (e) => {
    if (!arrastando) {
      const cursor = indiceNoPonteiro(e) != null ? 'pointer' : '';
      if (P.canvas.style.cursor !== cursor) P.canvas.style.cursor = cursor;
      return;
    }
    const dx = e.clientX - x0;
    if (!movido && Math.abs(dx) < MOVIMENTO_CLIQUE) return;
    movido = true;
    x0 = e.clientX;
    psi -= dx * ARRASTE; // arrastar para a direita gira a vitrine para a direita (rotation.y = -psi)
    psiAlvo = psi;
    const k = indiceDaFrente(psi, n);
    if (k !== alvoIdx) {
      alvoIdx = k;
      aoFrente?.(k);
    }
    P.redesenha();
  };
  const aoSoltar = (e) => {
    if (!arrastando) return;
    arrastando = false;
    if (movido) {
      encaixar();
      return;
    }
    const k = indiceNoPonteiro(e);
    if (k != null) irPara(k, true);
  };
  const aoCancelar = () => {
    if (!arrastando) return;
    arrastando = false;
    if (movido) encaixar();
  };

  const controle = {
    atualiza(novaLista = []) {
      if (!P) return;
      n = novaLista.length;
      const vistos = new Set();
      novaLista.forEach((c, i) => {
        vistos.add(c.setor);
        let col = porSetor.get(c.setor);
        if (!col) col = criaCelula(c, i);
        col.ordem = i;
        col.cel.visible = true;
      });
      porSetor.forEach((col, setor) => {
        if (!vistos.has(setor)) col.cel.visible = false;
      });
      alvoIdx = n ? Math.min(alvoIdx, n - 1) : 0;
      psiAlvo = alvoDoGiro(psi, alvoIdx, n);
      if (reduz) psi = psiAlvo;
      P.redesenha();
    },
    vaiPara(indice) {
      irPara(indice, true);
    },
    sobre(v) {
      sobre = !!v;
      if (!sobre) marcaInteracao();
    },
  };

  return {
    altura: ALTURA_QUADRO,
    largura: LARGURA_QUADRO,
    alvo: [0, ALVO_Y, 0],
    az: 0,
    elev: ELEV,
    arrastar: false,
    controle,
    monta(api) {
      P = api;
      mats = {
        corpo: P.M.solido(ACENTO_ESCURO),
        detalhe: P.M.solido(METAL),
        traco: P.M.traco('--cor-fundo', 0.45),
        hit: P.M.veu('--cor-fundo', 0),
        tomClaro: P.M.solido(TOM_CLARO),
        tomEscuro: P.M.solido(TOM_ESCURO),
      };
      mats.hit.visible = false; // invisível, mas o raycast acerta
      geo = {
        pick: new CylinderGeometry(0.62, 0.62, 2, 16).translate(0, 1, 0),
      };
      // Só o grupo que gira: os objetos ficam sozinhos na cena, sem chão.
      anel = new Group();
      P.cena.add(anel);
      P.canvas.addEventListener('pointerdown', aoBaixar);
      P.canvas.addEventListener('pointermove', aoMover);
      P.canvas.addEventListener('pointerup', aoSoltar);
      P.canvas.addEventListener('pointercancel', aoCancelar);
      // Frente inicial: o índice recebido (ou o primeiro). Com movimento, o disco chega dos 90 graus anteriores.
      n = colunas.length;
      alvoIdx = n ? Math.min(Math.max(0, Math.floor(frente) || 0), n - 1) : 0;
      psiAlvo = anguloDaFrente(alvoIdx, n);
      psi = reduz ? psiAlvo : psiAlvo - ENTRADA_ARCO;
      controle.atualiza(colunas);
    },
    anima(s) {
      // dt limitado: ao voltar de aba oculta ou de fora da tela o giro não salta
      const gap = tAnterior == null ? 0 : s - tAnterior;
      const dt = Math.min(0.05, gap);
      tAnterior = s;
      if (gap > 0.5) proximoOcioso = null; // voltou de fora da tela: a espera recomeça
      if (entradaT0 == null) entradaT0 = s;
      const tE = s - entradaT0;
      const fMola = 1 - Math.exp(-dt / MOLA);

      // Giro ocioso: sem interação por OCIOSO_ESPERA s, avança um setor a cada OCIOSO_PASSO s (só com movimento livre).
      if (!reduz && !sobre && !arrastando && n > 0) {
        if (proximoOcioso == null) proximoOcioso = s + OCIOSO_ESPERA;
        if (s >= proximoOcioso) {
          irPara(alvoIdx + 1, false);
          proximoOcioso = s + OCIOSO_PASSO;
        }
      } else {
        proximoOcioso = null;
      }

      // Anel: entrada (90 graus até a frente), depois a mola até o alvo (sem mola com movimento reduzido).
      if (tE < ENTRADA_GIRO) {
        psi = psiAlvo - ENTRADA_ARCO * (1 - suaviza(tE / ENTRADA_GIRO));
      } else if (reduz) {
        psi = psiAlvo;
      } else if (!arrastando) {
        psi += (psiAlvo - psi) * fMola;
      }
      anel.rotation.y = -psi;

      // o setor que entra espera o anterior quase sumir, para os dois não se cruzarem no centro
      let saindo = false;
      if (!reduz) porSetor.forEach((col) => {
        if (col.cel.visible && col.ordem !== alvoIdx && col.vis > SAIDA_VIS) saindo = true;
      });

      porSetor.forEach((col) => {
        if (!col.cel.visible) return;
        const destacado = col.ordem === alvoIdx;
        col.destacado = destacado;
        // destaque: o objeto cresce e a assinatura ganha força; os demais ficam em escala 1
        const metaEsc = destacado ? ESCALA_DESTAQUE : 1;
        col.escala = reduz || Math.abs(metaEsc - col.escala) < 0.002
          ? metaEsc : col.escala + (metaEsc - col.escala) * fMola;
        col.giro.scale.setScalar(col.escala);
        // só o setor da frente fica à vista: o que sai encolhe até sumir e o que entra cresce
        const metaVis = destacado && !saindo ? 1 : 0;
        col.vis = reduz || Math.abs(metaVis - col.vis) < 0.002 ? metaVis : col.vis + (metaVis - col.vis) * fMola;
        col.vitrine.visible = col.vis > 0;
        col.vitrine.scale.setScalar(ESCALA_VITRINE * col.vis);
        const metaForca = destacado ? FORCA_DESTAQUE : FORCA_REPOUSO;
        col.forca = reduz || Math.abs(metaForca - col.forca) < 0.002
          ? metaForca : col.forca + (metaForca - col.forca) * fMola;
        // entrada: o objeto desce ENTRADA_QUEDA e assenta no lugar, em sequência pela lista
        const p = (tE - col.ordem * ENTRADA_ATRASO) / ENTRADA_DURACAO;
        if (p <= 0) {
          col.giro.visible = false;
        } else {
          col.giro.visible = true;
          col.queda = p >= 1 ? 0 : ENTRADA_QUEDA * Math.pow(2, -10 * p);
        }
        col.giro.position.y = col.queda;
        // rotação própria: só o destaque gira devagar; os demais voltam à frente
        if (reduz) {
          col.giro.rotation.y = 0;
        } else if (destacado) {
          col.giro.rotation.y += dt * GIRO;
        } else {
          let r = col.giro.rotation.y % TAU;
          if (r > Math.PI) r -= TAU;
          else if (r < -Math.PI) r += TAU;
          col.giro.rotation.y = r * (1 - fMola);
        }
        // assinaturas: só com movimento e com o objeto já assentado (ou em queda)
        if (!reduz && col.giro.visible) {
          const t = s + col.ordem * DEFASE;
          if (col.pecas) ASSINATURAS[col.chave](col.pecas, t, col.forca);
          else respira(col.modelo, col.sy0, t, col.forca);
        }
      });
      // Com movimento o quadro segue vivo (giro do destaque); fora da tela o palco para sozinho.
      // Com movimento reduzido a cena é estática: redesenha só quando algo muda.
      return !reduz;
    },
    aoDestruir() {
      ativo = false;
      P?.canvas.removeEventListener('pointerdown', aoBaixar);
      P?.canvas.removeEventListener('pointermove', aoMover);
      P?.canvas.removeEventListener('pointerup', aoSoltar);
      P?.canvas.removeEventListener('pointercancel', aoCancelar);
      porSetor.forEach((col) => { if (col.glb) descartarMateriais(col.glb); });
      descartaveis.forEach((m) => m.dispose());
      porSetor.clear();
    },
  };
}
