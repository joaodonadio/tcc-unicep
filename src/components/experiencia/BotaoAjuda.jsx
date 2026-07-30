import { useTour } from '../../context/contextos.js';

/** RF-5.4 — botão flutuante "? Ajuda" que abre o tour. */
export function BotaoAjuda() {
  const { iniciar } = useTour();
  return (
    <button
      type="button"
      className="help-btn"
      onClick={iniciar}
      title="Tour guiado pelas telas do sistema"
    >
      <span style={{ fontSize: '1rem' }} aria-hidden="true">
        ?
      </span>
      Ajuda
    </button>
  );
}
