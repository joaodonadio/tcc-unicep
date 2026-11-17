/**
 * Análise do dia: agrega os pacotes de dados no formato que as telas leem.
 *
 * Só entram valores com status 'ok'. Valor ausente vira null (ou o texto do
 * status), nunca 0. Os textos descrevem o que os dados mostram e não são
 * indicação de decisão; o aviso legal fica em AVISO_FIXO (textos.js).
 *
 * Campos lidos pelas telas: painel_alertas, acoes_pregao, tom_por_setor,
 * manchetes_por_tom e sugestoes.
 */

import { exibir, ok, valorOuNulo, textoStatus } from './valor.js';
import { contar, numero, pct, tons, vezes } from './formato.js';
import { dataBR, diaMes, mesAno, quandoPublicada } from './datas.js';
import { contarManchetesUnicas, montarResumoDoPregao } from './resumoDia.js';
import { variacaoDiaConfiavel } from './crivel.js';
import { gerarSugestoes, resumirCartao } from './sugestoes.js';
import { TEXTO_EXECUCAO, TEXTOS } from './textos.js';

const MAX_MANCHETES_POR_TOM = 12;
const VARIACAO_IBOV_VOLATIL = 0.015;
const REGRA_VOLUME_INCOMUM = 'volume_incomum';
const VARIACAO_DO_DIA = 'Variação do dia';
const REGRA_VOLUME_TEXTO =
  'Volume fora do normal: a ação negociou 1,5 vez a mediana dos últimos 20 pregões, ou mais.';
const PROB_DO_TOM = { positivo: 'prob_positivo', neutro: 'prob_neutro', negativo: 'prob_negativo' };

/** Nome curto em frase para cada setor da B3; setor fora da lista ganha capitalização simples. */
const NOMES_SETOR = {
  'Consumo não Cíclico': 'Consumo não cíclico',
  Financeiro: 'Financeiro',
  'Consumo Cíclico': 'Consumo cíclico',
  'Utilidade Pública': 'Utilidade pública',
  'Bens Industriais': 'Bens industriais',
  'Materiais Básicos': 'Materiais básicos',
  'Petróleo, Gás e Biocombustíveis': 'Petróleo e gás',
  Saúde: 'Saúde',
  'Tecnologia da Informação': 'Tecnologia',
  Comunicações: 'Comunicações',
};

/** Variação que arredonda para zero na exibição (menos de 0,05%) conta como estável. */
const estavel = (x) => Math.round(Math.abs(x) * 1000) === 0;

const sinalDe = (x) => {
  if (x > 0) return 'up';
  if (x < 0) return 'down';
  return 'flat';
};

export const nomeSetor = (setor) =>
  setor ? (NOMES_SETOR[setor] ?? setor.charAt(0).toUpperCase() + setor.slice(1).toLowerCase()) : null;

/** Soma um campo ok do resumo de notícias de cada ticker; null se nenhum tiver valor. */
function somarResumoNoticias(noticias, campo) {
  let total = null;
  for (const n of noticias) {
    const v = valorOuNulo(n.resumo?.[campo]);
    if (v != null) total = (total ?? 0) + v;
  }
  return total;
}

function rotuloSentimento(saldo) {
  if (saldo >= 0.15) return 'otimista';
  if (saldo >= 0.05) return 'otimista_moderado';
  if (saldo > -0.05) return 'neutro';
  if (saldo > -0.15) return 'pessimista_moderado';
  return 'pessimista';
}

/** Tom geral das notícias: saldo (positivas − negativas) ÷ total. Sem notícias, sem rótulo. */
function montarSentimento(noticias) {
  // títulos únicos; sem manchetes, a soma dos resumos por ticker
  const tom_noticias = contarManchetesUnicas(noticias) ?? {
    total: somarResumoNoticias(noticias, 'quantidade'),
    positivas: somarResumoNoticias(noticias, 'positivas'),
    neutras: somarResumoNoticias(noticias, 'neutras'),
    negativas: somarResumoNoticias(noticias, 'negativas'),
  };
  const { total, positivas, negativas } = tom_noticias;
  if (!total || positivas == null || negativas == null) {
    return { sentimento_geral: null, tom_noticias };
  }
  return { sentimento_geral: rotuloSentimento((positivas - negativas) / total), tom_noticias };
}

function estadoDoMercado(mercado) {
  const variacao = valorOuNulo(mercado?.IBOV?.variacao_dia);
  return variacao != null && Math.abs(variacao) >= VARIACAO_IBOV_VOLATIL ? 'volatil' : 'estavel';
}

/** Linha do grid de mercado: valor formatado (ou o texto do status) e variação com sinal. */
function indicador({ label, nivel, formatar = (v) => v, variacao, deltaFixo }) {
  const valor = ok(nivel) ? formatar(nivel.valor) : textoStatus(nivel);
  if (deltaFixo) return { label, valor, delta: deltaFixo, sinal: 'flat' };
  const v = valorOuNulo(variacao);
  if (v == null) return { label, valor, delta: '—', sinal: 'flat' };
  if (estavel(v)) return { label, valor, delta: 'estável', sinal: 'flat' };
  return { label, valor, delta: pct(v), sinal: sinalDe(v) };
}

const ROTULOS_PERIODO = [
  { rotulo: '1 mês', chave: 'm1' },
  { rotulo: '6 meses', chave: 'm6' },
  { rotulo: '1 ano', chave: 'a1' },
];

/** Janelas de 1 mês, 6 meses e 1 ano de um índice; ausente vira "—", nunca 0. */
function periodosDo(serie) {
  return ROTULOS_PERIODO.map(({ rotulo, chave }) => {
    const campo = serie?.[chave];
    const v = valorOuNulo(campo);
    return {
      rotulo,
      valor_texto: exibir(campo, (x) => pct(x)).texto,
      sinal: v == null || estavel(v) ? 'flat' : sinalDe(v),
    };
  });
}

function montarIndicadores(mercado) {
  const indices = mercado?.indices ?? {};
  const ipcaAte = mesAno(valorOuNulo(mercado?.ipca_ate));
  const somenteVariacao = (label, nome) => ({
    ...indicador({
      label,
      nivel: indices[nome]?.d1,
      formatar: (v) => pct(v),
      deltaFixo: VARIACAO_DO_DIA.toLowerCase(),
    }),
    periodos: periodosDo(indices[nome]),
  });

  return [
    indicador({
      label: 'Ibovespa (pontos)',
      nivel: mercado?.IBOV?.fechamento,
      formatar: (v) => numero(v, { casas: 0 }),
      variacao: mercado?.IBOV?.variacao_dia,
    }),
    {
      ...indicador({
        label: 'Dólar (R$)',
        nivel: mercado?.USDBRL?.fechamento,
        formatar: (v) => numero(v),
        variacao: mercado?.USDBRL?.variacao_dia,
      }),
      // períodos só quando o pacote traz o índice; sem ele, a tela calcula
      ...(indices.USDBRL ? { periodos: periodosDo(indices.USDBRL) } : {}),
    },
    {
      ...indicador({
        label: 'Petróleo Brent (US$)',
        nivel: mercado?.BRENT?.fechamento,
        formatar: (v) => numero(v),
        variacao: mercado?.BRENT?.variacao_dia,
      }),
      ...(indices.BRENT ? { periodos: periodosDo(indices.BRENT) } : {}),
    },
    {
      ...indicador({
        label: 'CDI 12M',
        nivel: indices.CDI?.a1,
        formatar: (v) => pct(v, { casas: 2, sinal: false }),
        deltaFixo: TEXTOS.mercado.cdi12m,
      }),
      periodos: periodosDo(indices.CDI),
    },
    {
      ...indicador({
        label: 'IPCA 12M',
        nivel: mercado?.ipca_12m,
        formatar: (v) => {
          const texto = pct(v, { casas: 2, sinal: false });
          return ipcaAte ? `${texto} até ${ipcaAte}` : texto;
        },
        deltaFixo: 'inflação acumulada em 12 meses',
      }),
      periodos: periodosDo(indices.IPCA),
    },
    somenteVariacao('IDIV', 'IDIV'),
    somenteVariacao('SMLL', 'SMLL'),
    somenteVariacao('IFIX', 'IFIX'),
    somenteVariacao('IVVB11', 'IVVB11'),
  ];
}

/** Faixa de oscilação pela posição da volatilidade de 20 pregões entre as ações (fração). */
function faixaOscilacao(posicao) {
  if (posicao == null) return null;
  if (posicao < 0.34) return 'Baixa';
  if (posicao < 0.67) return 'Moderada';
  return 'Alta';
}

function tipoDoCartao({ forte, atencao }) {
  if (forte > 0 && forte >= atencao) return 'forte';
  if (atencao > 0) return 'atencao';
  return 'contexto';
}

/** Cartões por ação, na ordem de gerarSugestoes (mais sinais primeiro). */
function montarCartoes({ resumos, noticias, acoes }) {
  const resumoDe = new Map(resumos.map((r) => [r.ticker, r]));
  const noticiaDe = new Map(noticias.map((n) => [n.ticker, n]));
  return gerarSugestoes({ resumos, noticias, acoes }).map((c) => {
    const R = resumoDe.get(c.ticker) ?? {};
    return {
      id: c.ticker.toLowerCase(),
      ticker: c.ticker,
      nome: c.empresa,
      setor: c.setor?.toUpperCase() ?? null,
      setor_nome: nomeSetor(c.setor),
      tipo: tipoDoCartao(c.contagem),
      titulo: resumirCartao(c),
      resumo: c.sinais[0]?.simples ?? null,
      sinais: c.sinais,
      contagem: c.contagem,
      oscilacao: faixaOscilacao(valorOuNulo(R.volatilidade_20d?.posicao_pct)),
      oscilacao_texto: R.volatilidade_20d?.texto ?? null,
      variacao_dia: valorOuNulo(R.cotacao?.variacao_dia),
      rentabilidade: R.rentabilidade ?? null,
      resumo_acao: R,
      noticias_resumo: noticiaDe.get(c.ticker)?.resumo ?? null,
      ativo_no_universo: c.ativoNoUniverso,
    };
  });
}

function montarPainelAlertas({ execucao, resumos, cartoes, acoes }) {
  const dataRef = resumos[0]?.data_referencia ?? null;
  const dia = diaMes(dataRef);
  const empresaDe = new Map(acoes.map((a) => [a.ticker, a.empresa]));

  const execucaoLista = [];
  const status = execucao?.status;
  if (status === 'parcial' || status === 'falhou') {
    execucaoLista.push({
      texto: TEXTO_EXECUCAO[status].replace('{data}', dataBR(dataRef)),
      motivo: 'A atualização diária não terminou por completo.',
    });
  }

  const variacoes = resumos
    .map((r) => ({ ticker: r.ticker, v: variacaoDiaConfiavel(valorOuNulo(r.cotacao?.variacao_dia)) }))
    .filter((x) => x.v != null);
  const destaque = (x, motivo) => ({
    ticker: x.ticker,
    empresa: empresaDe.get(x.ticker) ?? null,
    variacao: x.v,
    variacao_texto: pct(x.v),
    motivo,
  });
  let alta = null;
  let queda = null;
  if (variacoes.length) {
    const maior = variacoes.reduce((a, b) => (b.v > a.v ? b : a));
    const menor = variacoes.reduce((a, b) => (b.v < a.v ? b : a));
    if (maior.v > 0) alta = destaque(maior, `Maior alta entre as ${variacoes.length} ações acompanhadas.`);
    if (menor.v < 0) queda = destaque(menor, `Maior queda entre as ${variacoes.length} ações acompanhadas.`);
  }

  const itensVolume = cartoes
    .filter((c) => c.sinais.some((s) => s.id === REGRA_VOLUME_INCOMUM))
    .map((c) => ({ ticker: c.ticker, empresa: c.nome ?? null, vezes: valorOuNulo(c.resumo_acao.volume?.relativo) }))
    .filter((x) => x.vezes != null)
    .sort((a, b) => b.vezes - a.vezes)
    .map((x) => ({ ...x, vezes_texto: vezes(x.vezes) }));

  return {
    data_pregao: dia || null,
    titulo: dia ? `Alertas do pregão de ${dia}` : 'Alertas do pregão',
    execucao: execucaoLista,
    alta,
    queda,
    volume: itensVolume.length ? { regra: REGRA_VOLUME_TEXTO, itens: itensVolume } : null,
  };
}

/** Uma entrada por ação do pregão (com ou sem sinal), no formato que o mapa do pregão lê. */
function montarAcoesDoPregao(resumos, acoes, cartoes) {
  const acaoDe = new Map(acoes.map((a) => [a.ticker, a]));
  const cartaoDe = new Map(cartoes.map((c) => [c.ticker, c]));
  return resumos.map((r) => {
    const c = cartaoDe.get(r.ticker);
    const a = acaoDe.get(r.ticker);
    return {
      id: r.ticker.toLowerCase(),
      ticker: r.ticker,
      nome: a?.empresa ?? null,
      setor_nome: nomeSetor(a?.setor),
      variacao_dia: valorOuNulo(r.cotacao?.variacao_dia),
      fechamento: valorOuNulo(r.cotacao?.fechamento),
      tipo: c?.tipo ?? null,
      tem_sinal: Boolean(c),
      contagem: c?.contagem ?? { forte: 0, atencao: 0, contexto: 0, total: 0 },
      ativo_no_universo: a?.ativo_no_universo ?? null,
    };
  });
}

/** Soma das contagens de tom (FinBERT) das ações de cada setor; setor sem contagem fica de fora. */
function montarTomPorSetor(noticias, acoes) {
  const setorDe = new Map(acoes.map((a) => [a.ticker, a.setor]));
  const grupos = new Map();
  for (const n of noticias) {
    const setor = setorDe.get(n.ticker);
    const pos = valorOuNulo(n.resumo?.positivas);
    const neu = valorOuNulo(n.resumo?.neutras);
    const neg = valorOuNulo(n.resumo?.negativas);
    if (!setor || pos == null || neu == null || neg == null) continue;
    const g = grupos.get(setor) ?? { positivas: 0, neutras: 0, negativas: 0 };
    g.positivas += pos;
    g.neutras += neu;
    g.negativas += neg;
    grupos.set(setor, g);
  }
  return [...grupos]
    .map(([setor, g]) => {
      const total = g.positivas + g.neutras + g.negativas;
      return { setor: nomeSetor(setor), ...g, total, saldo: total ? (g.positivas - g.negativas) / total : null };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.saldo - a.saldo || a.setor.localeCompare(b.setor, 'pt-BR'));
}

const temProbabilidades = (item) => [item.prob_positivo, item.prob_neutro, item.prob_negativo].every(Number.isFinite);

const forcaDaManchete = (item) => Math.abs(item.prob_positivo - item.prob_negativo);

/** Texto "subiu 1,3%" / "caiu 1,3%" / "ficou estável" para a leitura de uma manchete. */
function movimentoDoDia(v) {
  if (v == null) return 'sem variação informada';
  if (estavel(v)) return 'ficou estável';
  return v > 0 ? `subiu ${pct(v, { sinal: false })}` : `caiu ${pct(Math.abs(v), { sinal: false })}`;
}

/** Uma leitura do sistema: manchete em destaque do ticker, com o contexto do pregão dele. */
function leituraDe({ item, ticker }, resumoDe, noticiaDe) {
  const probMax = Math.max(item.prob_positivo, item.prob_neutro, item.prob_negativo);
  const v = variacaoDiaConfiavel(valorOuNulo(resumoDe.get(ticker)?.cotacao?.variacao_dia));
  const N = noticiaDe.get(ticker)?.resumo;
  const q = valorOuNulo(N?.quantidade);
  const pos = valorOuNulo(N?.positivas);
  const neu = valorOuNulo(N?.neutras);
  const neg = valorOuNulo(N?.negativas);
  const contagem =
    q == null
      ? ''
      : ` e teve ${contar(q, 'notícia', 'notícias')}` +
        (pos != null && neu != null && neg != null
          ? `: ${tons(pos, neu, neg)}`
          : '');
  return {
    tag: ticker,
    tom: item.rotulo,
    titulo: item.titulo,
    fonte: [item.fonte, quandoPublicada(item)].filter(Boolean).join(' · '),
    link: item.link,
    leitura_do_sistema: `O FinBERT classificou esta manchete como ${item.rotulo} (${pct(probMax, { casas: 0, sinal: false })} de probabilidade). No pregão, ${ticker} ${movimentoDoDia(v)}${contagem}.`,
  };
}

/** Manchetes em destaque (destaque = 1 por ticker), da mais forte para a mais fraca. */
function montarLeituras(noticias, resumoDe, noticiaDe) {
  const destaques = noticias
    .flatMap((n) => (n.itens ?? []).filter((item) => item.destaque === 1 && temProbabilidades(item)).map((item) => ({ item, ticker: n.ticker })))
    .sort((a, b) => forcaDaManchete(b.item) - forcaDaManchete(a.item))
    // a mesma manchete aparece em cada classe de ação da empresa (ex.: BBDC3 e BBDC4)
    .filter((x, i, lista) => lista.findIndex((y) => y.item.titulo === x.item.titulo) === i);
  const leitura = (x) => leituraDe(x, resumoDe, noticiaDe);
  const manchetes_por_tom = Object.fromEntries(
    Object.entries(PROB_DO_TOM).map(([tom, prob]) => [
      tom,
      destaques
        .filter((x) => x.item.rotulo === tom)
        .sort((a, b) => b.item[prob] - a.item[prob])
        .slice(0, MAX_MANCHETES_POR_TOM)
        .map(leitura),
    ]),
  );
  return { manchetes_por_tom };
}

/**
 * Monta o agregado da análise do dia a partir dos pacotes já lidos.
 *
 * @param {object} args
 * @param {object[]} args.acoes registros de acoes
 * @param {object[]} args.resumos registros de resumo_acao
 * @param {object[]} args.noticias registros de noticias_dia
 * @param {object|null} args.mercado registro de mercado_dia
 * @param {object|null} args.execucao registro de execucao/ultima
 */
export function montarAnaliseDoDia({
  acoes = [],
  resumos = [],
  noticias = [],
  mercado = null,
  execucao = null,
} = {}) {
  const cartoes = montarCartoes({ resumos, noticias, acoes });
  const resumoDe = new Map(resumos.map((r) => [r.ticker, r]));
  const noticiaDe = new Map(noticias.map((n) => [n.ticker, n]));
  const sentimento = montarSentimento(noticias);
  const { manchetes_por_tom } = montarLeituras(noticias, resumoDe, noticiaDe);

  const resumoPregao = montarResumoDoPregao({ mercado: mercado ?? {}, resumos, noticias, acoes });

  return {
    gerado_em: execucao?.fim ?? resumos[0]?.gerado_em ?? null,
    data_referencia: resumos[0]?.data_referencia ?? null,
    status_execucao: execucao?.status ?? null,
    resumo_simples: resumoPregao.texto,
    fatos_pregao: resumoPregao.fatos,
    ...sentimento,
    estado_mercado: estadoDoMercado(mercado),
    estatisticas: {
      fortes: cartoes.filter((c) => c.tipo === 'forte').length,
      atencao: cartoes.filter((c) => c.tipo === 'atencao').length,
      ativos_analisados: resumos.length,
      sugestoes: cartoes.length,
    },
    sugestoes: cartoes,
    indicadores: montarIndicadores(mercado),
    manchetes_por_tom,
    painel_alertas: montarPainelAlertas({ execucao, resumos, cartoes, acoes }),
    acoes_pregao: montarAcoesDoPregao(resumos, acoes, cartoes),
    tom_por_setor: montarTomPorSetor(noticias, acoes),
    experimento: null,
  };
}
