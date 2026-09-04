/**
 * Validação dos payloads na fronteira do front (ARQUITETURA-INTERFACE.md §3).
 *
 * Regra da arquitetura: "registro inválido → estado de erro do card, nunca
 * tela quebrada". Por isso a validação é *por registro*: uma recomendação
 * malformada é descartada da lista (e contabilizada em `descartados`) sem
 * derrubar o agregado inteiro. Só falta de campo estrutural derruba a query.
 */

class PayloadInvalidoError extends Error {
  constructor(mensagem, detalhes) {
    super(mensagem);
    this.name = 'PayloadInvalidoError';
    this.detalhes = detalhes;
  }
}

const eString = (v) => typeof v === 'string' && v.length > 0;
const eNumero = (v) => typeof v === 'number' && Number.isFinite(v);
const eLista = (v) => Array.isArray(v);

function recomendacaoValida(r) {
  return (
    r &&
    eString(r.id) &&
    eString(r.ticker) &&
    eString(r.nome) &&
    ['oportunidade', 'risco'].includes(r.tipo) &&
    eNumero(r.confianca) &&
    r.confianca >= 0 &&
    r.confianca <= 100 &&
    ['Baixo', 'Moderado', 'Alto'].includes(r.risco) &&
    eLista(r.evidencias) &&
    r.evidencias.length > 0 &&
    eLista(r.serie_30d) &&
    r.serie_30d.length >= 2 &&
    r.serie_30d.every(eNumero)
  );
}

const filtraLista = (lista, valido) => (eLista(lista) ? lista.filter(valido) : []);

/** Valida e normaliza `GET /api/analise-do-dia`. */
export function validarAnaliseDoDia(dados) {
  if (!dados || typeof dados !== 'object') {
    throw new PayloadInvalidoError('Resposta da análise do dia não é um objeto JSON.');
  }
  if (!eString(dados.gerado_em)) {
    throw new PayloadInvalidoError('Campo obrigatório ausente: gerado_em.');
  }
  if (!eLista(dados.recomendacoes)) {
    throw new PayloadInvalidoError('Campo obrigatório ausente: recomendacoes[].');
  }

  const recomendacoes = dados.recomendacoes.filter(recomendacaoValida);
  const descartados = dados.recomendacoes.length - recomendacoes.length;

  return {
    ...dados,
    recomendacoes,
    descartados,
    estatisticas: dados.estatisticas ?? { oportunidades: 0, riscos: 0, ativos_analisados: 0 },
    ativos: filtraLista(dados.ativos, (a) => eString(a?.ticker)),
    alertas: filtraLista(dados.alertas, (a) => eString(a?.texto)),
    agenda: filtraLista(dados.agenda, (a) => eString(a?.titulo)),
    indicadores: filtraLista(dados.indicadores, (i) => eString(i?.label) && eString(i?.valor)),
    setores: filtraLista(dados.setores, (s) => eString(s?.setor) && eNumero(s?.variacao)),
    leituras: filtraLista(dados.leituras, (l) => eString(l?.titulo)),
    mapa_noticias: filtraLista(dados.mapa_noticias, (p) => eNumero(p?.lat) && eNumero(p?.lon)),
  };
}

/** Valida `GET /api/historico/{ticker}`. */
export function validarHistorico(dados) {
  if (!dados || !eLista(dados.serie) || !dados.serie.every(eNumero) || dados.serie.length < 2) {
    throw new PayloadInvalidoError('Histórico sem série numérica utilizável.');
  }
  return dados;
}

export { PayloadInvalidoError };
