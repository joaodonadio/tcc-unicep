/**
 * Animação dos gráficos ECharts num lugar só: entrada e troca de dados discretas, sem quique.
 * `animar` vem de movimentoReduzido() (false com movimento reduzido, e aí nada anima).
 */

export const DURACAO_GRAFICO = 300;
export const CURVA_GRAFICO = 'cubicOut';
/** Troca de série visível: a linha nova se desenha e as que ficam deslizam para a nova escala. */
export const DURACAO_LINHA_NOVA = 900;
export const DURACAO_REESCALA = 600;

/** Opções de animação de um gráfico. `duracao` vale para a entrada e `duracaoTroca`, para a troca de dados. */
export function animacaoGrafico(animar, duracao = DURACAO_GRAFICO, duracaoTroca = DURACAO_GRAFICO) {
  return {
    animation: animar,
    animationDuration: duracao,
    animationDurationUpdate: duracaoTroca,
    animationEasing: CURVA_GRAFICO,
    animationEasingUpdate: CURVA_GRAFICO,
  };
}

/** Balão do tooltip: 150ms de transição com animação; zero sem movimento. */
export function transicaoBalao(animar) {
  return { transitionDuration: animar ? 0.15 : 0 };
}
