/**
 * Leitura do experimento para a tela: as 5 vagas do top e o resumo de acertos.
 * Recebe o resultado de normalizarTop / normalizarHistorico (services/experimento.js).
 * Ausência vira null ou estado 'sem_dados', nunca 0.
 */

/** Taxa contra a faixa do acaso [mínimo, máximo]: 'acima', 'abaixo' ou 'dentro'; sem taxa ou faixa, null. */
function compararComFaixa(taxa, faixa) {
  if (taxa == null || !Array.isArray(faixa) || faixa.length < 2) return null;
  const [min, max] = faixa;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (taxa > max) return 'acima';
  if (taxa < min) return 'abaixo';
  return 'dentro';
}

/** Taxa de acerto do histórico: sem pregões ou sem dias, estado 'sem_dados'; senão os números do resumo. */
export function resumoAcerto(hist) {
  const dias = Array.isArray(hist?.dias) ? hist.dias : [];
  const resumo = hist?.resumo ?? {};
  const semDias = resumo.nDias == null && dias.length === 0;
  if (resumo.nDias === 0 || semDias) return { estado: 'sem_dados' };

  const taxa = Number.isFinite(resumo.taxaAcerto) ? resumo.taxaAcerto : null;
  const acaso = Number.isFinite(resumo.acasoMedia) ? resumo.acasoMedia : null;
  return {
    estado: 'dados',
    taxa,
    acaso,
    faixa: resumo.acasoFaixa ?? null,
    nDias: resumo.nDias ?? dias.length,
    comparacao: compararComFaixa(taxa, resumo.acasoFaixa),
  };
}
