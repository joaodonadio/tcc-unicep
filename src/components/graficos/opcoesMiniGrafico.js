import { comOpacidade } from '../../lib/temaGraficos.js';

/**
 * Opções do ECharts para o mini gráfico dos cartões: sem eixos visíveis, grade, tooltip nem rótulos.
 * Funções puras (recebem cores já resolvidas, sem var()).
 */

const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/** Linhas da matriz de pontos; as colunas saem do total (de cima para baixo, da esquerda para a direita). */
const LINHAS_PONTOS = 5;
/** Desenho da linha da área, em ms; o pulso do ponto final começa quando ela termina. */
const DURACAO_LINHA = 1100;
const ALTURA_PADRAO = 72;
/** Abaixo desta altura (px) a área fica compacta: ponto parado, sem pulso, margens pequenas. */
const ALTURA_COMPACTA = 48;
/** Inclinação: 1% de diferença entre os dois pontos vai de baixo a cima do gráfico. */
const ESCALA_INCLINACAO = 0.01;
const DURACAO_INCLINACAO = 600;

/** Há o que desenhar? Pontos: algum grupo positivo. Área e barras: 2 valores finitos. */
export function temDadosMini(tipo, valores) {
  if (!Array.isArray(valores)) return false;
  if (tipo === 'pontos') return valores.some((v) => finito(v) && v > 0);
  return valores.filter(finito).length >= 2;
}

/** Índice do último valor finito, ou -1. */
function ultimoIndice(valores) {
  for (let i = valores.length - 1; i >= 0; i -= 1) if (finito(valores[i])) return i;
  return -1;
}

const indices = (n) => Array.from({ length: n }, (_, i) => i);

/** Brilho: sombra borrada na própria cor. */
const brilho = (cor) => ({ shadowBlur: 10, shadowColor: comOpacidade(cor, 0.6) });

/** Ponto final: pulsa com animação; parado (contornado pelo fundo) com movimento reduzido ou no modo compacto. */
function pontoFinal(fim, { cor, fundo, animar, atraso = 0, tamanho = 7 }) {
  if (animar) {
    return {
      type: 'effectScatter',
      silent: true,
      symbolSize: tamanho,
      showEffectOn: 'render',
      rippleEffect: { scale: 3, brushType: 'stroke', period: 3 },
      itemStyle: { color: cor, ...brilho(cor) },
      data: fim,
      animationDelay: atraso,
      z: 3,
    };
  }
  return {
    type: 'scatter',
    silent: true,
    symbolSize: tamanho,
    itemStyle: { color: cor, borderColor: fundo, borderWidth: tamanho < 7 ? 1 : 2 },
    data: fim,
    z: 3,
  };
}

/** Área com brilho, linha tracejada no valor inicial e ponto final que pulsa (parado com movimento reduzido). */
function opcaoArea({ dados, ultimo, cor, fundo, suave, animar, altura = ALTURA_PADRAO, faixaExata = false }) {
  const compacto = altura < ALTURA_COMPACTA;
  const inicio = dados.find(finito) ?? null;
  const fim = [[ultimo, dados[ultimo]]];
  const linha = {
    type: 'line',
    silent: true,
    data: dados,
    connectNulls: false,
    smooth: 0.3,
    showSymbol: false,
    lineStyle: { color: cor, width: compacto ? 1.5 : 2, cap: 'round', join: 'round', ...brilho(cor) },
    itemStyle: { color: cor },
    areaStyle: {
      origin: 'start',
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: comOpacidade(cor, 0.38) },
          { offset: 1, color: comOpacidade(cor, 0) },
        ],
      },
    },
    emphasis: { disabled: true },
    z: 2,
  };
  const ponto = pontoFinal(fim, { cor, fundo, animar: animar && !compacto, atraso: DURACAO_LINHA, tamanho: compacto ? 5 : 7 });
  // de onde a janela partiu: linha fina, tracejada e apagada no primeiro valor
  const base = {
    type: 'line',
    silent: true,
    data: dados.map(() => inicio),
    showSymbol: false,
    lineStyle: { color: comOpacidade(suave, 0.35), width: 1, type: [3, 4] },
    emphasis: { disabled: true },
    animation: false,
    z: 1,
  };
  return {
    animation: animar,
    animationDuration: DURACAO_LINHA,
    animationEasing: 'cubicOut',
    grid: compacto
      ? { left: 1, right: 5, top: 4, bottom: 4 }
      : faixaExata
        ? { left: 2, right: 12, top: 8, bottom: 8 }
        : { left: 2, right: 12, top: 10, bottom: 6 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: indices(dados.length) },
    yAxis: faixaExata ? { type: 'value', show: false, min: 'dataMin', max: 'dataMax' } : { type: 'value', show: false, scale: true },
    series: [linha, ponto, base],
  };
}

/** Barras-cápsula por mês: a última na cor cheia e com brilho, as outras a 45%; base fina no zero. */
function opcaoBarras({ dados, ultimo, cor, suave, animar }) {
  return {
    animation: animar,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    grid: { left: 2, right: 2, top: 10, bottom: 10 },
    // eixo x só pela linha: fica no zero (onZero) e serve de base apagada
    xAxis: {
      type: 'category',
      show: true,
      boundaryGap: true,
      data: indices(dados.length),
      axisLine: { show: true, onZero: true, lineStyle: { color: comOpacidade(suave, 0.3), width: 1 } },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: { type: 'value', show: false, scale: false },
    series: [
      {
        type: 'bar',
        silent: true,
        barWidth: '36%',
        emphasis: { disabled: true },
        data: dados.map((v, i) => ({
          value: v,
          itemStyle:
            i === ultimo
              ? { color: cor, borderRadius: 999, ...brilho(cor) }
              : { color: comOpacidade(cor, 0.45), borderRadius: 999 },
        })),
        // as barras crescem em sequência
        animationDelay: animar ? (i) => i * 45 : 0,
      },
    ],
  };
}

/**
 * Matriz de pontos: um ponto por unidade de cada grupo, na ordem de `valores` (subiram, estáveis, caíram).
 * O grupo do meio (estáveis) fica mais apagado. O tamanho do ponto sai da largura medida; sem ela, 7px.
 */
function opcaoPontos({ valores, cor, cores, largura, altura, animar }) {
  const contagens = valores.map((v) => (finito(v) && v > 0 ? Math.round(v) : 0));
  const total = contagens.reduce((s, n) => s + n, 0);
  const colunas = Math.max(1, Math.ceil(total / LINHAS_PONTOS));
  const pontos = [];
  contagens.forEach((n, grupo) => {
    const base = cores[grupo] ?? cor;
    const corGrupo = grupo === 1 ? comOpacidade(base, 0.55) : base;
    for (let k = 0; k < n; k += 1) {
      const i = pontos.length;
      pontos.push({ value: [Math.floor(i / LINHAS_PONTOS), i % LINHAS_PONTOS], itemStyle: { color: corGrupo } });
    }
  });
  const passoX = finito(largura) && largura > 0 ? largura / colunas : null;
  const passo = passoX == null ? null : Math.min(passoX, altura / LINHAS_PONTOS);
  const tamanho = passo == null ? 7 : Math.max(3, Math.min(10, Math.round(passo * 0.6)));
  return {
    animation: animar,
    animationDuration: 300,
    animationEasing: 'cubicOut',
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: 'category', show: false, boundaryGap: true, data: indices(colunas) },
    yAxis: { type: 'category', show: false, boundaryGap: true, inverse: true, data: indices(LINHAS_PONTOS) },
    series: [
      {
        type: 'scatter',
        silent: true,
        symbol: 'circle',
        symbolSize: tamanho,
        data: pontos,
        emphasis: { disabled: true },
        // os pontos aparecem em sequência, na ordem dos grupos
        animationDelay: animar ? (i) => i * 6 : 0,
      },
    ],
  };
}

/**
 * Inclinação de dois pontos (antes → hoje): linha com brilho na cor da direção, base tracejada no valor
 * anterior, ponto anterior vazado e ponto de hoje cheio, que pulsa (parado com movimento reduzido).
 * A faixa do eixo y é fixa em torno da média: a inclinação mostra o tamanho do movimento, sem exagerar.
 */
function opcaoInclinacao({ dados, cor, fundo, suave, animar }) {
  const [antes, hoje] = dados.filter(finito);
  const media = (antes + hoje) / 2;
  const meiaFaixa = Math.max(Math.abs(hoje - antes), Math.abs(media) * ESCALA_INCLINACAO) / 2 || 1;
  const linha = {
    type: 'line',
    silent: true,
    data: [antes, hoje],
    showSymbol: false,
    lineStyle: { color: cor, width: 2, cap: 'round', ...brilho(cor) },
    areaStyle: {
      origin: 'start',
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: comOpacidade(cor, 0.22) },
          { offset: 1, color: comOpacidade(cor, 0) },
        ],
      },
    },
    emphasis: { disabled: true },
    z: 2,
  };
  const pontoAntes = {
    type: 'scatter',
    silent: true,
    symbolSize: 8,
    itemStyle: { color: fundo, borderColor: comOpacidade(suave, 0.8), borderWidth: 1.5 },
    data: [[0, antes]],
    z: 3,
  };
  const base = {
    type: 'line',
    silent: true,
    data: [antes, antes],
    showSymbol: false,
    lineStyle: { color: comOpacidade(suave, 0.35), width: 1, type: [3, 4] },
    emphasis: { disabled: true },
    animation: false,
    z: 1,
  };
  return {
    animation: animar,
    animationDuration: DURACAO_INCLINACAO,
    animationEasing: 'cubicOut',
    grid: { left: 8, right: 12, top: 10, bottom: 10 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: [0, 1] },
    yAxis: { type: 'value', show: false, min: media - meiaFaixa, max: media + meiaFaixa },
    series: [linha, pontoFinal([[1, hoje]], { cor, fundo, animar, atraso: DURACAO_INCLINACAO }), pontoAntes, base],
  };
}

/**
 * tipo: 'area' | 'barras' | 'pontos' | 'inclinacao'. `cor` vale para a série; nos pontos, `cores[i]` pinta o grupo `valores[i]`.
 * `fundo` contorna o ponto final parado; `suave` pinta as linhas de apoio; `animar` segue o movimento reduzido.
 * `largura` vale só para os pontos. `altura` (px) vale para pontos e área; `faixaExata` (área) prende o eixo y
 * entre a mínima e a máxima; altura abaixo de 48px deixa a área compacta.
 */
export function montarOpcaoMini({
  tipo,
  valores,
  cor,
  cores = [],
  fundo,
  suave,
  animar,
  largura = null,
  altura = ALTURA_PADRAO,
  faixaExata = false,
}) {
  if (tipo === 'pontos') return opcaoPontos({ valores, cor, cores, largura, altura, animar });
  const dados = valores.map((v) => (finito(v) ? v : null));
  const ultimo = ultimoIndice(dados);
  if (tipo === 'barras') return opcaoBarras({ dados, ultimo, cor, suave, animar });
  if (tipo === 'inclinacao') return opcaoInclinacao({ dados, cor, fundo, suave, animar });
  return opcaoArea({ dados, ultimo, cor, fundo, suave, animar, altura, faixaExata });
}
