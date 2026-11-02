/**
 * Pré-carregamento do cofrinho (.glb). Módulo leve: não importa three nem o palco, então pode ser chamado
 * por Modelo3D assim que a ficha ou a aba abre, antes de o palco montar. O GLTFLoader só entra quando é preciso.
 */

/** Caminho do modelo do cofrinho (public/modelos/cofrinho.glb). */
export const URL_COFRINHO = `${import.meta.env?.BASE_URL ?? '/'}modelos/cofrinho.glb`;

/** Uma única requisição por página: a Promise fica guardada aqui. Quem usa clona a cena do gltf. */
let promessa = null;

/**
 * Devolve a Promise do gltf do cofrinho (sempre a mesma). Em falha, zera o cache para a próxima tentativa.
 * Quem recebe o gltf não deve alterar a cena dele: usa gltf.scene.clone(true).
 */
export function carregarCofrinho() {
  if (!promessa) {
    promessa = import('three/examples/jsm/loaders/GLTFLoader.js')
      .then(({ GLTFLoader }) => new GLTFLoader().loadAsync(URL_COFRINHO))
      .catch((erro) => {
        promessa = null;
        throw erro;
      });
  }
  return promessa;
}
