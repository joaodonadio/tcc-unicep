import { describe, expect, it, vi } from 'vitest';
import {
  BoxGeometry, Box3, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PointLight, Texture, Vector3,
} from 'three';
import {
  carregarObjetoGlb, contarTriangulos, normalizar, recolorir,
} from '../../components/setores/glbSetor.js';

const { carregarGltf } = vi.hoisted(() => ({ carregarGltf: vi.fn() }));
vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    loadAsync(url) {
      return carregarGltf(url);
    }
  },
}));

describe('normalizar', () => {
  it('centra em x/z, apoia a base em y = 0 e escala a maior medida para o tamanho pedido', () => {
    const raiz = new Group();
    const malha = new Mesh(new BoxGeometry(10, 4, 2), new MeshBasicMaterial());
    malha.position.set(5, 3, -1);
    raiz.add(malha);

    const env = normalizar(raiz, 0.9);
    const caixa = new Box3().setFromObject(env);
    const medida = caixa.getSize(new Vector3());
    const centro = caixa.getCenter(new Vector3());

    expect(medida.x).toBeCloseTo(0.9, 5);
    expect(caixa.min.y).toBeCloseTo(0, 5);
    expect(centro.x).toBeCloseTo(0, 5);
    expect(centro.z).toBeCloseTo(0, 5);
  });

  it('sem volume devolve null', () => {
    expect(normalizar(new Group(), 1)).toBeNull();
  });
});

describe('recolorir', () => {
  it('troca o material pelo novo, descarta o original e a textura, e tira luzes da árvore', () => {
    const raiz = new Group();
    const textura = new Texture();
    const antigo = new MeshStandardMaterial({ map: textura });
    const spyMaterial = vi.spyOn(antigo, 'dispose');
    const spyTextura = vi.spyOn(textura, 'dispose');
    const malha = new Mesh(new BoxGeometry(1, 1, 1), antigo);
    const luz = new PointLight();
    raiz.add(malha, luz);
    const novo = new MeshBasicMaterial();

    recolorir(raiz, novo);

    expect(malha.material).toBe(novo);
    expect(spyMaterial).toHaveBeenCalledTimes(1);
    expect(spyTextura).toHaveBeenCalledTimes(1);
    expect(raiz.children).not.toContain(luz);
    expect(raiz.children).toContain(malha);
  });
});

describe('contarTriangulos', () => {
  it('conta os triângulos de um cubo', () => {
    const raiz = new Group();
    raiz.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial()));
    expect(contarTriangulos(raiz)).toBe(12);
  });
});

describe('carregarObjetoGlb', () => {
  const cena = (material) => {
    const raiz = new Group();
    const malha = new Mesh(new BoxGeometry(1, 1, 1), material);
    const luz = new PointLight();
    raiz.add(malha, luz);
    return { raiz, malha, luz };
  };

  it('por padrão recolore as malhas com o material do tema', async () => {
    const tinta = new MeshBasicMaterial();
    const { raiz, malha } = cena(new MeshStandardMaterial());
    carregarGltf.mockResolvedValueOnce({ scene: raiz });

    const obj = await carregarObjetoGlb('a.glb', tinta, { tamanho: 1 });

    expect(obj).not.toBeNull();
    expect(malha.material).toBe(tinta);
  });

  it('com manterMateriais mantém os materiais do arquivo, tira luzes e normaliza', async () => {
    const tinta = new MeshBasicMaterial();
    const original = new MeshStandardMaterial();
    const { raiz, malha, luz } = cena(original);
    carregarGltf.mockResolvedValueOnce({ scene: raiz });

    const obj = await carregarObjetoGlb('a.glb', tinta, { tamanho: 1, manterMateriais: true });

    expect(obj).not.toBeNull();
    expect(malha.material).toBe(original);
    expect(raiz.children).not.toContain(luz);
    expect(obj.getObjectByProperty('isLight', true)).toBeUndefined();
    expect(new Box3().setFromObject(obj).getSize(new Vector3()).x).toBeCloseTo(1, 5);
  });
});
