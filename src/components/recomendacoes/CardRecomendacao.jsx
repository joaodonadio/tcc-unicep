import { useId } from 'react';
import { AnaliseExpandida } from './AnaliseExpandida.jsx';
import { useDecisoes } from '../../context/contextos.js';
import { horaCurta } from '../../lib/formato.js';

/**
 * RF-2.2 · RF-2.3 · RF-2.6 · RF-2.8 — o card de recomendação.
 *
 * Colapsado mostra apenas o essencial (tipo, título em frase, resumo,
 * confiança e risco); a análise completa vem por progressive disclosure, para
 * não afogar quem só quer a visão geral (M12).
 */
export function CardRecomendacao({ recomendacao, expandido, aoAlternar, perfil, geradoEm }) {
  const { decisoes, decidir, desfazer } = useDecisoes();
  const idPainel = useId();

  const r = recomendacao;
  const oportunidade = r.tipo === 'oportunidade';
  const decisao = decisoes[r.id];

  const classeRisco = `is-${r.risco.toLowerCase()}`;

  return (
    <article className="rec-card" aria-labelledby={`${idPainel}-titulo`}>
      <div className="rec-head">
        <div>
          <div className="rec-tags">
            <span className={`rec-badge is-${oportunidade ? 'op' : 'risk'}`}>
              {oportunidade ? '● OPORTUNIDADE' : '⚠ PONTO DE ATENÇÃO'}
            </span>
            <span className="rec-setor">{r.setor}</span>
          </div>
          <h3 className="rec-title" id={`${idPainel}-titulo`}>
            {r.ticker} <span>{r.titulo}</span>
          </h3>
          <p className="rec-resumo">{r.resumo}</p>
        </div>

        <div className="rec-side">
          <div>
            <div className="conf-head">
              <span className="conf-label">CONFIANÇA DA ANÁLISE</span>
              <span className="conf-value">{r.confianca}%</span>
            </div>
            <div
              className="bar-track"
              role="meter"
              aria-valuenow={r.confianca}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Confiança da análise de ${r.ticker}`}
            >
              <div className="bar-fill" style={{ width: `${r.confianca}%` }} />
            </div>
          </div>
          <div className={`risk-pill ${classeRisco}`}>RISCO {r.risco.toUpperCase()}</div>
        </div>
      </div>

      {/* RF-2.3 — análise expandida */}
      <div className="rec-expand" data-open={expandido} id={idPainel} aria-hidden={!expandido}>
        {expandido && (
          <>
            <AnaliseExpandida recomendacao={r} perfil={perfil} />

            <div className="rec-actions">
              {decisao ? (
                <>
                  <span
                    className={`dec-state is-${decisao.acao === 'seguir' ? 'seguir' : 'ignorar'}`}
                  >
                    {decisao.acao === 'seguir'
                      ? '✓ Você marcou: seguir esta recomendação'
                      : '○ Você marcou: ignorar por agora'}
                  </span>
                  <button type="button" className="dec-undo" onClick={() => desfazer(r.id)}>
                    desfazer
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="dec-btn-seguir"
                    onClick={() => decidir(r, 'seguir')}
                  >
                    ✓ Seguir recomendação
                  </button>
                  <button
                    type="button"
                    className="dec-btn-ignorar"
                    onClick={() => decidir(r, 'ignorar')}
                  >
                    Ignorar por agora
                  </button>
                </>
              )}

              {/* RF-2.8 — proveniência */}
              <span className="rec-proveniencia">
                ANÁLISE GERADA ÀS {horaCurta(geradoEm)} · FONTES: PREÇOS B3, NOTÍCIAS, INDICADORES
                TÉCNICOS
              </span>
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        className="rec-toggle"
        onClick={aoAlternar}
        aria-expanded={expandido}
        aria-controls={idPainel}
      >
        {expandido ? 'Recolher análise' : 'Entender esta recomendação'}{' '}
        <span aria-hidden="true">{expandido ? '▲' : '▼'}</span>
      </button>
    </article>
  );
}
