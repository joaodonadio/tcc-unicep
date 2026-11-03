/**
 * Título de notícia como veio do pacote, no idioma original.
 * Usa apenas <span>: pode ficar dentro de um <a>.
 */
export function Manchete({ titulo }) {
  return (
    <span className="manchete">
      <span className="manchete-texto">{String(titulo ?? '')}</span>
    </span>
  );
}
