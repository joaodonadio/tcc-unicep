import { TEXTOS } from '../../lib/textos.js';

/**
 * Botão que abre o painel de detalhes do cartão; a seta gira quando abre.
 * Sem `texto`: botão redondo só com a seta, e `nome` (texto puro) vira "Mais sobre: {nome}".
 * Com `texto`: pílula com o texto visível antes da seta; o texto é o nome do botão.
 */
export function BotaoDetalhes({ nome, aberto, controla, onClick, texto }) {
  return (
    <button
      type="button"
      className={texto ? 'detalhes-botao detalhes-botao--texto' : 'detalhes-botao'}
      aria-expanded={aberto}
      aria-controls={controla}
      aria-label={texto ? undefined : TEXTOS.hoje.detalhes(nome)}
      onClick={onClick}
    >
      {texto && <span>{texto}</span>}
      <svg className="detalhes-botao-icone" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/**
 * Painel recolhível (CSS em componentes.css): a altura anima de 0 até a do conteúdo.
 * Fechado, segue no DOM com `inert`: sai da ordem de foco e da leitura de tela.
 */
export function PainelDetalhes({ id, aberto, children }) {
  // React 18 não conhece `inert`: vai como atributo de texto ("" liga, undefined tira)
  return (
    <div id={id} className="detalhes-painel" data-aberto={aberto ? 'true' : undefined} inert={aberto ? undefined : ''}>
      <div className="detalhes-miolo">
        <div className="detalhes-corpo">{children}</div>
      </div>
    </div>
  );
}
