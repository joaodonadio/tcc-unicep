/**
 * Funções puras da seção "O mercado" (sem React).
 *
 * Valor ausente continua null ou texto de ausência; nunca vira 0.
 */

import { alinharPorData, cortarJanela, JANELAS } from './series.js';
import { trechosSemValor } from './historicoAcao.js';
import { dataBR, diaMes, mesAno } from './datas.js';
import { numero, pct } from './formato.js';
import { TEXTOS } from './textos.js';
import { valorOuNulo } from './valor.js';

const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/** Campo de série usado para a rentabilidade (retorno total, com dividendos). */
export const CAMPO_RETORNO = 'indice_retorno_total';

/** Períodos do gráfico, na ordem em que aparecem no segmentado. */
export const PERIODOS = [
  { chave: '1s', pontos: JANELAS['1s'] },
  { chave: '1m', pontos: JANELAS['1m'] },
  { chave: '6m', pontos: JANELAS['6m'] },
  { chave: '1a', pontos: JANELAS['1a'] },
];

/** Formato da data no rodapé do gráfico: dia e mês na semana e no mês; mês e ano em 6 meses e 1 ano. */
const FORMATO_DATA_DA_JANELA = { '1s': dataBR, '1m': diaMes, '6m': mesAno, '1a': mesAno };

/** Função que escreve a data de uma janela (chave de PERIODOS); janela desconhecida usa a data completa. */
export const formatoDataDaJanela = (chave) => FORMATO_DATA_DA_JANELA[chave] ?? dataBR;

/** Índices que podem ser comparados com o Ibovespa e o CDI (o nenhum fica fora da lista). */
export const COMPARACOES = ['IPCA', 'IDIV', 'SMLL', 'IFIX', 'IVVB11'];

/**
 * Rentabilidade acumulada nos últimos n pregões, em fração (0,05 = 5%).
 * A base é o primeiro valor finito e não nulo da janela; antes dela e nas faltas
 * o valor é null. Retorna {datas, valores} ou null quando a janela é inválida,
 * a série é mais curta que a janela ou há menos de 2 pontos.
 */
export function acumuladoNaJanela(serie, n) {
  if (!Number.isInteger(n) || n < 2) return null;
  if ((serie?.datas?.length ?? 0) < n) return null;
  const { datas, valores } = cortarJanela(serie, n);
  const arr = valores[CAMPO_RETORNO] ?? [];
  const base = arr.find((v) => finito(v) && v !== 0);
  if (base === undefined) return null;
  if (arr.filter(finito).length < 2) return null;
  return { datas, valores: arr.map((v) => (finito(v) ? v / base - 1 : null)) };
}

/** Último valor finito de um acumulado, ou null se não houver nenhum. */
export function ultimoValor(acumulado) {
  const valores = acumulado?.valores ?? [];
  for (let i = valores.length - 1; i >= 0; i -= 1) {
    if (finito(valores[i])) return valores[i];
  }
  return null;
}

/**
 * Quanto viraram R$ 100 com a rentabilidade acumulada (fração: -0,097 vira "90,30").
 * Sem valor finito, null: o cartão mostra "sem dado" e nenhuma frase.
 */
export function cemViraram(fracao) {
  if (!finito(fracao)) return null;
  return numero(100 * (1 + fracao), { casas: 2 });
}

const mesmasDatas = (a, b) => a.length === b.length && a.every((d, i) => d === b[i]);

/**
 * Alinha várias séries às datas da primeira (o Ibovespa). Mesma data vira o mesmo
 * ponto; data ausente vira null. Retorna um array de arrays de valores, na ordem
 * de `lista`. Lista vazia: [].
 */
export function alinharSeries(lista = []) {
  const base = lista[0];
  if (!base) return [];
  const nulos = base.datas.map(() => null);
  return lista.map((s) => {
    if (!s?.datas) return nulos;
    if (mesmasDatas(base.datas, s.datas)) return s.valores ?? nulos;
    return alinharPorData(base.datas, s.datas, s.valores ?? []);
  });
}

/** Sinal de um texto já formatado: '+' sobe, '−' ou '-' cai, o resto é neutro. */
export function sinalDoTexto(texto) {
  if (typeof texto !== 'string') return 'flat';
  if (texto.startsWith('+')) return 'up';
  if (texto.startsWith('−') || texto.startsWith('-')) return 'down';
  return 'flat';
}

/**
 * Célula "Hoje" de um indicador: a variação do dia quando ela existe (ou é
 * ausência explícita); senão o valor do próprio indicador (os índices que só
 * trazem variação já têm o valor em % no campo valor).
 */
export function celulaHoje(indicador) {
  const delta = indicador?.delta ?? '';
  const ehVariacao = delta === 'estável' || delta === '—' || delta.includes('%');
  if (ehVariacao) return { texto: delta, sinal: indicador.sinal ?? 'flat', nivel: indicador.valor ?? null };
  return { texto: indicador?.valor ?? '—', sinal: sinalDoTexto(indicador?.valor), nivel: null };
}

/** Rótulo do tom das notícias pelo saldo (-1 a 1): 'positivas', 'negativas', 'equilibrado' ou null. */
export function tomDoSaldo(saldo) {
  if (!finito(saldo)) return null;
  if (saldo > 0.1) return 'positivas';
  if (saldo < -0.1) return 'negativas';
  return 'equilibrado';
}

/** Rótulo do Ibovespa na tabela de índices (o que data.indicadores traz para ele). */
export const ROTULO_IBOVESPA = 'Ibovespa (pontos)';

/** Rentabilidade do Ibovespa ({m1, m6, a1}) do primeiro resumo que tenha algum valor; null se nenhum tem. */
export function rentabilidadeIbovDos(resumos = []) {
  for (const r of resumos ?? []) {
    const ibov = r?.rentabilidade?.ibov;
    const m1 = valorOuNulo(ibov?.m1);
    const m6 = valorOuNulo(ibov?.m6);
    const a1 = valorOuNulo(ibov?.a1);
    if (m1 != null || m6 != null || a1 != null) return { m1, m6, a1 };
  }
  return null;
}

/**
 * Preenche os períodos (1 mês, 6 meses, 1 ano) da linha do Ibovespa com a
 * rentabilidade já calculada. Sem dado, o período fica sem texto (vira "—").
 */
export function comPeriodosIbovespa(indicadores = [], rentabilidade) {
  if (!rentabilidade) return indicadores;
  const periodos = [
    { rotulo: TEXTOS.mercado.periodos['1m'], valor: rentabilidade.m1 },
    { rotulo: TEXTOS.mercado.periodos['6m'], valor: rentabilidade.m6 },
    { rotulo: TEXTOS.mercado.periodos['1a'], valor: rentabilidade.a1 },
  ].map(({ rotulo, valor }) => {
    const texto = pct(valor);
    return { rotulo, valor_texto: texto || null, sinal: sinalDoTexto(texto) };
  });
  return indicadores.map((ind) => (ind.label === ROTULO_IBOVESPA ? { ...ind, periodos } : ind));
}

/** Último ponto de uma série {datas, valores}: {data, valor} ou null se não há valor finito. */
export function ultimoPonto(serie) {
  const datas = serie?.datas ?? [];
  const valores = serie?.valores ?? [];
  for (let i = valores.length - 1; i >= 0; i -= 1) {
    if (finito(valores[i]) && datas[i]) return { data: datas[i], valor: valores[i] };
  }
  return null;
}

/**
 * Ponto mais recente que está a `meses` meses do último ponto ou antes (ex.: há 12 meses).
 * Nenhum ponto com data tão antiga: null.
 */
export function pontoHaMeses(serie, meses = 12) {
  const atual = ultimoPonto(serie);
  if (!atual) return null;
  const [ano, mes, dia] = atual.data.split('-').map(Number);
  // dia limitado ao último dia do mês-alvo (31/03 − 1 mês = 28/02); Date.UTC(ano, mes - meses, 0) é esse último dia
  const ultimoDiaAlvo = new Date(Date.UTC(ano, mes - meses, 0)).getUTCDate();
  const alvo = new Date(Date.UTC(ano, mes - 1 - meses, Math.min(dia, ultimoDiaAlvo))).toISOString().slice(0, 10);
  let achado = null;
  (serie.datas ?? []).forEach((data, i) => {
    if (data <= alvo && finito(serie.valores[i])) achado = { data, valor: serie.valores[i] };
  });
  return achado;
}

/**
 * Frase-resumo do pregão, só com fatos: "85 ações acompanhadas. Dia volátil."
 * O que faltar some da frase; sem nenhum dado, vazio.
 */
export function frasesDoResumo(estatisticas, estado) {
  const partes = [];
  const ativos = estatisticas?.ativos_analisados;
  if (Number.isInteger(ativos) && ativos >= 0) partes.push(TEXTOS.mercado.resumoAtivos(ativos));
  const frase = TEXTOS.mercado.estadoDia[estado];
  if (frase) partes.push(frase);
  return partes.join(' ');
}

/** Pregões para trás de cada período (a janela de n pontos tem n - 1 pregões de intervalo). */
const PREGOES_ATRAS = { d1: 1, m1: JANELAS['1m'] - 1, m6: JANELAS['6m'] - 1, a1: JANELAS['1a'] - 1 };

const SEM_PERIODOS = { d1: null, m1: null, m6: null, a1: null };

/**
 * Variação do dia e de 1, 6 e 12 meses de uma série diária, em fração:
 * último valor / valor de n pregões antes - 1 (1, 21, 126 e 252 pregões).
 * Usa o retorno total; sem ele, o fechamento. Falta de história: null no período.
 */
export function periodosDaSerie(serie) {
  const valores = serie?.valores ?? {};
  const arr = [CAMPO_RETORNO, 'fechamento'].map((c) => valores[c]).find((a) => a?.some(finito));
  if (!arr) return { ...SEM_PERIODOS };
  let ultimo = arr.length - 1;
  while (ultimo >= 0 && !finito(arr[ultimo])) ultimo -= 1;
  const resultado = {};
  for (const [chave, atras] of Object.entries(PREGOES_ATRAS)) {
    const base = arr[ultimo - atras];
    resultado[chave] = ultimo - atras >= 0 && finito(base) && base !== 0 ? arr[ultimo] / base - 1 : null;
  }
  return resultado;
}

/**
 * Mesmos períodos para uma série por data (Banco Central, dólar): o dia compara com o
 * ponto anterior; 1, 6 e 12 meses, com o ponto mais recente que esteja a esse tempo ou antes.
 */
export function periodosPorCalendario(historico) {
  const atual = ultimoPonto(historico);
  if (!atual) return { ...SEM_PERIODOS };
  const razao = (antes) => (antes && antes.valor !== 0 ? atual.valor / antes.valor - 1 : null);
  const datas = historico.datas ?? [];
  let anterior = null;
  for (let i = datas.indexOf(atual.data) - 1; i >= 0; i -= 1) {
    if (finito(historico.valores[i])) {
      anterior = { data: datas[i], valor: historico.valores[i] };
      break;
    }
  }
  return {
    d1: razao(anterior),
    m1: razao(pontoHaMeses(historico, 1)),
    m6: razao(pontoHaMeses(historico, 6)),
    a1: razao(pontoHaMeses(historico, 12)),
  };
}

/**
 * Um campo de series_diarias como {datas, valores}. Valor não finito, {valor,status} sem 'ok', ou data dentro
 * de um trecho de status[campo] diferente de 'ok' vira null: lacuna no gráfico. Menos de 2 valores: null.
 */
export function serieDoCampo(registro, campo = 'fechamento') {
  const datas = registro?.datas ?? [];
  const brutos = registro?.valores?.[campo] ?? [];
  const marcas = registro?.status?.[campo];
  const alinhado = Array.isArray(marcas) && marcas.some((m) => typeof m === 'string');
  const trechos = alinhado ? [] : trechosSemValor(marcas, datas);
  const valores = datas.map((data, i) => {
    if (alinhado && marcas[i] != null && marcas[i] !== 'ok') return null;
    if (trechos.some((t) => t.de <= data && data <= t.ate)) return null;
    const bruto = brutos[i];
    const v = bruto !== null && typeof bruto === 'object' ? valorOuNulo(bruto) : bruto;
    return finito(v) ? v : null;
  });
  return valores.filter(finito).length >= 2 ? { datas, valores } : null;
}

/** Série diária de cada linha da tabela de índices (rótulo do pacote -> ticker). */
export const TICKER_DO_ROTULO = {
  [ROTULO_IBOVESPA]: 'IBOV',
  'CDI 12M': 'CDI',
  'IPCA 12M': 'IPCA',
  IDIV: 'IDIV',
  SMLL: 'SMLL',
  IFIX: 'IFIX',
  IVVB11: 'IVVB11',
};

export const ROTULO_DOLAR = 'Dólar (R$)';
export const CHAVE_DOLAR = 'DOLAR';

const ROTULO_PERIODO = { m1: TEXTOS.mercado.periodos['1m'], m6: TEXTOS.mercado.periodos['6m'], a1: TEXTOS.mercado.periodos['1a'] };

const ehVariacaoNoDelta = (delta = '') => delta === 'estável' || delta === '—' || delta.includes('%');
const semNumeroNoDia = (texto) => !texto || (texto !== 'estável' && !/\d/.test(texto));
const sinalDaFracao = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : 'flat');

/**
 * Completa a tabela de índices com o que a série histórica calcula. O valor do pacote tem
 * prioridade; a série só preenche o que faltou. `calculos` mapeia ticker (ou CHAVE_DOLAR) ->
 * {d1, m1, m6, a1}. O que veio do cálculo ganha `calculado` (por "hoje" e por rótulo de período).
 */
export function completarIndicadores(indicadores = [], calculos = {}) {
  return indicadores.map((ind) => {
    const chave = ind.label === ROTULO_DOLAR ? CHAVE_DOLAR : TICKER_DO_ROTULO[ind.label];
    const calc = chave ? calculos[chave] : null;
    if (!calc) return ind;
    let saida = ind;

    const hoje = celulaHoje(ind);
    if (semNumeroNoDia(hoje.texto) && finito(calc.d1)) {
      const texto = pct(calc.d1);
      saida = ehVariacaoNoDelta(ind.delta)
        ? { ...saida, delta: texto, sinal: sinalDaFracao(calc.d1) }
        : { ...saida, valor: texto };
      saida = { ...saida, calculado: { ...saida.calculado, hoje: true } };
    }

    const existentes = ind.periodos ?? [];
    let mudou = false;
    const periodos = Object.entries(ROTULO_PERIODO).map(([chavePeriodo, rotulo]) => {
      const atual = existentes.find((p) => p.rotulo === rotulo);
      if (/[0-9]/.test(atual?.valor_texto ?? '')) return atual;
      if (!finito(calc[chavePeriodo])) return atual ?? { rotulo, valor_texto: null, sinal: 'flat' };
      mudou = true;
      return { rotulo, valor_texto: pct(calc[chavePeriodo]), sinal: sinalDaFracao(calc[chavePeriodo]), calculado: true };
    });
    return mudou ? { ...saida, periodos } : saida;
  });
}

/** true se alguma célula da tabela veio do cálculo pela série histórica. */
export const temCalculado = (indicadores = []) =>
  indicadores.some((i) => i.calculado?.hoje || i.periodos?.some((p) => p.calculado));

/**
 * Taxa do CDI do dia do registro de mercado_dia: fração ao dia formatada e a data da taxa (dia e mês).
 * Sem o valor, null: a linha não aparece. Sem a data, `data` fica null.
 */
export function taxaCdiDoDia(registro) {
  const valor = valorOuNulo(registro?.cdi_dia);
  if (valor == null) return null;
  return { texto: pct(valor, { casas: 4, sinal: false }), data: diaMes(registro?.cdi_data) || null };
}

/** Dias úteis do ano na convenção do CDI: a taxa ao ano é (1 + taxa do dia)^252 − 1. */
export const DIAS_UTEIS_ANO = 252;

/**
 * CDI ao ano a partir da taxa do dia de mercado_dia (conversão padrão, sem estimar nada).
 * Sem a taxa do dia, null: o cartão de juros volta ao estado vazio.
 */
export function cdiAoAno(registro) {
  const dia = valorOuNulo(registro?.cdi_dia);
  if (dia == null) return null;
  const ano = (1 + dia) ** DIAS_UTEIS_ANO - 1;
  return { valor: ano, texto: pct(ano, { casas: 2, sinal: false }), data: diaMes(registro?.cdi_data) || null };
}

/** O CDI fica, em geral, 0,10 ponto abaixo da meta da Selic; o Copom só mexe em múltiplos de 0,25. */
export const DIFERENCA_CDI_SELIC = 0.001;
export const PASSO_SELIC = 0.0025;

/**
 * Meta da Selic estimada pelo CDI ao ano: + 0,10 ponto e arredondada ao múltiplo de 0,25 mais próximo.
 * Sem CDI, null.
 */
export function selicPeloCdi(registro) {
  const cdi = cdiAoAno(registro);
  if (!cdi) return null;
  const valor = selicDoCdiAoAno(cdi.valor);
  return { valor, texto: pct(valor, { casas: 2, sinal: false }), data: cdi.data, cdi };
}

/**
 * Meta da Selic publicada em mercado_dia (fração ao ano; 0.1375 = 13,75% a.a.) e a data dela (AAAA-MM-DD).
 * Campo ausente (registro antigo): sem_dado. Sem valor utilizável (desatualizado): indisponivel.
 */
export function selicDoPacote(registro) {
  if (registro?.selic_meta === undefined) return { status: 'sem_dado', valor: null, data: null };
  const valor = valorOuNulo(registro.selic_meta);
  if (valor == null) return { status: 'indisponivel', valor: null, data: null };
  return { status: 'ok', valor, data: registro.selic_data ?? null };
}

/** CDI ao ano -> meta da Selic: + 0,10 ponto, no múltiplo de 0,25 mais próximo (sem resto de ponto flutuante). */
function selicDoCdiAoAno(cdiAno) {
  const passos = Math.round((cdiAno + DIFERENCA_CDI_SELIC) / PASSO_SELIC);
  return Number((passos * PASSO_SELIC).toFixed(4));
}

/** Pontos vizinhos que entram na mediana: tira o salto falso de feriado (um dia que carrega o juro de dois). */
const VIZINHOS_MEDIANA_SELIC = 2;

/** Mediana sem média: com quantidade par, fica o do meio de baixo (sempre um valor que existiu). */
function medianaReal(lista) {
  const ordem = [...lista].sort((a, b) => a - b);
  return ordem[Math.floor((ordem.length - 1) / 2)];
}

/** Dias em que o valor muda em relação ao dia anterior: [{data, de, para}]. */
function mudancasDe(datas, valores) {
  const mudancas = [];
  for (let i = 1; i < valores.length; i += 1) {
    if (valores[i] !== valores[i - 1]) mudancas.push({ data: datas[i], de: valores[i - 1], para: valores[i] });
  }
  return mudancas;
}

/**
 * Meta da Selic dia a dia pela série do índice do CDI: o juro de cada dia (índice / índice anterior − 1),
 * anualizado em 252 dias úteis, vira Selic como em selicPeloCdi; a mediana de 5 dias limpa os feriados.
 * Devolve {datas, valores, mudancas: [{data, de, para}]} ou null com menos de dois dias.
 */
export function selicPelaSerieCdi(serie, campo = 'indice_retorno_total') {
  const datas = serie?.datas ?? [];
  const indice = serie?.valores?.[campo] ?? [];
  const brutos = [];
  for (let i = 1; i < indice.length; i += 1) {
    const antes = indice[i - 1];
    // o índice do dia i já carrega o CDI de i − 1: a taxa é datada no pregão i − 1
    if (!finito(indice[i]) || !finito(antes) || antes <= 0 || !datas[i - 1]) continue;
    const ano = (indice[i] / antes) ** DIAS_UTEIS_ANO - 1;
    brutos.push({ data: datas[i - 1], valor: selicDoCdiAoAno(ano) });
  }
  if (brutos.length < 2) return null;
  const k = VIZINHOS_MEDIANA_SELIC;
  const valores = brutos.map((_, i) => medianaReal(brutos.slice(Math.max(0, i - k), i + k + 1).map((p) => p.valor)));
  const datasBrutas = brutos.map((p) => p.data);
  return { datas: datasBrutas, valores, mudancas: mudancasDe(datasBrutas, valores) };
}

/**
 * Meta da Selic dia a dia pela série SELIC de series_diarias (tipo 'taxa'): ali indice_retorno_total É a meta
 * ao ano em fração (nível), não índice acumulado. Pontos sem valor saem. Valor fora de (0, 1) indica série
 * que não é nível: null. Devolve {datas, valores, mudancas} como selicPelaSerieCdi, ou null.
 */
export function selicDaSerie(serie, campo = 'indice_retorno_total') {
  const campoSerie = serieDoCampo(serie, campo);
  if (!campoSerie) return null;
  const pontos = campoSerie.datas
    .map((data, i) => ({ data, valor: campoSerie.valores[i] }))
    .filter((p) => finito(p.valor));
  if (pontos.length < 2) return null;
  if (pontos.some((p) => !(p.valor > 0 && p.valor < 1))) return null;
  const valores = pontos.map((p) => p.valor);
  const datas = pontos.map((p) => p.data);
  return { datas, valores, mudancas: mudancasDe(datas, valores) };
}

/** Histórico da Selic do gráfico: a série publicada; sem ela, a estimativa pelo CDI. {serie, origem: 'serie'|'cdi'} ou null. */
export function historicoSelic(serieSelic, serieCdi) {
  const publicada = selicDaSerie(serieSelic);
  if (publicada) return { serie: publicada, origem: 'serie' };
  const estimada = selicPelaSerieCdi(serieCdi);
  return estimada ? { serie: estimada, origem: 'cdi' } : null;
}

/** Diferença entre duas taxas em pontos percentuais: -0.0125 -> "−1,25 ponto"; 2 ou mais, "pontos". */
export function textoPontos(dif) {
  if (!finito(dif)) return '';
  const base = pct(dif, { casas: 2 }).replace('%', '');
  return `${base} ${Math.abs(dif) >= 0.02 ? 'pontos' : 'ponto'}`;
}

/** "Ibovespa (pontos)" -> nome "Ibovespa" e unidade "pontos". Sem parênteses, a unidade fica nula. */
export function separarUnidade(rotulo) {
  const m = /^(.*?)\s*\((.*)\)$/.exec(rotulo ?? '');
  return m ? { nome: m[1], unidade: m[2] } : { nome: rotulo, unidade: null };
}

/** "4,58% até set/2026" -> valor "4,58%" e legenda "até set/2026". Sem " até ", o texto inteiro é o valor. */
export function separarAte(texto) {
  const m = /^(.*?)\s+(até\s.+)$/.exec(texto ?? '');
  return m ? { valor: m[1], legenda: m[2] } : { valor: texto, legenda: null };
}

export const ROTULO_BRENT = 'Petróleo Brent (US$)';

/** Grupos da seção "Como foi cada índice", na ordem de exibição, com os rótulos do pacote de cada um. */
export const GRUPOS_INDICES = [
  { chave: 'bolsa', titulo: TEXTOS.mercado.grupos.bolsa, rotulos: [ROTULO_IBOVESPA, 'IDIV', 'SMLL', 'IFIX', 'IVVB11'] },
  { chave: 'juros', titulo: TEXTOS.mercado.grupos.juros, rotulos: ['CDI 12M', 'IPCA 12M'] },
  { chave: 'cambio', titulo: TEXTOS.mercado.grupos.cambio, rotulos: [ROTULO_DOLAR, ROTULO_BRENT] },
];

/** Chave do índice em TEXTOS.mercado.indices, pelo rótulo que o pacote traz. */
const CHAVE_DO_ROTULO = {
  [ROTULO_IBOVESPA]: 'IBOV',
  [ROTULO_DOLAR]: 'DOLAR',
  [ROTULO_BRENT]: 'BRENT',
  'CDI 12M': 'CDI',
  'IPCA 12M': 'IPCA',
  IDIV: 'IDIV',
  SMLL: 'SMLL',
  IFIX: 'IFIX',
  IVVB11: 'IVVB11',
};

/** Nome e explicação (com dois níveis) de um índice; null se o rótulo não for conhecido. */
export function textosDoIndice(rotulo) {
  return TEXTOS.mercado.indices[CHAVE_DO_ROTULO[rotulo]] ?? null;
}

/** Os índices de cada grupo que vieram no pacote, na ordem da lista. Grupo sem nenhum índice some. */
export function agruparIndices(indicadores = []) {
  return GRUPOS_INDICES.map((g) => ({
    chave: g.chave,
    titulo: g.titulo,
    itens: g.rotulos.map((rotulo) => indicadores.find((i) => i.label === rotulo)).filter(Boolean),
  })).filter((g) => g.itens.length > 0);
}

/** Períodos de um índice que têm número, na ordem do pacote. Período sem número não entra: nada de "Indisponível" nem 0. */
export function periodosComNumero(indicador) {
  return (indicador?.periodos ?? [])
    .filter((p) => /[0-9]/.test(p.valor_texto ?? ''))
    .map((p) => ({
      rotulo: p.rotulo,
      texto: p.valor_texto,
      sinal: p.sinal ?? sinalDoTexto(p.valor_texto),
      calculado: Boolean(p.calculado),
    }));
}

/** Unidade como prefixo ("R$ 5,03") ou sufixo ("165.529 pontos"); sem unidade, o número puro. */
function comUnidade(texto, unidade) {
  if (unidade === 'R$' || unidade === 'US$') return `${unidade} ${texto}`;
  if (unidade) return `${texto} ${unidade}`;
  return texto;
}

/**
 * O que o cartão de um índice mostra: `grande` (valor de hoje com a unidade, ou null), `legenda`,
 * `dia` (variação do dia em pílula, ou null), `sinalGrande` (cor do número quando ele já é uma
 * variação) e `calculado`. Quando o pacote só traz a variação como valor (IDIV, SMLL...), esse
 * valor é o grande e não há pílula.
 */
export function valorDoCard(indicador) {
  const { unidade } = separarUnidade(indicador?.label);
  const hoje = celulaHoje(indicador);
  const calculado = Boolean(indicador?.calculado?.hoje);
  const nivel = hoje.nivel === '—' || hoje.nivel === '' ? null : hoje.nivel;
  if (nivel != null) {
    const temDia = Boolean(hoje.texto) && hoje.texto !== '—';
    return {
      grande: comUnidade(nivel, unidade),
      legenda: null,
      dia: temDia ? { texto: hoje.texto, sinal: hoje.sinal ?? 'flat' } : null,
      sinalGrande: 'flat',
      calculado,
    };
  }
  const { valor, legenda } = separarAte(hoje.texto ?? '');
  const semValor = !valor || valor === '—';
  const delta = indicador?.delta ?? '';
  const legendaDoDelta = delta && delta !== '—' && delta !== 'estável' && !delta.includes('%') ? delta : null;
  return {
    grande: semValor ? null : valor,
    legenda: semValor ? null : (legenda ?? legendaDoDelta),
    dia: null,
    sinalGrande: semValor ? 'flat' : sinalDoTexto(valor),
    calculado,
  };
}

/** Primeiro e último ponto com valor de uma série {datas, valores}, com a variação entre eles (fração). Sem ponto: null. */
export function resumoDeSerie(serie) {
  const fim = ultimoPonto(serie);
  const i = (serie?.valores ?? []).findIndex(finito);
  if (!fim || i < 0) return null;
  const inicio = { data: serie.datas[i], valor: serie.valores[i] };
  return { inicio, fim, variacao: inicio.valor !== 0 ? fim.valor / inicio.valor - 1 : null };
}
