/** Quantas empresas aparecem na lista "Como as notícias falam de cada empresa". */
export const MAX_EMPRESAS_NOTICIAS = 8;

/** Valor numérico de um campo do resumo de noticias_dia; ausência continua null, nunca 0. */
const valorDe = (campo) => (typeof campo?.valor === 'number' && Number.isFinite(campo.valor) ? campo.valor : null);

/** Abaixo disto, o tom do dia vale pouco e a tela avisa. */
export const LIMITE_POUCAS_MANCHETES = 20;

/** Quantas empresas têm ao menos uma manchete classificada no dia. */
export function contarEmpresasComManchetes(registros) {
  return (registros ?? []).filter((r) => r.ticker && valorDe(r.resumo?.quantidade) > 0).length;
}

/**
 * Até 8 empresas com mais manchetes no pregão, a partir dos registros de noticias_dia.
 * @param {object[]} [registros]
 */
export function empresasComManchetes(registros) {
  return (registros ?? [])
    .map((r) => ({
      ticker: r.ticker,
      quantidade: valorDe(r.resumo?.quantidade),
      positivas: valorDe(r.resumo?.positivas),
      neutras: valorDe(r.resumo?.neutras),
      negativas: valorDe(r.resumo?.negativas),
    }))
    .filter((e) => e.ticker && e.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade || a.ticker.localeCompare(b.ticker))
    .slice(0, MAX_EMPRESAS_NOTICIAS);
}
