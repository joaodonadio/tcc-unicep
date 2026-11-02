/**
 * Leitura do experimento para a tela: as 5 vagas do top e o resumo de acertos.
 * Recebe o resultado de normalizarTop / normalizarHistorico (services/experimento.js).
 * Ausência vira null ou estado 'sem_dados', nunca 0.
 */

const ACASO_PADRAO = 0.5;

/** Taxa de acerto do histórico: sem dias, estado 'sem_dados'; senão os números do resumo. */
export function resumoAcerto(hist) {
  const dias = Array.isArray(hist?.dias) ? hist.dias : [];
  if (dias.length === 0) return { estado: 'sem_dados' };

  const resumo = hist.resumo ?? {};
  const taxa = Number.isFinite(resumo.taxaAcerto) ? resumo.taxaAcerto : null;
  const acaso = Number.isFinite(resumo.acasoMedia) ? resumo.acasoMedia : ACASO_PADRAO;
  return {
    estado: 'dados',
    taxa,
    acaso,
    faixa: resumo.acasoFaixa ?? null,
    nDias: resumo.nDias ?? dias.length,
    acimaDoAcaso: taxa == null ? null : taxa > acaso,
  };
}
