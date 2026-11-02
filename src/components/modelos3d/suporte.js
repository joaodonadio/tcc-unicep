/**
 * Checagens leves para o objeto 3D. Fica separado do palco.js de propósito: não importa three,
 * então a tela inicial pode perguntar se há WebGL sem baixar o motor (o chunk do three só
 * entra quando o PalcoThree é carregado).
 */

import { movimentoReduzido } from '../../lib/movimento.js';

/** Movimento efetivo (preferência do site ou do sistema); ver lib/movimento.js. */
export const reduzMovimento = () => movimentoReduzido();

let suporte = null;
/** true se o navegador cria contexto WebGL; o resultado é guardado. */
export function suportaWebGL() {
  if (suporte != null) return suporte;
  try {
    if (typeof window === 'undefined' || typeof window.WebGLRenderingContext === 'undefined') {
      suporte = false;
      return suporte;
    }
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    suporte = Boolean(gl);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    suporte = false;
  }
  return suporte;
}
