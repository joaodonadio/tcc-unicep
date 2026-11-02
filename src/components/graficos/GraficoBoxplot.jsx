import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BoxplotChart, ScatterChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { pct } from '../../lib/formato.js';
import { movimentoReduzido } from '../../lib/movimento.js';
import { TEXTOS } from '../../lib/textos.js';
import { comOpacidade, resolverCor, temaGraficos } from '../../lib/temaGraficos.js';

echarts.use([BoxplotChart, ScatterChart, GridComponent, TooltipComponent, MarkLineComponent, SVGRenderer]);

/**
 * Gráfico de caixas horizontal (Apache ECharts, renderizador SVG): uma caixa por item.
 *
 * `itens` = [{ rotulo, estat }], em que `estat` é a saída de `quartis` (valores em fração, como 0.053 = +5,3%).
 * Caixa do 1º ao 3º quartil, traço na mediana, hastes até min e max, pontos para os atípicos.
 * Acessibilidade: o contêiner é uma imagem descrita e uma lista só para leitores de tela traz os cinco números de cada setor.
 */

const ALTURA_LINHA = 44;
const ALTURA_EXTRA = 60;
const COR_CAIXA = 'var(--cor-acento)';

const formatarPadrao = (v) => pct(v);

const escapar = (t) =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const reduzirMovimento = () => movimentoReduzido();

/** Cartão opaco do tooltip, acima do ponto (ou abaixo, se não couber), dentro da área. */
function posicaoTooltip(pt, _params, _dom, _rect, tamanho) {
  const [x, y] = pt;
  const [w, h] = tamanho.contentSize;
  const [vw] = tamanho.viewSize;
  const esquerda = Math.min(Math.max(x - w / 2, 4), Math.max(4, vw - w - 4));
  const acima = y - h - 14;
  return [esquerda, acima < 4 ? y + 14 : acima];
}

function montarOpcao({ itens, formatar, tema, animar }) {
  const T = TEXTOS.setores.dispersao;
  const rotulos = itens.map((i) => i.rotulo);
  const corCaixa = resolverCor(COR_CAIXA);
  const textoEixo = { color: tema.suave, fontFamily: tema.fonte, fontSize: 12 };

  const caixas = itens.map((i) => [i.estat.min, i.estat.q1, i.estat.mediana, i.estat.q3, i.estat.max]);
  const atipicos = itens.flatMap((i, idx) => i.estat.atipicos.map((v) => [v, idx]));

  const linha = (nome, valor, destaque = false) =>
    `<div style="display:flex;align-items:center;white-space:nowrap;margin-top:4px">`
    + `<span style="color:${escapar(tema.suave)};margin-right:12px">${escapar(nome)}</span>`
    + `<strong style="margin-left:auto;font-size:${destaque ? 15 : 13}px;font-weight:700;color:${escapar(tema.texto)};font-variant-numeric:tabular-nums">${escapar(valor)}</strong>`
    + `</div>`;

  const formatter = (p) => {
    if (p.seriesType === 'scatter') {
      const item = itens[p.value[1]];
      return `<div style="font-size:12px;color:${escapar(tema.suave)};margin-bottom:2px">${escapar(item.rotulo)}</div>`
        + `<div style="white-space:nowrap">${escapar(T.tooltip.atipico(formatar(p.value[0])))}</div>`;
    }
    const { estat, rotulo } = itens[p.dataIndex];
    return `<div style="font-size:12px;color:${escapar(tema.suave)};margin-bottom:2px">${escapar(rotulo)}`
      + ` · ${escapar(T.tooltip.acoes(estat.n))}</div>`
      + linha(T.tooltip.minimo, formatar(estat.min))
      + linha(T.tooltip.q1, formatar(estat.q1))
      + linha(T.tooltip.mediana, formatar(estat.mediana), true)
      + linha(T.tooltip.q3, formatar(estat.q3))
      + linha(T.tooltip.maximo, formatar(estat.max));
  };

  return {
    animation: animar,
    animationDuration: 500,
    textStyle: { fontFamily: tema.fonte },
    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'item',
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
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { ...textoEixo, formatter: (v) => pct(v, { casas: 0 }), hideOverlap: true },
      splitNumber: 4,
      splitLine: { show: true, lineStyle: { color: tema.fio, type: 'dotted', width: 1, opacity: 0.5 } },
    },
    yAxis: {
      type: 'category',
      data: rotulos,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { ...textoEixo, interval: 0, width: 128, overflow: 'break' },
    },
    series: [
      {
        name: T.tabela,
        type: 'boxplot',
        data: caixas,
        boxWidth: [8, 26],
        itemStyle: {
          color: comOpacidade(corCaixa, 0.28),
          borderColor: corCaixa,
          borderWidth: 2,
        },
        emphasis: { itemStyle: { borderWidth: 3 } },
        // Linha do zero: referência para saber se o setor subiu ou caiu.
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { color: tema.borda, type: 'solid', width: 1 },
          data: [{ xAxis: 0 }],
        },
      },
      {
        name: T.legendaAtipico,
        type: 'scatter',
        data: atipicos,
        symbolSize: 7,
        itemStyle: { color: tema.fundo, borderColor: corCaixa, borderWidth: 2 },
        emphasis: { scale: true },
      },
    ],
  };
}

export function GraficoBoxplot({ itens = [], formatar = formatarPadrao, descricao, altura }) {
  const alvoRef = useRef(null);
  const graficoRef = useRef(null);
  const temDados = itens.length > 0;
  const alturaFinal = altura ?? itens.length * ALTURA_LINHA + ALTURA_EXTRA;

  const opcao = useMemo(
    () => (temDados ? montarOpcao({ itens, formatar, tema: temaGraficos(), animar: !reduzirMovimento() }) : null),
    [temDados, itens, formatar],
  );

  // Cria o gráfico uma vez por montagem do contêiner; sem suporte de desenho (jsdom), cai para só a lista.
  useEffect(() => {
    const alvo = alvoRef.current;
    if (!alvo || !temDados) return undefined;
    let grafico = null;
    try {
      grafico = echarts.init(alvo, null, { renderer: 'svg' });
    } catch {
      graficoRef.current = null;
      return undefined;
    }
    graficoRef.current = grafico;
    let observador = null;
    if (typeof ResizeObserver !== 'undefined') {
      observador = new ResizeObserver(() => grafico.resize());
      observador.observe(alvo);
    }
    return () => {
      observador?.disconnect();
      grafico.dispose();
      graficoRef.current = null;
    };
  }, [temDados]);

  useEffect(() => {
    if (!opcao || !graficoRef.current) return;
    try {
      graficoRef.current.setOption(opcao, true);
    } catch {
      /* sem desenho: a lista para leitores de tela segue disponível */
    }
  }, [opcao]);

  if (!temDados) return null;

  const T = TEXTOS.setores.dispersao;
  const textoAria = descricao ?? T.descricao(itens.length);

  return (
    <div className="chart-bloco">
      <div
        ref={alvoRef}
        className="chart-stage"
        role="img"
        aria-label={textoAria}
        style={{ height: `${alturaFinal / 16}rem` }}
      />

      <ul className="sr-only" aria-label={T.tabela}>
        {itens.map((i) => (
          <li key={i.rotulo}>
            <span>{i.rotulo}</span>
            {': '}
            {[
              `${T.tooltip.minimo} ${formatar(i.estat.min)}`,
              `${T.tooltip.q1} ${formatar(i.estat.q1)}`,
              `${T.tooltip.mediana} ${formatar(i.estat.mediana)}`,
              `${T.tooltip.q3} ${formatar(i.estat.q3)}`,
              `${T.tooltip.maximo} ${formatar(i.estat.max)}`,
            ].join('; ')}
          </li>
        ))}
      </ul>
    </div>
  );
}
