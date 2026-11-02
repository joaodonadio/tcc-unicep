/**
 * Funções puras da seção "O mercado" (sem React).
 *
 * Valor ausente continua null ou texto de ausência; nunca vira 0.
 */

import { alinharPorData, cortarJanela, JANELAS } from './series.js';
import { numero, pct } from './formato.js';
import { nomeSetor } from './analiseDoDia.js';
import { semAcento } from './listaAcoes.js';
import { TEXTOS } from './textos.js';
import { valorOuNulo } from './valor.js';

const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/** Campo de série usado para a rentabilidade (retorno total, com dividendos). */
export const CAMPO_RETORNO = 'indice_retorno_total';

/** Períodos do gráfico, na ordem em que aparecem no segmentado. */
export const PERIODOS = [
  { chave: '1m', pontos: JANELAS['1m'] },
  { chave: '6m', pontos: JANELAS['6m'] },
  { chave: '1a', pontos: JANELAS['1a'] },
];

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

/** Célula de um período (1 mês, 6 meses, 1 ano): texto e sinal do pacote; ausente vira '—', nunca 0. */
export function celulaPeriodo(indicador, rotulo) {
  const campo = indicador?.periodos?.find((p) => p.rotulo === rotulo);
  if (!campo) return { texto: null, sinal: 'flat' };
  return { texto: campo.valor_texto ?? null, sinal: campo.sinal ?? 'flat' };
}

/** Maior |variação| entre os setores (em %), 0 se não houver nenhuma. */
export function maiorVariacaoAbsoluta(setores = []) {
  return setores.reduce((maior, s) => (finito(s.variacao) ? Math.max(maior, Math.abs(s.variacao)) : maior), 0);
}

/**
 * Geometria da barra divergente: lado ('alta' para a direita, 'queda' para a
 * esquerda) e largura em % do meio do trilho (máximo 50). Zero ou sem valor: sem barra.
 */
export function geometriaBarra(variacao, maximo) {
  if (!finito(variacao) || variacao === 0 || !(maximo > 0)) return { lado: null, largura: 0 };
  return {
    lado: variacao > 0 ? 'alta' : 'queda',
    largura: (Math.abs(variacao) / maximo) * 50,
  };
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
  const alvo = new Date(Date.UTC(ano, mes - 1 - meses, dia)).toISOString().slice(0, 10);
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
 * Uma linha por ação com o volume do dia: {ticker, empresa, setor, volume, mediana, relativo, variacao}.
 * Ausência fica null (nunca 0). Ordem: maior volume primeiro, sem volume no fim.
 */
export function linhasDeVolume(resumos = [], acoes = []) {
  const dadosDe = new Map((acoes ?? []).map((a) => [a.ticker, a]));
  return (resumos ?? [])
    .map((r) => ({
      ticker: r.ticker,
      empresa: dadosDe.get(r.ticker)?.empresa ?? null,
      setor: nomeSetor(dadosDe.get(r.ticker)?.setor),
      volume: valorOuNulo(r.volume?.total),
      mediana: valorOuNulo(r.volume?.mediana_20),
      relativo: valorOuNulo(r.volume?.relativo),
      variacao: valorOuNulo(r.cotacao?.variacao_dia),
    }))
    .sort(compararVolume('descending'));
}

/** Comparador por volume; direção 'descending' (maior primeiro) ou 'ascending'. Sem volume sempre no fim. */
export function compararVolume(direcao = 'descending') {
  const fator = direcao === 'ascending' ? 1 : -1;
  return (a, b) => {
    if (a.volume == null && b.volume == null) return a.ticker.localeCompare(b.ticker);
    if (a.volume == null) return 1;
    if (b.volume == null) return -1;
    return (a.volume - b.volume) * fator || a.ticker.localeCompare(b.ticker);
  };
}

/** A ação de maior volume de cada setor, ordenada pelo volume (maior primeiro). Sem setor ou sem volume: fora. */
export function destaquePorSetor(linhas = []) {
  const lideres = new Map();
  for (const l of linhas) {
    if (!l.setor || l.volume == null) continue;
    const atual = lideres.get(l.setor);
    if (!atual || l.volume > atual.volume) lideres.set(l.setor, l);
  }
  return [...lideres.values()].sort(compararVolume('descending'));
}

/** Filtra por ticker ou empresa, sem acento e sem diferenciar maiúsculas. Busca vazia devolve tudo. */
export function buscarLinhas(linhas = [], termo = '') {
  const t = semAcento(termo).trim();
  if (!t) return linhas;
  return linhas.filter((l) => semAcento(l.ticker).includes(t) || semAcento(l.empresa).includes(t));
}
