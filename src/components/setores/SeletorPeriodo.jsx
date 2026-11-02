import { useRef } from 'react';
import { PERIODOS_SETOR } from '../../lib/setores.js';
import { TEXTOS } from '../../lib/textos.js';

const SENTIDO_DA_TECLA = { ArrowRight: 1, ArrowLeft: -1 };

/** Abas de período: Hoje, 1 mês, 6 meses, 12 meses. Setas trocam de aba, como em abas de verdade. */
export function SeletorPeriodo({ periodo, onEscolher }) {
  const botoes = useRef({});

  const aoTeclar = (evento, indice) => {
    const sentido = SENTIDO_DA_TECLA[evento.key];
    if (!sentido) return;
    evento.preventDefault();
    const proximo = PERIODOS_SETOR[(indice + sentido + PERIODOS_SETOR.length) % PERIODOS_SETOR.length];
    onEscolher(proximo);
    botoes.current[proximo]?.focus();
  };

  return (
    <div className="setores-seletor">
      <p className="setores-como-ler">{TEXTOS.setores.periodoAjuda}</p>
      <div className="setores-abas" role="tablist" aria-label={TEXTOS.setores.periodoGrupo}>
        {PERIODOS_SETOR.map((chave, indice) => {
          const ativo = chave === periodo;
          return (
            <button
              key={chave}
              ref={(el) => {
                botoes.current[chave] = el;
              }}
              type="button"
              role="tab"
              id={`aba-${chave}`}
              aria-selected={ativo}
              aria-controls="setores-painel"
              tabIndex={ativo ? 0 : -1}
              className="setores-aba"
              onClick={() => onEscolher(chave)}
              onKeyDown={(evento) => aoTeclar(evento, indice)}
            >
              {TEXTOS.setores.periodos[chave]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
