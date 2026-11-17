import { afterEach, describe, expect, it, vi } from 'vitest';
import { BufferGeometry, MeshBasicMaterial, Scene } from 'three';
import { cenaSetores } from '../../components/setores/cenaSetores.js';
import { PIVO_BRACO } from '../../components/modelos3d/pavio3d.js';

// Sem GLTFLoader nos testes: o objeto fica o procedural.
vi.mock('../../components/setores/glbSetor.js', () => ({
  carregarObjetoGlb: () => new Promise(() => {}),
  descartarGeometrias: () => {},
  descartarMateriais: () => {},
}));

const material = () => new MeshBasicMaterial();

/** Palco mínimo: o que cenaSetores usa do motor (cena, materiais, canvas e o pedido de quadro). */
function palcoFalso() {
  const canvas = {
    style: {},
    addEventListener() {},
    removeEventListener() {},
    setPointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
  };
  return {
    cena: new Scene(),
    canvas,
    redesenha: vi.fn(),
    M: { chapa: material, traco: material, solido: material, ceramica: material, veu: material, casco: material },
  };
}

const lista = [
  { setor: 'Financeiro', chave: 'financeiro', sinal: 'estavel', media: 0 },
  { setor: 'Saúde', chave: 'saude', sinal: 'alta', media: 0.05 },
  { setor: 'Petróleo', chave: 'petroleo', sinal: 'queda', media: -0.05 },
];

/** Monta a cena e devolve o controle, o palco e o grupo do Cotinha. */
function monta(opcoes = {}) {
  const P = palcoFalso();
  const opc = cenaSetores({ colunas: lista, frente: 0, reduz: false, ...opcoes });
  opc.monta(P);
  const pavio = P.cena.getObjectByName('pavio');
  // os braços são os dois pivôs filhos do grupo, na altura do ombro
  const pivos = pavio.children.filter((c) => c.isGroup && c.position.y === PIVO_BRACO.y);
  const corpo = pavio.children.find((c) => c.isGroup && !pivos.includes(c));
  return { P, opc, controle: opc.controle, pavio, pivos, corpo };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('cenaSetores: Cotinha', () => {
  it('a cena contém um objeto nomeado "pavio", de pé à esquerda do objeto (fora do centro)', () => {
    const { pavio } = monta();
    expect(pavio).toBeTruthy();
    expect(pavio.position.x).toBeLessThan(-1.5);
    expect(pavio.position.y).toBe(0);
  });

  it('o Cotinha é o mesmo objeto nas trocas de setor (não recria a cada troca)', () => {
    const { P, controle, pavio } = monta();
    controle.atualiza([...lista].reverse());
    controle.vaiPara(1);
    const nomeados = [];
    P.cena.traverse((o) => { if (o.name === 'pavio') nomeados.push(o); });
    expect(nomeados).toHaveLength(1);
    expect(nomeados[0]).toBe(pavio);
  });

  it('reage ao setor da frente: braços para cima no setor que subiu, encolhe e inclina no que caiu', () => {
    const { opc, controle, pavio, pivos, corpo } = monta({ reduz: true });
    controle.vaiPara(1); // Saúde: alta
    opc.anima(1);
    expect(pivos[0].rotation.z).toBeLessThan(-2);
    expect(pivos[1].rotation.z).toBeGreaterThan(2);
    expect(pavio.position.y).toBe(0);

    controle.vaiPara(2); // Petróleo: queda
    opc.anima(2);
    expect(pavio.rotation.x).toBeGreaterThan(0);
    expect(corpo.scale.y).toBeLessThan(1);
    expect(pivos[0].rotation.z).toBeGreaterThan(-0.5);

    controle.vaiPara(0); // Financeiro: estável, pose neutra
    opc.anima(3);
    expect(pavio.rotation.x).toBe(0);
    expect(corpo.scale.y).toBe(1);
  });

  it('com movimento, a troca para um setor que subiu dá um pulinho que acaba', () => {
    const { opc, controle, pavio } = monta();
    opc.anima(0);
    controle.vaiPara(1);
    opc.anima(1);
    opc.anima(1.2);
    expect(pavio.position.y).toBeGreaterThan(0);
    opc.anima(2);
    expect(pavio.position.y).toBe(0);
  });

  it('com movimento reduzido, a troca não tem pulinho, só a pose final', () => {
    const { opc, controle, pavio } = monta({ reduz: true });
    controle.vaiPara(1);
    opc.anima(1);
    opc.anima(1.2);
    expect(pavio.position.y).toBe(0);
  });

  it('libera a geometria do Cotinha no descarte da cena', () => {
    const { P, opc } = monta();
    const dispose = vi.spyOn(BufferGeometry.prototype, 'dispose');
    opc.aoDestruir();
    const geometrias = [];
    P.cena.getObjectByName('pavio').traverse((o) => { if (o.geometry) geometrias.push(o.geometry); });
    expect(geometrias.length).toBeGreaterThan(0);
    expect(dispose.mock.instances.some((g) => geometrias.includes(g))).toBe(true);
  });
});
