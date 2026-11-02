import { Box3, Group, Vector3 } from 'three';

/** Libera geometrias de uma árvore (materiais compartilhados ficam com o palco). */
export function descartarGeometrias(raiz) {
  raiz?.traverse((o) => o.geometry?.dispose());
}

function descartarMaterial(m) {
  if (!m) return;
  Object.values(m).forEach((v) => v?.isTexture && v.dispose());
  m.dispose();
}

/** Libera os materiais (e texturas) das malhas de uma árvore. Usar só em materiais que vieram do arquivo. */
export function descartarMateriais(raiz) {
  raiz?.traverse((o) => {
    if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(descartarMaterial);
  });
}

/** Triângulos de todas as malhas. */
export function contarTriangulos(raiz) {
  let n = 0;
  raiz.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    n += (g.index ? g.index.count : g.attributes.position?.count ?? 0) / 3;
  });
  return n;
}

/** Tira luzes e câmeras do arquivo, deixando as malhas como estão. */
export function tirarIntrusos(raiz) {
  const intrusos = [];
  raiz.traverse((o) => {
    if (o.isLight || o.isCamera) intrusos.push(o);
  });
  intrusos.forEach((o) => o.removeFromParent());
  return raiz;
}

/** Tira luzes e câmeras do arquivo e troca todo material por `material` (tinta única do tema), liberando os originais. */
export function recolorir(raiz, material) {
  raiz.traverse((o) => {
    if (!o.isMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(descartarMaterial);
    o.material = material;
  });
  return tirarIntrusos(raiz);
}

/** Centra em x/z, apoia a base em y = 0 e escala a maior medida para `tamanho`. Sem volume: null. */
export function normalizar(raiz, tamanho) {
  raiz.updateMatrixWorld(true);
  const caixa = new Box3().setFromObject(raiz);
  if (caixa.isEmpty()) return null;
  const medida = caixa.getSize(new Vector3());
  const maior = Math.max(medida.x, medida.y, medida.z);
  if (!(maior > 0)) return null;
  const centro = caixa.getCenter(new Vector3());
  raiz.position.sub(new Vector3(centro.x, caixa.min.y, centro.z));
  const envelope = new Group();
  envelope.add(raiz);
  envelope.scale.setScalar(tamanho / maior);
  return envelope;
}

/**
 * Baixa o .glb, normaliza e devolve. Por padrão recolore tudo com `material` (tinta única do tema);
 * com { manterMateriais: true } mantém os materiais do arquivo e só tira luzes e câmeras.
 * Qualquer falha (arquivo ausente, compressão Draco, pesado demais) devolve null,
 * e quem chamou mantém o objeto de primitivas. O GLTFLoader só é baixado aqui (import dinâmico, chunk próprio).
 */
export async function carregarObjetoGlb(url, material, { tamanho = 1, limite = 20000, manterMateriais = false } = {}) {
  try {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync(url);
    const raiz = gltf.scene;
    if (!raiz || contarTriangulos(raiz) > limite) {
      descartarMateriais(raiz);
      descartarGeometrias(raiz);
      return null;
    }
    const pronto = normalizar(manterMateriais ? tirarIntrusos(raiz) : recolorir(raiz, material), tamanho);
    if (!pronto) {
      if (manterMateriais) descartarMateriais(raiz);
      descartarGeometrias(raiz);
    }
    return pronto;
  } catch {
    return null;
  }
}
