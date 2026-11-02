import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePreferencias } from '../../context/contextos.js';
import { EXPLICACOES } from '../../lib/explicacoes.js';
import { TEXTOS } from '../../lib/textos.js';

/** Evento com o id do balão que acabou de abrir: os outros balões fecham ao ouvi-lo. */
const EVENTO_TERMO_ABERTO = 'termo-aberto';
/** Distância mínima do balão até a borda da janela, e do balão até o termo. */
const MARGEM = 16;
const DISTANCIA_TERMO = 8;

/**
 * Termo explicado no texto. O clique abre um balão logo abaixo do termo (ou acima, se não
 * couber) só com a explicação dessa chave. Sem explicação conhecida, mostra só o texto.
 */
export function BotaoTermo({ chave, children }) {
  const explicacao = EXPLICACOES[chave];
  if (!explicacao) return <>{children}</>;
  return (
    <BotaoComExplicacao chave={chave} explicacao={explicacao}>
      {children}
    </BotaoComExplicacao>
  );
}

function BotaoComExplicacao({ chave, explicacao, children }) {
  const { nivel } = usePreferencias();
  const id = useId();
  const idTitulo = `${id}-titulo`;
  const idBalao = `${id}-balao`;
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState(null);
  const botaoRef = useRef(null);
  const balaoRef = useRef(null);

  const fechar = useCallback((devolverFoco) => {
    setAberto(false);
    if (devolverFoco) botaoRef.current?.focus();
  }, []);

  const calcular = useCallback(() => {
    const botao = botaoRef.current;
    const balao = balaoRef.current;
    if (!botao || !balao) return;
    const termo = botao.getBoundingClientRect();
    const largura = balao.offsetWidth;
    const altura = balao.offsetHeight;
    const acima = termo.bottom + DISTANCIA_TERMO + altura > window.innerHeight;
    const top = acima ? termo.top - DISTANCIA_TERMO - altura : termo.bottom + DISTANCIA_TERMO;
    const centro = termo.left + termo.width / 2;
    const maxLeft = window.innerWidth - MARGEM - largura;
    const left = Math.max(MARGEM, Math.min(centro - largura / 2, maxLeft));
    const seta = Math.max(MARGEM, Math.min(centro - left, largura - MARGEM));
    setPosicao({ top, left, seta, acima });
  }, []);

  // um balão por vez: ao abrir outro termo, este fecha
  useEffect(() => {
    function aoOutroAbrir(evento) {
      if (evento.detail !== id) setAberto(false);
    }
    window.addEventListener(EVENTO_TERMO_ABERTO, aoOutroAbrir);
    return () => window.removeEventListener(EVENTO_TERMO_ABERTO, aoOutroAbrir);
  }, [id]);

  // mede o balão antes da pintura para posicioná-lo sem salto
  useLayoutEffect(() => {
    if (aberto) calcular();
  }, [aberto, calcular]);

  useEffect(() => {
    if (!aberto) return undefined;
    balaoRef.current?.focus({ preventScroll: true });

    function aoTeclar(evento) {
      if (evento.key !== 'Escape') return;
      evento.preventDefault();
      fechar(true);
    }
    function aoClicarFora(evento) {
      const alvo = evento.target;
      if (balaoRef.current?.contains(alvo) || botaoRef.current?.contains(alvo)) return;
      fechar(false);
    }
    const recalcular = () => calcular();

    window.addEventListener('scroll', recalcular, { capture: true, passive: true });
    window.addEventListener('resize', recalcular);
    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('pointerdown', aoClicarFora);
    return () => {
      window.removeEventListener('scroll', recalcular, { capture: true });
      window.removeEventListener('resize', recalcular);
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('pointerdown', aoClicarFora);
    };
  }, [aberto, calcular, fechar]);

  function aoClicar() {
    if (aberto) {
      fechar(true);
      return;
    }
    window.dispatchEvent(new CustomEvent(EVENTO_TERMO_ABERTO, { detail: id }));
    setAberto(true);
  }

  // um texto só, o do modo escolhido (o técnico cai no simples quando não existe)
  const paragrafos = [nivel === 'tecnico' && explicacao.tecnico ? explicacao.tecnico : explicacao.simples];

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        className="termo-botao"
        data-termo={chave}
        aria-expanded={aberto}
        aria-controls={idBalao}
        onClick={aoClicar}
      >
        {children}
      </button>
      {aberto &&
        createPortal(
          <div
            ref={balaoRef}
            id={idBalao}
            className="termo-balao"
            role="dialog"
            aria-labelledby={idTitulo}
            tabIndex={-1}
            onKeyDown={(evento) => {
              // o balão é um portal no fim do body: Tab saindo dele iria para fora da página
              if (evento.key !== 'Tab') return;
              evento.preventDefault();
              fechar(true);
            }}
            data-posicao={posicao?.acima ? 'acima' : 'abaixo'}
            style={{
              top: posicao?.top ?? 0,
              left: posicao?.left ?? 0,
              '--seta-x': `${posicao?.seta ?? 0}px`,
            }}
          >
            <div className="termo-balao__topo">
              <h3 id={idTitulo} className="termo-balao__titulo">
                {explicacao.titulo}
              </h3>
              <button
                type="button"
                className="termo-balao__fechar"
                aria-label={TEXTOS.termo.fechar}
                onClick={() => fechar(true)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="square"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
            </div>
            <div className="termo-balao__texto">
              {paragrafos.map((paragrafo) => (
                <p key={paragrafo}>{paragrafo}</p>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
