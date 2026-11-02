import { TEXTOS } from '../../lib/textos.js';
import { comOpacidade, resolverCor, temaGraficos } from '../../lib/temaGraficos.js';

/** Monta as opções do ECharts a partir das props do GraficoInterativo (função pura, sem DOM além dos tokens CSS). */

const finito = (v) => typeof v === 'number' && Number.isFinite(v);
const nuloSeAusente = (v) => (finito(v) ? v : null);

const escapar = (t) =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const RAIO = 6;

/** Cartão opaco, sem atravessar o gráfico: fica acima do ponto (ou abaixo, se não couber) e dentro da área. */
function posicaoTooltip(pt, _params, _dom, _rect, tamanho) {
  const [x, y] = pt;
  const [w, h] = tamanho.contentSize;
  const [vw] = tamanho.viewSize;
  const esquerda = Math.min(Math.max(x - w / 2, 4), Math.max(4, vw - w - 4));
  const acima = y - h - 14;
  return [esquerda, acima < 4 ? y + 14 : acima];
}

function tooltipBase(tema, formatter) {
  return {
    trigger: 'axis',
    confine: true,
    backgroundColor: tema.superficie,
    borderColor: tema.borda,
    borderWidth: 1,
    borderRadius: 12,
    padding: [10, 12],
    textStyle: { color: tema.texto, fontFamily: tema.fonte, fontSize: 13 },
    extraCssText: 'z-index:1000;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.55);',
    position: posicaoTooltip,
    formatter,
  };
}

function linhaTooltip(tema, cor, rotulo, valor, mostrarRotulo) {
  const bolinha = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${escapar(cor)};margin-right:8px;flex:none"></span>`;
  const nome = mostrarRotulo
    ? `<span style="color:${escapar(tema.suave)};margin-right:12px">${escapar(TEXTOS.grafico.tipRotulo(rotulo))}</span>`
    : '';
  const numero = `<strong style="margin-left:auto;font-size:15px;font-weight:700;color:${escapar(tema.texto)};font-variant-numeric:tabular-nums">${escapar(valor)}</strong>`;
  return `<div style="display:flex;align-items:center;white-space:nowrap;margin-top:4px">${bolinha}${nome}${numero}</div>`;
}

/**
 * @param {object} p
 * @param {Array} p.lista séries normalizadas {id, rotulo, valores, cor, tracejada}
 * @param {Array} p.rotulosEixo datas ou categorias (valores crus)
 */
export function montarOpcao({
  lista,
  rotulosEixo,
  modo,
  formatar,
  formatarData,
  linhaZero,
  eixo,
  rotulosX,
  corPorSinal,
  animar,
}) {
  const tema = temaGraficos();
  const horizontal = modo === 'barrasHorizontais';
  const nomeEixo = (r) => (horizontal ? String(r ?? '') : formatarData(r));
  const categorias = rotulosEixo.map(nomeEixo);

  const textoEixo = { color: tema.suave, fontFamily: tema.fonte, fontSize: 12 };
  const fmtValor = (v) => (finito(v) ? formatar(v) : TEXTOS.grafico.semDado);

  const eixoValores = {
    type: 'value',
    show: eixo,
    scale: modo === 'linha' && !linhaZero,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { ...textoEixo, formatter: (v) => formatar(v), hideOverlap: true },
    splitNumber: 3,
    splitLine: { show: eixo, lineStyle: { color: tema.fio, type: 'dotted', width: 1, opacity: 0.5 } },
  };

  const eixoCategorias = {
    type: 'category',
    data: categorias,
    boundaryGap: modo !== 'linha',
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { ...textoEixo, show: horizontal ? true : rotulosX, hideOverlap: true, interval: horizontal ? 0 : 'auto' },
  };

  const corDoSinal = (v) => (v < 0 ? tema.queda : tema.alta);

  let series;
  if (modo === 'linha') {
    const unica = lista.length === 1 && !linhaZero;
    series = lista.map((s, idx) => {
      const cor = resolverCor(s.cor);
      const item = {
        id: String(s.id),
        name: s.rotulo,
        type: 'line',
        data: s.valores.map(nuloSeAusente),
        smooth: 0.25,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 8,
        connectNulls: false,
        lineStyle: { width: 2.5, color: cor, type: s.tracejada ? 'dashed' : 'solid', cap: 'round', join: 'round' },
        itemStyle: { color: cor, borderColor: tema.fundo, borderWidth: 2 },
        // Ponto destacado só no passar do mouse: bolinha da cor da série com anel do fundo.
        emphasis: { focus: 'none', scale: true, itemStyle: { color: cor, borderColor: tema.fundo, borderWidth: 3 } },
      };
      if (unica) {
        item.areaStyle = {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: comOpacidade(cor, 0.25) },
              { offset: 1, color: comOpacidade(cor, 0) },
            ],
          },
        };
      }
      if (linhaZero && idx === 0) {
        item.markLine = {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { color: tema.borda, type: 'solid', width: 1 },
          data: [{ yAxis: 0 }],
        };
      }
      return item;
    });
  } else {
    const s = lista[0];
    const base = resolverCor(s.cor);
    const porSinal = corPorSinal || horizontal;
    series = [
      {
        id: String(s.id),
        name: s.rotulo,
        type: 'bar',
        barMaxWidth: horizontal ? 22 : 36,
        barCategoryGap: '35%',
        data: s.valores.map((v) => {
          if (!finito(v)) return null;
          const cor = porSinal ? corDoSinal(v) : base;
          const negativo = v < 0;
          const borderRadius = horizontal
            ? negativo ? [RAIO, 0, 0, RAIO] : [0, RAIO, RAIO, 0]
            : negativo ? [0, 0, RAIO, RAIO] : [RAIO, RAIO, 0, 0];
          const item = { value: v, itemStyle: { color: cor, borderRadius } };
          if (horizontal) {
            item.label = { position: negativo ? 'left' : 'right' };
          }
          return item;
        }),
        label: horizontal
          ? { show: true, formatter: (p) => fmtValor(p.value), color: tema.texto, fontFamily: tema.fonte, fontSize: 12 }
          : { show: false },
        markLine: !horizontal && linhaZero
          ? { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: tema.borda, width: 1 }, data: [{ yAxis: 0 }] }
          : undefined,
      },
    ];
  }

  const formatter = (params) => {
    const lista0 = Array.isArray(params) ? params : [params];
    if (!lista0.length) return '';
    const topo = escapar(nomeEixo(rotulosEixo[lista0[0].dataIndex]));
    const linhas = lista0
      .map((p) => {
        const s = lista[p.seriesIndex] ?? lista[0];
        const v = p.data !== null && typeof p.data === 'object' ? p.data.value : p.data;
        const cor = typeof p.color === 'string' ? p.color : resolverCor(s.cor);
        return linhaTooltip(tema, cor, s.rotulo, fmtValor(v), lista.length > 1);
      })
      .join('');
    return `<div style="font-size:12px;color:${escapar(tema.suave)};margin-bottom:2px">${topo}</div>${linhas}`;
  };

  const tooltip = {
    ...tooltipBase(tema, formatter),
    axisPointer:
      modo === 'linha'
        ? { type: 'line', lineStyle: { color: comOpacidade(tema.suave, 0.45), width: 1, type: 'solid' } }
        : { type: 'shadow', shadowStyle: { color: comOpacidade(tema.texto, 0.05) } },
  };

  return {
    animation: animar,
    animationDuration: 500,
    textStyle: { fontFamily: tema.fonte },
    grid: horizontal
      ? { left: 8, right: 56, top: 8, bottom: 8, containLabel: true }
      : { left: 8, right: 12, top: 12, bottom: rotulosX ? 8 : 6, containLabel: true },
    tooltip,
    xAxis: horizontal
      ? { ...eixoValores, show: false, splitLine: { show: false } }
      : eixoCategorias,
    yAxis: horizontal ? { ...eixoCategorias, inverse: true } : eixoValores,
    series,
  };
}
