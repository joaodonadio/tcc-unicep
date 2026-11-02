import { useEffect, useRef } from 'react';
import { criarPalco } from '../modelos3d/palco.js';
import { reduzMovimento } from '../modelos3d/suporte.js';
import { cenaSetores } from './cenaSetores.js';

/**
 * Palco da vitrine dos setores. Setores3D carrega este arquivo sob demanda (o three fica no chunk à parte).
 * O canvas é aria-hidden: quem lê é a legenda e os botões de Setores3D, ligados ao mesmo índice da frente.
 */
export default function PalcoSetores({ colunas, frente, aoFrente, aoFalhar }) {
  const camadaRef = useRef(null);
  const controleRef = useRef(null);
  const atual = useRef({ colunas, frente, aoFrente });
  useEffect(() => {
    atual.current = { colunas, frente, aoFrente };
  });

  useEffect(() => {
    let palco = null;
    // Canvas novo a cada montagem (modo estrito monta duas vezes).
    const canvas = document.createElement('canvas');
    const camada = camadaRef.current;
    camada?.prepend(canvas);
    // O contêiner do palco (pai da camada) diz quando o ponteiro está sobre ele: sem giro ocioso.
    const contenedor = camada?.parentElement;
    const sobreEntra = () => controleRef.current?.sobre(true);
    const sobreSai = () => controleRef.current?.sobre(false);
    try {
      const opcoes = cenaSetores({
        colunas: atual.current.colunas,
        frente: atual.current.frente,
        reduz: reduzMovimento(),
        aoFrente: (k) => atual.current.aoFrente?.(k),
      });
      palco = criarPalco({ ...opcoes, container: camada, canvas, rotulos: null });
      controleRef.current = opcoes.controle;
      contenedor?.addEventListener('pointerenter', sobreEntra);
      contenedor?.addEventListener('pointerleave', sobreSai);
    } catch {
      aoFalhar?.();
    }
    return () => {
      contenedor?.removeEventListener('pointerenter', sobreEntra);
      contenedor?.removeEventListener('pointerleave', sobreSai);
      controleRef.current = null;
      palco?.destruir();
      canvas.remove();
    };
  }, [aoFalhar]);

  useEffect(() => { controleRef.current?.atualiza(colunas); }, [colunas]);
  useEffect(() => { controleRef.current?.vaiPara(frente); }, [frente]);

  return <div className="setores3d-camada" ref={camadaRef} aria-hidden="true" />;
}
