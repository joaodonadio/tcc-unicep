import { describe, expect, it } from 'vitest';
import { Group, Mesh, MeshBasicMaterial, Object3D, Scene, Vector3 } from 'three';
import { criaAnimaPavio, criarPavio3D, escalaPiscada, POSES_BRACOS } from '../../components/modelos3d/pavio3d.js';
import { CONSTRUTORES } from '../../components/modelos3d/objetos.js';

const material = () => new MeshBasicMaterial();

/** Palco mínimo para montar as cenas sem renderer: só o que o motor oferece às cenas. */
function palcoFalso() {
  return {
    cena: new Scene(),
    M: { chapa: material, traco: material, solido: material, ceramica: material, veu: material, casco: material },
    peca: (geo) => {
      const g = new Group();
      g.add(new Mesh(geo, material()));
      return g;
    },
    linha: () => new Object3D(),
    rotulo: (texto, pos) => ({ pos: new Vector3(...pos), e: {} }),
  };
}

const contem = (raiz, nome) => {
  let achou = false;
  raiz.traverse((o) => {
    if (o.name === nome) achou = true;
  });
  return achou;
};

describe('criarPavio3D', () => {
  it('monta corpo, dois olhos, dois braços e os dois pavios', () => {
    const p = criarPavio3D();
    expect(p.grupo.name).toBe('pavio');
    expect(p.corpo.children.length).toBeGreaterThan(0);
    expect(p.olhos).toHaveLength(2);
    expect(p.olhos.every((o) => o.parent === p.corpo)).toBe(true);
    expect(p.bracos).toHaveLength(2);
    expect(p.grupoMao).toHaveLength(2);
    expect(p.pavios).toHaveLength(2);
  });

  it('a escala vale no grupo inteiro', () => {
    expect(criarPavio3D({ escala: 2 }).grupo.scale.x).toBe(2);
  });

  it('cada pose dá um par de ângulos diferente nos braços', () => {
    const pares = POSES_BRACOS.map((pose) => {
      const p = criarPavio3D({ bracos: pose });
      return `${p.bracos[0].rotation.z.toFixed(3)},${p.bracos[1].rotation.z.toFixed(3)}`;
    });
    expect(new Set(pares).size).toBe(POSES_BRACOS.length);
  });

  it('pose desconhecida cai em soltos', () => {
    const soltos = criarPavio3D({ bracos: 'soltos' }).bracos.map((b) => b.rotation.z);
    const outra = criarPavio3D({ bracos: 'inventada' }).bracos.map((b) => b.rotation.z);
    expect(outra).toEqual(soltos);
  });

  it('a mão fica na ponta do braço', () => {
    const p = criarPavio3D({ comprimentoBraco: 0.4 });
    expect(p.grupoMao[0].position.y).toBeCloseTo(-0.4);
  });

  it('usa os materiais recebidos (o palco rastreia para liberar)', () => {
    let chamadas = 0;
    const M = {
      ceramica: (tok) => {
        chamadas++;
        return new MeshBasicMaterial({ color: tok === '--cor-mascote' ? 0x5fc9c0 : 0x111113 });
      },
      solido: () => new MeshBasicMaterial(),
      veu: () => new MeshBasicMaterial(),
    };
    criarPavio3D({ M });
    expect(chamadas).toBeGreaterThan(0);
  });
});

describe('animação ociosa do Cotinha', () => {
  it('a piscada fecha e volta; fora dela o olho fica inteiro', () => {
    expect(escalaPiscada(-1)).toBe(1);
    expect(escalaPiscada(0.03)).toBeLessThan(1);
    expect(escalaPiscada(0.2)).toBe(1);
  });

  it('o corpo respira e os olhos ficam na escala da piscada', () => {
    const p = criarPavio3D();
    const anima = criaAnimaPavio(p);
    anima(0.5);
    expect(p.corpo.scale.y).toBeGreaterThan(1 - 0.01);
    expect(p.olhos.every((o) => o.scale.y <= 1)).toBe(true);
  });

  it('braço que não é livre fica na pose de quem chama; o livre oscila sem acumular', () => {
    const p = criarPavio3D({ bracos: 'apoiado' });
    const anima = criaAnimaPavio(p, { bracosLivres: [0] });
    const direito = p.bracos[1].rotation.z;
    const base = p.bracos[0].rotation.z;
    for (let s = 0; s < 12; s += 0.1) anima(s);
    expect(p.bracos[1].rotation.z).toBe(direito);
    // ±0,03 rad em volta da base, sem derivar
    expect(Math.abs(p.bracos[0].rotation.z - base)).toBeLessThanOrEqual(0.03 + 1e-9);
  });

  it('o balanço e a antena giram só de leve', () => {
    const p = criarPavio3D();
    const anima = criaAnimaPavio(p);
    for (let s = 0; s < 12; s += 0.05) {
      anima(s);
      expect(Math.abs(p.corpo.rotation.z)).toBeLessThanOrEqual(0.026 + 1e-9);
      expect(Math.abs(p.antena.rotation.z)).toBeLessThanOrEqual(0.08 + 1e-9);
    }
  });
});

describe('cenas com o Cotinha', () => {
  const DADOS = {
    balanca: { dlEbitda: 2 },
    moedas: { pl: 8, plSetor: 11 },
    cofrinho: { dy: 0.08, dySetor: 0.05 },
    pendulo: { beta: 1.1 },
  };

  it.each(Object.keys(DADOS))('%s inclui um objeto nomeado "pavio"', (tipo) => {
    const P = palcoFalso();
    CONSTRUTORES[tipo](DADOS[tipo], 'PETR4', false).monta(P);
    expect(contem(P.cena, 'pavio')).toBe(true);
  });

  it.each(Object.keys(DADOS))('%s sem movimento reduzido não se mexe', (tipo) => {
    const P = palcoFalso();
    const opcoes = CONSTRUTORES[tipo](DADOS[tipo], 'PETR4', true);
    opcoes.monta(P);
    expect(contem(P.cena, 'pavio')).toBe(true);
    expect(opcoes.anima(1.3)).toBe(false);
  });

  it('o cofrinho anima com movimento livre', () => {
    const P = palcoFalso();
    const opcoes = CONSTRUTORES.cofrinho(DADOS.cofrinho, 'PETR4', false);
    opcoes.monta(P);
    expect(opcoes.anima(1.3)).toBe(true);
  });
});

