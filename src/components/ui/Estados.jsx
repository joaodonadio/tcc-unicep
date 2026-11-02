import { TEXTOS } from '../../lib/textos.js';

/**
 * Os 4 estados de cada bloco: skeleton / dados / vazio / erro (§3).
 * Skeletons têm altura equivalente ao conteúdo real para manter CLS ≈ 0.
 */

export function Linhas({ quantidade = 3, larguras = ['100%', '86%', '64%'] }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: quantidade }, (_, i) => (
        <span key={i} className="esqueleto" style={{ width: larguras[i % larguras.length] }} />
      ))}
    </div>
  );
}

export function CardSkeleton({ altura = '9rem', rotulo = TEXTOS.estados.carregando }) {
  return (
    <div className="cartao" role="status" aria-live="polite">
      <span className="sr-only">{rotulo}</span>
      <span className="esqueleto" style={{ height: altura }} aria-hidden="true" />
    </div>
  );
}

export function BlocoErro({ titulo = TEXTOS.estados.erroTitulo, mensagem, onTentarNovamente, nivel = 3 }) {
  const Titulo = `h${nivel}`;
  return (
    <div className="estado estado--erro" role="alert">
      <Titulo>{titulo}</Titulo>
      <p>{mensagem ?? TEXTOS.estados.erroTexto}</p>
      {onTentarNovamente && (
        <button type="button" className="botao" onClick={onTentarNovamente}>
          {TEXTOS.estados.tentarDeNovo}
        </button>
      )}
    </div>
  );
}

export function BlocoVazio({ titulo = TEXTOS.estados.vazio, mensagem, nivel = 3 }) {
  const Titulo = `h${nivel}`;
  return (
    <div className="estado estado--vazio">
      <Titulo>{titulo}</Titulo>
      {mensagem && <p>{mensagem}</p>}
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
    <div className="pagina" role="status" aria-live="polite" style={{ minHeight: '100dvh' }}>
      <span className="sr-only">{TEXTOS.estados.carregando}</span>
      <span className="esqueleto" style={{ height: '2.5rem', width: '18rem' }} aria-hidden="true" />
      <div style={{ marginTop: '2rem', display: 'grid', gap: '1.125rem' }} aria-hidden="true">
        <CardSkeleton altura="7rem" />
        <CardSkeleton altura="7rem" />
      </div>
    </div>
  );
}
