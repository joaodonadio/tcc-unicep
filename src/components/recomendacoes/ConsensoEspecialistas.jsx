import { brl } from '../../lib/formato.js';

/**
 * RF-2.9 — "Com base nos especialistas" (Sistema × Mercado).
 *
 * Transparência: o sistema se compara ao consenso das casas de análise e
 * ADMITE divergência em vez de escondê-la — quando os especialistas estão
 * divididos, o texto diz isso explicitamente.
 */
export function ConsensoEspecialistas({ recomendacoes }) {
  const comConsenso = recomendacoes.filter((r) => r.consenso);
  if (comConsenso.length === 0) return null;

  return (
    <section style={{ marginTop: '4.625rem' }}>
      <div className="eyebrow">
        <span className="eyebrow-dot" style={{ background: 'var(--success)' }} aria-hidden="true" />
        <span>SISTEMA × MERCADO</span>
      </div>
      <h2 className="h2-sm">
        Com base nos <span className="hl">especialistas</span>.
      </h2>
      <p className="lead" style={{ maxWidth: '37.5rem' }}>
        O sistema compara suas análises com o consenso de casas de análise do mercado. Quando
        concordam, a confiança aumenta; quando divergem, o sistema avisa — nunca esconde.
      </p>

      <div className="grid-3">
        {comConsenso.map((r) => {
          const c = r.consenso;
          const total = c.compra + c.neutro + c.venda || 1;
          const potencialPositivo = !String(c.potencial).startsWith('-');
          const concordam = c.concordancia === 'concordam';

          return (
            <div className="expert-card" key={r.id}>
              <div className="expert-head">
                <span className="expert-ticker">{r.ticker}</span>
                <span className="expert-casas">{c.casas} CASAS DE ANÁLISE</span>
              </div>

              <div
                className="expert-bar"
                role="img"
                aria-label={`${c.compra} recomendam compra, ${c.neutro} neutro e ${c.venda} venda.`}
              >
                <div className="expert-seg-compra" style={{ width: `${(c.compra / total) * 100}%` }} />
                <div className="expert-seg-neutro" style={{ width: `${(c.neutro / total) * 100}%` }} />
                <div className="expert-seg-venda" style={{ width: `${(c.venda / total) * 100}%` }} />
              </div>
              <div className="expert-counts">
                <span>▲ {c.compra} compra</span>
                <span>{c.neutro} neutro</span>
                <span>▼ {c.venda} venda</span>
              </div>

              <div className="expert-alvo">
                <div>
                  <div className="expert-alvo-label">PREÇO-ALVO MÉDIO</div>
                  <div className="expert-alvo-value">{brl(c.preco_alvo)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="expert-alvo-label">POTENCIAL</div>
                  <div className={`expert-pot is-${potencialPositivo ? 'up' : 'down'}`}>
                    {String(c.potencial).replace('.', ',')}%
                  </div>
                </div>
              </div>

              <div className={`expert-match is-${concordam ? 'concordam' : 'divididos'}`}>
                ●{' '}
                {concordam
                  ? 'Sistema e especialistas concordam'
                  : 'Especialistas divididos — o sistema recomenda cautela'}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
