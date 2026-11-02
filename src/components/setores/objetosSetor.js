import {
  BoxGeometry, ConeGeometry, CylinderGeometry, EdgesGeometry, ExtrudeGeometry, Group,
  IcosahedronGeometry, LineSegments, Mesh, Shape, SphereGeometry, TorusGeometry,
} from 'three';

const { PI } = Math;

/** Peça: malha + (opcional) arestas finas; pos [x,y,z], rot [x,y,z]. */
function peca(geo, mat, traco, pos = [0, 0, 0], rot = null) {
  const g = new Group();
  g.add(new Mesh(geo, mat));
  if (traco) g.add(new LineSegments(new EdgesGeometry(geo, 35), traco));
  g.position.set(...pos);
  if (rot) g.rotation.set(...rot);
  return g;
}

/** Prisma: polígono no plano XY extrudado em z e centrado em z. */
function prisma(pontos, profundidade) {
  const s = new Shape();
  pontos.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return new ExtrudeGeometry(s, { depth: profundidade, bevelEnabled: false }).translate(0, 0, -profundidade / 2);
}

const grupo = (...filhos) => { const g = new Group(); g.add(...filhos); return g; };

/** Fábrica: galpão com dois dentes de serra e chaminé. */
function fabrica(m) {
  return grupo(
    peca(new BoxGeometry(0.8, 0.4, 0.5), m.corpo, m.traco, [-0.05, 0.2, 0]),
    peca(prisma([[0, 0], [0.38, 0], [0, 0.2]], 0.5), m.corpo, m.traco, [-0.45, 0.4, 0]),
    peca(prisma([[0, 0], [0.38, 0], [0, 0.2]], 0.5), m.corpo, m.traco, [-0.05, 0.4, 0]),
    peca(new CylinderGeometry(0.06, 0.075, 0.5, 8), m.detalhe, m.traco, [0.28, 0.65, 0]),
  );
}

/** Antena: torre com ponta e ondas. */
function antena(m) {
  return grupo(
    peca(new BoxGeometry(0.36, 0.05, 0.36), m.detalhe, m.traco, [0, 0.025, 0]),
    peca(new CylinderGeometry(0.03, 0.2, 0.75, 4), m.corpo, m.traco, [0, 0.375, 0]),
    peca(new SphereGeometry(0.06, 10, 8), m.detalhe, null, [0, 0.8, 0]),
    peca(new TorusGeometry(0.14, 0.016, 6, 24), m.detalhe, null, [0, 0.8, 0], [PI / 2, 0, 0]),
    peca(new TorusGeometry(0.24, 0.016, 6, 24), m.detalhe, null, [0, 0.8, 0], [PI / 2, 0, 0]),
  );
}

/** Picareta e minério. */
function mineracao(m) {
  const minerio = peca(new IcosahedronGeometry(0.22, 0), m.corpo, m.traco, [-0.2, 0.18, 0.05]);
  minerio.scale.y = 0.8;
  const pic = grupo(
    peca(new BoxGeometry(0.05, 0.8, 0.05), m.detalhe, m.traco, [0, 0.4, 0]),
    peca(new BoxGeometry(0.56, 0.07, 0.07), m.detalhe, m.traco, [0, 0.8, 0]),
  );
  pic.rotation.z = -0.35;
  pic.position.set(-0.12, 0.01, 0);
  return grupo(minerio, pic);
}

/** Raio de energia sobre base. */
function energia(m) {
  return grupo(
    peca(new CylinderGeometry(0.26, 0.3, 0.06, 16), m.detalhe, m.traco, [0, 0.03, 0]),
    peca(prisma([[0.08, 1], [-0.22, 0.45], [-0.02, 0.45], [-0.12, 0], [0.24, 0.6], [0.04, 0.6], [0.2, 1]], 0.14),
      m.corpo, m.traco),
  );
}

/** Cesta com frutas. */
function cesta(m) {
  return grupo(
    peca(new CylinderGeometry(0.42, 0.32, 0.4, 8), m.detalhe, m.traco, [0, 0.2, 0]),
    peca(new TorusGeometry(0.42, 0.03, 6, 8), m.corpo, null, [0, 0.4, 0], [PI / 2, 0, 0]),
    peca(new TorusGeometry(0.32, 0.025, 6, 16, PI), m.corpo, null, [0, 0.4, 0]),
    peca(new SphereGeometry(0.11, 10, 8), m.corpo, null, [-0.14, 0.47, 0.06]),
    peca(new SphereGeometry(0.11, 10, 8), m.corpo, null, [0.1, 0.48, -0.05]),
    peca(new SphereGeometry(0.09, 10, 8), m.corpo, null, [0.02, 0.5, 0.14]),
  );
}

/** Sacola de compras com alças. */
function sacola(m) {
  return grupo(
    peca(new BoxGeometry(0.6, 0.6, 0.3), m.corpo, m.traco, [0, 0.3, 0]),
    peca(new BoxGeometry(0.62, 0.06, 0.32), m.detalhe, m.traco, [0, 0.57, 0]),
    peca(new TorusGeometry(0.13, 0.022, 6, 16, PI), m.detalhe, null, [0, 0.6, 0.1]),
    peca(new TorusGeometry(0.13, 0.022, 6, 16, PI), m.detalhe, null, [0, 0.6, -0.1]),
  );
}

/** Banco: fachada com colunas e frontão. */
function banco(m) {
  const colunas = [-0.3, -0.1, 0.1, 0.3].map((x) =>
    peca(new CylinderGeometry(0.045, 0.05, 0.42, 10), m.corpo, m.traco, [x, 0.34, 0.12]));
  return grupo(
    peca(new BoxGeometry(0.9, 0.08, 0.6), m.detalhe, m.traco, [0, 0.04, 0]),
    peca(new BoxGeometry(0.8, 0.05, 0.52), m.detalhe, m.traco, [0, 0.105, 0]),
    peca(new BoxGeometry(0.7, 0.42, 0.25), m.detalhe, m.traco, [0, 0.34, -0.1]),
    ...colunas,
    peca(new BoxGeometry(0.86, 0.07, 0.56), m.corpo, m.traco, [0, 0.585, 0]),
    peca(prisma([[-0.45, 0], [0.45, 0], [0, 0.22]], 0.5), m.corpo, m.traco, [0, 0.62, 0]),
  );
}

/** Cruz de saúde. */
function saude(m) {
  return grupo(
    peca(new CylinderGeometry(0.24, 0.28, 0.08, 16), m.detalhe, m.traco, [0, 0.04, 0]),
    peca(new BoxGeometry(0.24, 0.72, 0.2), m.corpo, m.traco, [0, 0.46, 0]),
    peca(new BoxGeometry(0.72, 0.24, 0.2), m.corpo, m.traco, [0, 0.5, 0]),
  );
}

/** Barril de petróleo com gota. */
function petroleo(m) {
  return grupo(
    peca(new CylinderGeometry(0.25, 0.25, 0.58, 14), m.corpo, m.traco, [0, 0.29, 0]),
    peca(new TorusGeometry(0.255, 0.022, 6, 20), m.detalhe, null, [0, 0.1, 0], [PI / 2, 0, 0]),
    peca(new TorusGeometry(0.255, 0.022, 6, 20), m.detalhe, null, [0, 0.48, 0], [PI / 2, 0, 0]),
    peca(new SphereGeometry(0.11, 12, 10), m.detalhe, null, [0, 0.73, 0]),
    peca(new ConeGeometry(0.105, 0.17, 12), m.detalhe, null, [0, 0.86, 0]),
  );
}

/** Chip em pé com pinos. */
function chip(m) {
  const pinos = [];
  for (const k of [-0.2, -0.067, 0.067, 0.2]) {
    pinos.push(
      peca(new BoxGeometry(0.12, 0.04, 0.05), m.corpo, null, [-0.36, 0.4 + k, 0]),
      peca(new BoxGeometry(0.12, 0.04, 0.05), m.corpo, null, [0.36, 0.4 + k, 0]),
      peca(new BoxGeometry(0.04, 0.1, 0.05), m.corpo, null, [k, 0.05, 0]),
      peca(new BoxGeometry(0.04, 0.1, 0.05), m.corpo, null, [k, 0.75, 0]),
    );
  }
  return grupo(
    peca(new BoxGeometry(0.6, 0.6, 0.1), m.detalhe, m.traco, [0, 0.4, 0]),
    peca(new BoxGeometry(0.28, 0.28, 0.13), m.corpo, m.traco, [0, 0.4, 0]),
    ...pinos,
  );
}

/** Prédio genérico para os demais setores. */
function predio(m) {
  return grupo(
    peca(new BoxGeometry(0.46, 0.85, 0.46), m.corpo, m.traco, [0, 0.425, 0]),
    peca(new BoxGeometry(0.48, 0.06, 0.48), m.detalhe, m.traco, [0, 0.3, 0]),
    peca(new BoxGeometry(0.48, 0.06, 0.48), m.detalhe, m.traco, [0, 0.55, 0]),
    peca(new BoxGeometry(0.3, 0.08, 0.3), m.detalhe, m.traco, [0, 0.89, 0]),
  );
}

export const OBJETOS_SETOR = {
  'bens-industriais': fabrica,
  comunicacoes: antena,
  'materiais-basicos': mineracao,
  'utilidade-publica': energia,
  'consumo-nao-ciclico': cesta,
  'consumo-ciclico': sacola,
  financeiro: banco,
  saude,
  petroleo,
  tecnologia: chip,
  outros: predio,
};

/** Objeto procedural do setor, encaixado numa caixa unitária e escalado por `tamanho`. */
export function objetoProcedural(chave, m, tamanho = 1) {
  const montar = OBJETOS_SETOR[chave] ?? OBJETOS_SETOR.outros;
  const envelope = new Group();
  envelope.add(montar(m));
  envelope.scale.setScalar(tamanho);
  return envelope;
}
