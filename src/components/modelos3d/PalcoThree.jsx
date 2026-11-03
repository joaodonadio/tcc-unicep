import { useEffect, useRef } from 'react';
import { CONSTRUTORES } from './objetos.js';
import { criarPalco, reduzMovimento } from './palco.js';

/**
 * Palco com Three.js. É este arquivo que Modelo3D carrega sob demanda (import dinâmico), então
 * o three fica num chunk à parte. Monta no efeito e limpa tudo ao sair.
 */
export default function PalcoThree({ tipo, dados, ticker, aoFalhar, proximidade }) {
  const palcoRef = useRef(null);
  const rotulosRef = useRef(null);
  const chave = JSON.stringify(dados ?? {});

  useEffect(() => {
    let palco = null;
    // Canvas novo a cada montagem: ao sair, o contexto WebGL é descartado (forceContextLoss), e um
    // canvas reaproveitado (o React monta duas vezes em modo estrito) voltaria sem contexto.
    const canvas = document.createElement('canvas');
    palcoRef.current?.prepend(canvas);
    try {
      const opcoes = CONSTRUTORES[tipo](JSON.parse(chave), ticker, reduzMovimento());
      palco = criarPalco({
        ...opcoes,
        container: palcoRef.current,
        canvas,
        rotulos: rotulosRef.current,
        proximidade,
      });
    } catch {
      aoFalhar?.();
    }
    return () => {
      palco?.destruir();
      canvas.remove();
    };
  }, [tipo, ticker, chave, aoFalhar, proximidade]);

  return (
    <div className="modelo3d-palco" ref={palcoRef} aria-hidden="true" data-testid="modelo3d-palco">
      <div className="modelo3d-rotulos" ref={rotulosRef} />
    </div>
  );
}
