import { useRef } from 'react';
import { useIndicador } from '../../hooks/useIndicador.js';
import { PERGUNTAS } from '../../lib/perguntasFicha.js';
import { TEXTOS } from '../../lib/textos.js';

const TECLAS_PROXIMA = ['ArrowRight', 'ArrowDown'];
const TECLAS_ANTERIOR = ['ArrowLeft', 'ArrowUp'];

/**
 * Barra de abas da ficha, uma aba por pergunta. Setas, Home e End trocam a aba.
 */
export function NavPerguntas({ atual, aoEscolher }) {
  const botoes = useRef({});
  const ultimo = PERGUNTAS.length - 1;
  // o marcador que desliza é o fundo da aba ativa (ver .ficha-aba-marcador)
  const indicador = useIndicador(atual);

  const escolher = (id) => {
    aoEscolher(id);
    botoes.current[id]?.focus();
  };

  const aoTecla = (e, indice) => {
    let destino = null;
    if (TECLAS_PROXIMA.includes(e.key)) destino = indice === ultimo ? 0 : indice + 1;
    else if (TECLAS_ANTERIOR.includes(e.key)) destino = indice === 0 ? ultimo : indice - 1;
    else if (e.key === 'Home') destino = 0;
    else if (e.key === 'End') destino = ultimo;
    if (destino === null) return;
    e.preventDefault();
    escolher(PERGUNTAS[destino].id);
  };

  return (
    <div
      ref={indicador.trilhoRef}
      className="ficha-abas"
      role="tablist"
      aria-label={TEXTOS.ficha.perguntas_rotulo}
    >
      <span ref={indicador.indicadorRef} className="ficha-aba-marcador" aria-hidden="true" />
      {PERGUNTAS.map((pergunta, indice) => {
        const selecionada = pergunta.id === atual;
        return (
          <button
            key={pergunta.id}
            ref={(el) => {
              botoes.current[pergunta.id] = el;
            }}
            type="button"
            role="tab"
            id={'aba-' + pergunta.id}
            aria-controls={selecionada ? 'painel-' + pergunta.id : undefined}
            aria-selected={selecionada}
            tabIndex={selecionada ? 0 : -1}
            className="ficha-aba"
            data-indicador-alvo={selecionada ? 'true' : undefined}
            onClick={() => escolher(pergunta.id)}
            onKeyDown={(e) => aoTecla(e, indice)}
          >
            {TEXTOS.ficha.perguntas[pergunta.id].curto}
          </button>
        );
      })}
    </div>
  );
}
