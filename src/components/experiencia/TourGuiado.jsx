import { useEffect, useRef } from 'react';
import { useTour } from '../../context/contextos.js';

/**
 * RF-5.5 — tour guiado em 5 passos, com navegação real entre as telas.
 * Acessibilidade: `aria-modal`, foco preso no diálogo e Esc para fechar.
 */

const FOCAVEIS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function TourGuiado() {
  const { ativo, passo, passos, total, fechar, proximo, anterior } = useTour();
  const dialogoRef = useRef(null);

  useEffect(() => {
    if (!ativo) return undefined;

    const anteriormenteFocado = document.activeElement;
    dialogoRef.current?.querySelector(FOCAVEIS)?.focus();

    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') {
        fechar();
        return;
      }
      if (evento.key !== 'Tab') return;
      const alvos = dialogoRef.current?.querySelectorAll(FOCAVEIS);
      if (!alvos?.length) return;
      const primeiro = alvos[0];
      const ultimo = alvos[alvos.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      if (anteriormenteFocado instanceof HTMLElement) anteriormenteFocado.focus();
    };
  }, [ativo, passo, fechar]);

  if (!ativo) return null;

  const atual = passos[passo];
  const ultimo = passo === total - 1;

  return (
    <div className="tour-overlay" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div
        className="tour-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-titulo"
        aria-describedby="tour-descricao"
        ref={dialogoRef}
      >
        <div className="tour-head">
          <span className="tour-step">
            TOUR GUIADO · {passo + 1} de {total}
          </span>
          <button type="button" className="tour-close" onClick={fechar} aria-label="Fechar o tour">
            ×
          </button>
        </div>

        <h3 className="tour-title" id="tour-titulo">
          {atual.titulo}
        </h3>
        <p className="tour-desc" id="tour-descricao">
          {atual.descricao}
        </p>

        <div className="tour-dots" aria-hidden="true">
          {passos.map((_, i) => (
            <span key={i} className={`tour-dot${i === passo ? ' is-current' : ''}`} />
          ))}
        </div>

        <div className="tour-actions">
          {passo > 0 ? (
            <button type="button" className="tour-btn tour-btn-prev" onClick={anterior}>
              ← Anterior
            </button>
          ) : (
            <span />
          )}
          {ultimo ? (
            <button type="button" className="tour-btn tour-btn-done" onClick={fechar}>
              Começar a usar ✓
            </button>
          ) : (
            <button type="button" className="tour-btn tour-btn-next" onClick={proximo}>
              Próximo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
