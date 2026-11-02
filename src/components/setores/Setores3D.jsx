import { Suspense, lazy, useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pct } from '../../lib/formato.js';
import { proximoIndice } from '../../lib/setores3d.js';
import { TEXTOS } from '../../lib/textos.js';
import { LimiteErro } from '../modelos3d/LimiteErro.jsx';
import { suportaWebGL } from '../modelos3d/suporte.js';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido.js';

// O three só é baixado quando o quadro chega perto da tela.
const PalcoSetores = lazy(() => import('./PalcoSetores.jsx'));

const valorDe = (media) => (media == null ? TEXTOS.setores.semDado : pct(media));

/**
 * Vitrine giratória dos setores acima da lista. Legenda, setas e teclas existem mesmo enquanto o palco
 * carrega, e leem o mesmo índice da frente. O canvas é aria-hidden; a legenda é a leitura.
 * Sem WebGL, sem setores ou com erro no palco: não renderiza nada.
 */
export function Setores3D({ colunas, destaque, aoEscolher }) {
  const quadroRef = useRef(null);
  const [falhou, setFalhou] = useState(false);
  const [frente, setFrente] = useState(0);
  const idDica = useId();
  const aoFalhar = useCallback(() => setFalhou(true), []);
  const [perto, setPerto] = useState(() => typeof IntersectionObserver !== 'function');
  const desenha = colunas.length > 0 && !falhou && suportaWebGL();
  // o palco lê o movimento na montagem: ao mudar a preferência, ele remonta com o valor novo
  const reduzido = useMovimentoReduzido();
  const n = colunas.length;
  const indice = n ? Math.min(frente, n - 1) : 0;
  const setor = colunas[indice];

  // Linha da lista em destaque: a vitrine gira até aquele setor.
  useEffect(() => {
    if (!destaque) return;
    const k = colunas.findIndex((c) => c.setor === destaque);
    if (k >= 0) setFrente(k);
  }, [destaque, colunas]);

  useEffect(() => {
    if (!desenha || perto || !quadroRef.current) return undefined;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setPerto(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(quadroRef.current);
    return () => io.disconnect();
  }, [desenha, perto]);

  const passa = (passo) => setFrente(proximoIndice(indice, passo, n));
  const aoTecla = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      passa(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      passa(1);
    }
  };

  if (!desenha) return null;
  return (
    <div className="setores3d">
      <div
        className="setores3d-palco"
        ref={quadroRef}
        role="region"
        tabIndex={0}
        aria-label={TEXTOS.setores.cena3d.palco}
        aria-roledescription={TEXTOS.setores.cena3d.papel}
        aria-describedby={idDica}
        onKeyDown={aoTecla}
      >
        {perto && (
          <LimiteErro aoFalhar={aoFalhar}>
            <Suspense fallback={<div className="setores3d-esqueleto esqueleto" />}>
              <PalcoSetores
                key={reduzido ? 'reduzido' : 'livre'}
                colunas={colunas}
                frente={indice}
                aoFrente={setFrente}
                aoFalhar={aoFalhar}
              />
            </Suspense>
          </LimiteErro>
        )}
        <button
          type="button"
          className="botao setores3d-seta"
          aria-label={TEXTOS.setores.cena3d.anterior}
          onClick={() => passa(-1)}
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="botao setores3d-seta"
          aria-label={TEXTOS.setores.cena3d.proximo}
          onClick={() => passa(1)}
        >
          <ChevronRight size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="setores3d-legenda" aria-live="polite">
        <p className="setores3d-legenda-nome">{setor.setor}</p>
        <p className="setores3d-legenda-medida">
          <span>{TEXTOS.setores.cena3d.mediaDoSetor}</span>
          <span className="setores3d-legenda-valor" data-sinal={setor.sinal}>{valorDe(setor.media)}</span>
        </p>
        {setor.n > 0 && Number.isFinite(setor.subiram) && (
          <p className="setores3d-legenda-frase">{TEXTOS.setores.subiramDe(setor.subiram, setor.n)}</p>
        )}
        <button type="button" className="botao setores3d-legenda-ver" onClick={() => aoEscolher?.(setor.setor)}>
          {TEXTOS.setores.cena3d.verSetor}
        </button>
      </div>

      <p id={idDica} className="setores3d-dica">{TEXTOS.setores.cena3d.dica}</p>
    </div>
  );
}
