import { useLayoutEffect, useRef } from 'react';
import { estiloDoIndicador, posicaoDoIndicador } from '../lib/indicador.js';

const SELETOR_ALVO = '[data-indicador-alvo]';
/** Depois de um deslize, por quanto tempo uma mudança de tamanho ainda desliza (o palco novo muda a altura da lista). */
const JANELA_DESLIZE_MS = 400;

const agora = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * Indicador de seleção compartilhado: um elemento só (fundo + aresta) que desliza até o item escolhido.
 * O trilho recebe `trilhoRef`; o indicador, `indicadorRef`; o item escolhido tem `data-indicador-alvo`.
 * `chave` muda quando a seleção muda: aí ele desliza (transição de transform no CSS). Mudança de tamanho
 * só acompanha, sem deslizar. Sem medida (jsdom, item oculto) fica desligado: o trilho não ganha
 * `data-indicador` e o item escolhido segue com o próprio destaque.
 */
export function useIndicador(chave) {
  const trilhoRef = useRef(null);
  const indicadorRef = useRef(null);
  const posicionado = useRef(false);
  const ultimo = useRef('');
  const deslizandoAte = useRef(0);

  useLayoutEffect(() => {
    const trilho = trilhoRef.current;
    const indicador = indicadorRef.current;
    if (!trilho || !indicador) {
      posicionado.current = false;
      ultimo.current = '';
      return undefined;
    }

    const posicionar = (deslizar) => {
      const estilo = estiloDoIndicador(posicaoDoIndicador(trilho.querySelector(SELETOR_ALVO)));
      if (!estilo) {
        delete trilho.dataset.indicador;
        posicionado.current = false;
        ultimo.current = '';
        return;
      }
      const marca = `${estilo.width}|${estilo.height}|${estilo.transform}`;
      if (marca === ultimo.current) return;
      const animar = deslizar && posicionado.current;
      if (animar) {
        deslizandoAte.current = agora() + JANELA_DESLIZE_MS;
      } else {
        indicador.style.transition = 'none';
      }
      Object.assign(indicador.style, estilo);
      if (!animar) {
        void indicador.offsetWidth; // aplica a posição antes de devolver a transição do CSS
        indicador.style.transition = '';
      }
      trilho.dataset.indicador = 'ligado';
      posicionado.current = true;
      ultimo.current = marca;
    };

    posicionar(true);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observador = new ResizeObserver(() => posicionar(agora() < deslizandoAte.current));
    observador.observe(trilho);
    const alvo = trilho.querySelector(SELETOR_ALVO);
    if (alvo) observador.observe(alvo);
    return () => observador.disconnect();
  }, [chave]);

  return { trilhoRef, indicadorRef };
}
