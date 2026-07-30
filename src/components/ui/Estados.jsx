import { AlertTriangle, Inbox } from 'lucide-react';

/**
 * Os 4 estados de cada bloco: skeleton / dados / vazio / erro (§3).
 * Skeletons têm altura equivalente ao conteúdo real para manter CLS ≈ 0.
 */

export function Linhas({ quantidade = 3, larguras = ['100%', '86%', '64%'] }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: quantidade }, (_, i) => (
        <div
          key={i}
          className="skeleton skeleton-line"
          style={{ width: larguras[i % larguras.length] }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ altura = '9rem', rotulo = 'Carregando análise…' }) {
  return (
    <div className="skeleton-card" role="status" aria-live="polite">
      <span className="sr-only">{rotulo}</span>
      <div className="skeleton" style={{ height: altura }} aria-hidden="true" />
    </div>
  );
}

export function BlocoErro({ titulo = 'Não foi possível carregar', mensagem, onTentarNovamente }) {
  return (
    <div className="state-block is-error" role="alert">
      <div className="state-title">
        <AlertTriangle size={18} aria-hidden="true" />
        {titulo}
      </div>
      <p className="state-text">
        {mensagem || 'O sistema de análise está indisponível no momento.'} Os demais blocos da tela
        continuam funcionando normalmente.
      </p>
      {onTentarNovamente && (
        <button type="button" className="state-retry" onClick={onTentarNovamente}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function BlocoVazio({ titulo = 'Nada por aqui hoje', mensagem }) {
  return (
    <div className="state-block">
      <div className="state-title">
        <Inbox size={18} aria-hidden="true" />
        {titulo}
      </div>
      <p className="state-text">{mensagem}</p>
    </div>
  );
}

/**
 * Fallback do Suspense entre rotas.
 *
 * `min-height` alto de propósito: sem ele, o chunk da rota chega em dezenas de
 * milissegundos e a troca fallback→tela produz um salto de layout grande
 * (medido em 0,11 de CLS). Reservar a altura de uma tela mantém o CLS ≈ 0,
 * que é critério de aceite da §6.
 */
export function CarregandoTela() {
  return (
    <main
      className="screen screen-wide"
      role="status"
      aria-live="polite"
      style={{ minHeight: '100vh' }}
    >
      <span className="sr-only">Carregando a tela…</span>
      <div className="skeleton" style={{ height: '2.5rem', width: '18rem' }} aria-hidden="true" />
      <div style={{ marginTop: '2rem', display: 'grid', gap: '1.125rem' }} aria-hidden="true">
        <CardSkeleton altura="7rem" />
        <CardSkeleton altura="7rem" />
      </div>
    </main>
  );
}
