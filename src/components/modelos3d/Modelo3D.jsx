import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Rotate3d } from 'lucide-react';
import { fraseResposta, temDado } from '../../lib/modelos3d.js';
import { TEXTOS } from '../../lib/textos.js';
import { LimiteErro } from './LimiteErro.jsx';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido.js';
import { suportaWebGL } from './suporte.js';
import { carregarCofrinho } from './precarga.js';

const T = TEXTOS.modelos3d;

// O three só é baixado quando um modelo aparece: o motor fica neste import dinâmico.
const PalcoThree = lazy(() => import('./PalcoThree.jsx'));

/**
 * Objeto 3D que explica uma métrica a quem nunca investiu. Sempre mostra a frase-resposta;
 * o desenho é um complemento (sem número, sem WebGL ou com erro, só a frase aparece).
 * tipo: 'balanca' | 'moedas' | 'cofrinho' | 'pendulo'; dados: ver lib/modelos3d.js.
 */
export default function Modelo3D({ tipo, dados, ticker }) {
  const [falhou, setFalhou] = useState(false);
  const aoFalhar = useCallback(() => setFalhou(true), []);
  // o palco lê o movimento na montagem: ao mudar a preferência, ele remonta com o valor novo
  const reduzido = useMovimentoReduzido();
  const { pergunta, resposta } = fraseResposta(tipo, dados);
  const desenha = temDado(tipo, dados) && !falhou && suportaWebGL();
  // O .glb do cofrinho começa a baixar já na montagem, sem esperar o palco. Falha aqui fica para o palco tratar.
  useEffect(() => {
    if (desenha && tipo === 'cofrinho') carregarCofrinho().catch(() => {});
  }, [desenha, tipo]);
  const frase = (
    <p className="modelo3d-frase">
      <strong>{pergunta}</strong> {resposta}
    </p>
  );

  return (
    <figure className="modelo3d" data-tipo={tipo}>
      {frase}
      {desenha && (
        <>
          <div className="modelo3d-quadro">
            <LimiteErro reserva={null}>
              <Suspense
                fallback={
                  <div className="modelo3d-palco esqueleto" role="status" aria-label={T.carregando} />
                }
              >
                <PalcoThree
                  key={reduzido ? 'reduzido' : 'livre'}
                  tipo={tipo}
                  dados={dados}
                  ticker={ticker}
                  aoFalhar={aoFalhar}
                />
              </Suspense>
            </LimiteErro>
            <span className="modelo3d-dica">
              <Rotate3d size={14} aria-hidden="true" />
              {T.arraste}
            </span>
          </div>
          <figcaption className="modelo3d-legenda">{T.legenda[tipo]}</figcaption>
        </>
      )}
    </figure>
  );
}
