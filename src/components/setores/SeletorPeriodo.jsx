import { useRef } from 'react';
import { useIndicador } from '../../hooks/useIndicador.js';
import { PERIODOS_SETOR } from '../../lib/setores.js';
import { TEXTOS } from '../../lib/textos.js';

const SENTIDO_DA_TECLA = { ArrowRight: 1, ArrowLeft: -1 };

/** Abas de período: Último pregão, 1 semana, 1 mês, 6 meses e 1 ano. Setas trocam de aba, como em abas de verdade. */
export function SeletorPeriodo({ periodo, onEscolher }) {
  const botoes = useRef({});
  // a pílula branca desliza até a aba escolhida (useIndicador); sem medida, a aba ativa segue com o próprio fundo
  const indicador = useIndicador(periodo);

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
      <div ref={indicador.trilhoRef} className="setores-abas" role="tablist" aria-label={TEXTOS.setores.periodoGrupo}>
        <span
          ref={indicador.indicadorRef}
          className="setores-aba-indicador"
          aria-hidden="true"
          style={{ viewTransitionName: 'setores-marcador' }}
        />
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
              data-indicador-alvo={ativo ? 'true' : undefined}
              className="setores-aba"
              data-rotulo={TEXTOS.setores.periodos[chave]}
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
