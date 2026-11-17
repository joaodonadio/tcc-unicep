import { dataBR } from '../../lib/datas.js';
import { numero } from '../../lib/formato.js';
import { comOpacidade, lerToken, opacaSobre, temaGraficos } from '../../lib/temaGraficos.js';
import { TEXTOS } from '../../lib/textos.js';
import { animacaoGrafico, transicaoBalao } from '../../lib/animacaoGraficos.js';
import { itensMarcaEvento } from '../../lib/eventosMercado.js';

/**
 * Opções do ECharts para o mini gráfico dos cartões: sem eixos visíveis, grade, tooltip nem rótulos.
 * Funções puras (recebem cores já resolvidas, sem var()); só o tooltip interativo lê os tokens do tema.
 */

const finito = (v) => typeof v === 'number' && Number.isFinite(v);

const escapar = (t) =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Valor padrão do balão: pontos, sem casas. */
const formatarPontosPadrao = (v) => TEXTOS.hoje.mini.valorPontos(numero(v, { casas: 0 }));

/** Balão do cursor na área: data em dd/mm/aaaa e o valor pelo `formatar` (pontos, se não vier outro). Valor nulo é "sem dado", nunca 0. */
export function formatarBalaoArea(params, datas, tema, formatar = formatarPontosPadrao) {
  const lista = Array.isArray(params) ? params : [params];
  const p = lista.find((x) => x?.seriesIndex === 0) ?? lista[0];
  if (!p) return '';
  const data = dataBR(datas[p.dataIndex]);
  const valor = finito(p.data) ? formatar(p.data) : TEXTOS.hoje.mini.semDado;
  return (
    `<div style="font-family:${escapar(tema.fonteTexto)};font-size:12px;color:${escapar(tema.suave)}">${escapar(data)}</div>` +
    `<div style="margin-top:2px;font-family:${escapar(tema.fonte)};font-size:14px;font-weight:500;letter-spacing:-0.02em;` +
    `font-variant-numeric:tabular-nums slashed-zero;white-space:nowrap;color:${escapar(tema.texto)}">${escapar(valor)}</div>`
  );
}

/** Tooltip da área interativa: cursor tracejado fino e balão de vidro. Sem movimento reduzido, o balão não anima. */
function tooltipArea(datas, animar, formatar) {
  const tema = temaGraficos();
  return {
    trigger: 'axis',
    confine: true,
    triggerOn: 'mousemove|click',
    ...transicaoBalao(animar),
    backgroundColor: opacaSobre(lerToken('--flutuante-fundo'), tema.fundo) || tema.superficie,
    borderColor: opacaSobre(lerToken('--flutuante-borda'), tema.fundo) || tema.borda,
    borderWidth: 1,
    borderRadius: 14,
    padding: [8, 12],
    textStyle: { color: tema.texto, fontFamily: tema.fonteTexto, fontSize: 13 },
    axisPointer: { type: 'line', lineStyle: { color: comOpacidade(tema.suave, 0.6), width: 1, type: 'dashed' } },
    formatter: (params) => formatarBalaoArea(params, datas, tema, formatar),
  };
}

/** Linhas da matriz de pontos; as colunas saem do total (de cima para baixo, da esquerda para a direita). */
const LINHAS_PONTOS = 5;
/** Desenho da linha da área, em ms; o pulso do ponto final começa quando ela termina. */
const DURACAO_LINHA = 1100;
const ALTURA_PADRAO = 72;
/** Abaixo desta altura (px) a área fica compacta: ponto parado, sem pulso, margens pequenas. */
const ALTURA_COMPACTA = 48;

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
function opcaoArea({
  dados,
  ultimo,
  cor,
  fundo,
  suave,
  animar,
  altura = ALTURA_PADRAO,
  faixaExata = false,
  interativo = false,
  datas = [],
  formatar,
  degraus = false,
  marcas = [],
}) {
  const compacto = altura < ALTURA_COMPACTA;
  const inicio = dados.find(finito) ?? null;
  const fim = [[ultimo, dados[ultimo]]];
  // interativo: o ponto sob o cursor aparece (círculo na cor da linha, borda do fundo), sem símbolo parado
  const destaque = interativo ? { symbol: 'circle', symbolSize: 8, itemStyle: { color: cor, borderColor: fundo, borderWidth: 2 } } : {};
  const linha = {
    type: 'line',
    silent: !interativo,
    data: dados,
    connectNulls: false,
    // degraus: a taxa fica parada até o dia em que muda (ex.: Selic entre reuniões do Copom)
    smooth: degraus ? false : 0.3,
    step: degraus ? 'end' : false,
    showSymbol: false,
    ...destaque,
    lineStyle: { color: cor, width: compacto ? 1.5 : 2, cap: 'round', join: 'round', ...brilho(cor) },
    itemStyle: { color: cor, ...destaque.itemStyle },
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
    emphasis: { disabled: !interativo },
    z: 2,
    // marcas de evento: linhas verticais discretas no dia (índice da janela)
    ...(marcas.length ? { markLine: { silent: true, symbol: 'none', data: itensMarcaEvento(marcas, suave, { rotulo: false }) } } : {}),
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
    ...animacaoGrafico(animar, DURACAO_LINHA),
    grid: compacto
      ? { left: 1, right: 5, top: 4, bottom: 4 }
      : faixaExata
        ? { left: 2, right: 12, top: 8, bottom: 8 }
        : { left: 2, right: 12, top: 10, bottom: 6 },
    // interativo: o eixo x leva as datas, para o balão saber de qual dia é o ponto
    xAxis: { type: 'category', show: false, boundaryGap: false, data: interativo ? datas : indices(dados.length) },
    yAxis: faixaExata ? { type: 'value', show: false, min: 'dataMin', max: 'dataMax' } : { type: 'value', show: false, scale: true },
    series: [linha, ponto, base],
    ...(interativo ? { tooltip: tooltipArea(datas, animar, formatar) } : {}),
  };
}

/** Barras-cápsula por mês: a última na cor cheia e com brilho, as outras a 45%; base fina no zero. */
function opcaoBarras({ dados, ultimo, cor, suave, animar }) {
  return {
    ...animacaoGrafico(animar),
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
    ...animacaoGrafico(animar),
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
 * tipo: 'area' | 'barras' | 'pontos'. `cor` vale para a série; nos pontos, `cores[i]` pinta o grupo `valores[i]`.
 * `fundo` contorna o ponto final parado; `suave` pinta as linhas de apoio; `animar` segue o movimento reduzido.
 * `largura` vale só para os pontos. `altura` (px) vale para pontos e área; `faixaExata` (área) prende o eixo y
 * entre a mínima e a máxima; altura abaixo de 48px deixa a área compacta.
 * `degraus` (área) desenha em escada, sem curva. `interativo` (área) liga o tooltip com a data (`datas`, 'AAAA-MM-DD', uma por valor) e o valor (`formatarValor`, ou pontos).
 * `marcas` (área) são [{ indice, marca }]: linhas verticais tracejadas com o rótulo no topo.
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
  interativo = false,
  datas = [],
  formatarValor,
  degraus = false,
  marcas = [],
}) {
  if (tipo === 'pontos') return opcaoPontos({ valores, cor, cores, largura, altura, animar });
  const dados = valores.map((v) => (finito(v) ? v : null));
  const ultimo = ultimoIndice(dados);
  if (tipo === 'barras') return opcaoBarras({ dados, ultimo, cor, suave, animar });
  return opcaoArea({ dados, ultimo, cor, fundo, suave, animar, altura, faixaExata, interativo, datas, formatar: formatarValor, degraus, marcas });
}
