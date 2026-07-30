import { usePreferencias } from '../../context/contextos.js';

/**
 * Camada de experiência, fixa no canto inferior esquerdo:
 * RF-5.1 EXPLICAÇÕES Simples/Técnicas · RF-5.2 MODO CALMO · RF-5.3 TEXTO A−/A+.
 *
 * Os toggles usam `role="switch"`/`aria-checked` para que leitores de tela
 * anunciem o estado, e não apenas o rótulo (ARQUITETURA-INTERFACE.md §4.4).
 */

const NIVEIS = [
  { id: 'simples', rotulo: 'Simples' },
  { id: 'tecnico', rotulo: 'Técnicas' },
];

export function ControlesExperiencia() {
  const {
    nivel,
    calmo,
    zoom,
    definirNivel,
    alternarCalmo,
    aumentarZoom,
    diminuirZoom,
    zoomNoMaximo,
    zoomNoMinimo,
  } = usePreferencias();

  return (
    <div className="xp-dock">
      <div className="xp-group" role="group" aria-label="Nível das explicações">
        <span className="xp-label">EXPLICAÇÕES</span>
        {NIVEIS.map((opcao) => (
          <button
            key={opcao.id}
            type="button"
            className="xp-opt"
            role="radio"
            aria-checked={nivel === opcao.id}
            onClick={() => definirNivel(opcao.id)}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      <div
        className="xp-group"
        title="Suaviza cores de perda para reduzir ansiedade — os textos e níveis de risco continuam visíveis."
      >
        <span className="xp-label" id="rotulo-modo-calmo">
          MODO CALMO
        </span>
        {/* WCAG 2.5.3 (Label in Name): o nome acessível precisa CONTER o texto
            visível. Apontar o aria-labelledby só para o rótulo faria o leitor
            de tela anunciar "MODO CALMO" enquanto a tela mostra "Desativado" —
            quem usa comando de voz não conseguiria acionar o botão. Referenciar
            os dois elementos produz "MODO CALMO Desativado". */}
        <button
          type="button"
          id="botao-modo-calmo"
          className="xp-opt is-calmo"
          role="switch"
          aria-checked={calmo}
          aria-labelledby="rotulo-modo-calmo botao-modo-calmo"
          onClick={alternarCalmo}
        >
          {calmo ? 'Ativado' : 'Desativado'}
        </button>
      </div>

      <div className="xp-group" role="group" aria-label="Tamanho do texto">
        <span className="xp-label">TEXTO</span>
        <button
          type="button"
          className="xp-zoom-btn"
          onClick={diminuirZoom}
          disabled={zoomNoMinimo}
          aria-label="Diminuir o tamanho do texto"
        >
          A−
        </button>
        <span className="xp-zoom-val" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          className="xp-zoom-btn"
          onClick={aumentarZoom}
          disabled={zoomNoMaximo}
          aria-label="Aumentar o tamanho do texto"
          style={{ fontSize: '0.9375rem' }}
        >
          A+
        </button>
      </div>
    </div>
  );
}
