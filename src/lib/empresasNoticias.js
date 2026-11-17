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

/**
 * Junta tickers da mesma empresa com os mesmos números num só cartão ("PETR3 · PETR4").
 * Sem nome conhecido, o ticker fica sozinho: não se juntam empresas diferentes por acaso.
 * @param {object[]} [empresas] saída de empresasComManchetes
 * @param {Map<string, string>} [nomePorTicker] ticker -> nome da empresa
 * @returns {{tickers: string[], nome: string|null, quantidade: number|null, positivas: number|null, neutras: number|null, negativas: number|null}[]}
 */
export function agruparEmpresasPorNumeros(empresas, nomePorTicker = new Map()) {
  const grupos = new Map();
  for (const e of empresas ?? []) {
    const nome = nomePorTicker.get(e.ticker) ?? null;
    const chave = nome
      ? JSON.stringify([nome, e.quantidade, e.positivas, e.neutras, e.negativas])
      : `ticker:${e.ticker}`;
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        tickers: [],
        nome,
        quantidade: e.quantidade,
        positivas: e.positivas,
        neutras: e.neutras,
        negativas: e.negativas,
      });
    }
    grupos.get(chave).tickers.push(e.ticker);
  }
  return [...grupos.values()];
}
