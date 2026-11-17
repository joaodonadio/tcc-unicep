import { TEXTOS } from '../../lib/textos.js';
import { comOpacidade } from '../../lib/temaGraficos.js';
import { animacaoGrafico, transicaoBalao } from '../../lib/animacaoGraficos.js';
import { sinalDaVariacao } from '../../lib/setores.js';
import { dataBR } from '../../lib/datas.js';

/**
 * Opções do gráfico de velas por setor (função pura, testável).
 * Uma vela por setor: corpo do começo ao fim do período, pavio na máxima e na mínima.
 * Em tela larga os setores ficam no eixo X (em pé); em tela estreita, no eixo Y (deitado),
 * para que cada nome caiba inteiro na linha do setor.
 */

// Abaixo dessa largura por setor a vela deita (setores no eixo Y) e nenhum nome gira nem é cortado.
export const LARGURA_VELA_EM_PE = 96;
export const velasDeitadas = (larguraPorItem) => larguraPorItem < LARGURA_VELA_EM_PE;
// Coluna dos nomes com a vela deitada: cerca de 1/3 da largura, entre 88 e 150 px; o nome quebra em linhas.
export const larguraRotuloDeitado = (largura) => Math.min(150, Math.max(88, Math.round(largura * 0.34)));

// Largura média de uma letra do rótulo (12 px de Atkinson), para quebrar o nome entre palavras.
const LARGURA_LETRA = 6.6;

/**
 * Quebra o nome do setor em linhas de até `maximo` letras, sempre entre palavras: o ECharts ignora
 * a quebra de linha do texto rico quando ele mesmo quebra, e a variação grudava no nome.
 */
export function quebrarNome(nome, maximo) {
  const linhas = [];
  for (const palavra of String(nome).split(/\s+/).filter(Boolean)) {
    const ultima = linhas.at(-1);
    if (ultima != null && `${ultima} ${palavra}`.length <= maximo) linhas[linhas.length - 1] = `${ultima} ${palavra}`;
    else linhas.push(palavra);
  }
  return linhas.length ? linhas : [''];
}

const escapar = (t) =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Cartão opaco do tooltip, acima do ponto (ou abaixo, se não couber), dentro da área. */
function posicaoTooltip(pt, _params, _dom, _rect, tamanho) {
  const [x, y] = pt;
  const [w, h] = tamanho.contentSize;
  const [vw] = tamanho.viewSize;
  const esquerda = Math.min(Math.max(x - w / 2, 4), Math.max(4, vw - w - 4));
  const acima = y - h - 14;
  return [esquerda, acima < 4 ? y + 14 : acima];
}

export function montarOpcaoVelas({ itens, formatar, tema, animar, largura = 0, larguraPorItem = 120 }) {
  const T = TEXTOS.setores.velas;
  const deitado = velasDeitadas(larguraPorItem);
  const rotulos = itens.map((i) => i.rotulo);
  // Ordem do ECharts para candlestick: abertura, fechamento, mínima, máxima.
  const dados = itens.map((i) => [i.vela.abertura, i.vela.fechamento, i.vela.minima, i.vela.maxima]);

  const linha = (nome, valor, destaque = false) =>
    `<div style="display:flex;align-items:center;white-space:nowrap;margin-top:4px">`
    + `<span style="color:${escapar(tema.suave)};margin-right:12px">${escapar(nome)}</span>`
    + `<strong style="margin-left:auto;font-family:${escapar(tema.fonte)};font-size:${destaque ? 15 : 14}px;font-weight:500;letter-spacing:-0.02em;color:${escapar(tema.texto)};font-variant-numeric:tabular-nums slashed-zero">${escapar(valor)}</strong>`
    + `</div>`;

  const formatter = (params) => {
    const p = Array.isArray(params) ? params[0] : params;
    const i = itens[p?.dataIndex];
    if (!i) return '';
    const { vela } = i;
    const chaveSinal = { alta: 'subiu', queda: 'caiu', estavel: 'estavel' }[sinalDaVariacao(vela.fechamento)];
    const cabeca = `<div style="font-size:12px;color:${escapar(tema.suave)};margin-bottom:2px">`
      + `${escapar(i.rotulo)} · ${escapar(T.tooltip.acoes(i.n))}</div>`;
    const periodo = i.inicio && i.fim
      ? `<div style="font-size:12px;color:${escapar(tema.suave)}">${escapar(T.tooltip.periodo(dataBR(i.inicio), dataBR(i.fim)))}</div>`
      : '';
    return cabeca
      + periodo
      + linha(T.tooltip[chaveSinal], formatar(vela.fechamento), true)
      + linha(T.tooltip.comeco, formatar(vela.abertura))
      + linha(T.tooltip.maxima, formatar(vela.maxima))
      + linha(T.tooltip.minima, formatar(vela.minima))
      + `<div style="font-size:12px;color:${escapar(tema.suave)};margin-top:6px">${escapar(T.tooltip.nota)}</div>`;
  };

  // Rótulo do setor: nome, e embaixo a variação com sinal (a palavra e o sinal dizem a direção, não só a cor).
  const rich = {
    nome: { color: tema.suave, fontFamily: tema.fonteTexto, fontSize: 12, lineHeight: 15 },
    alta: { color: tema.alta, fontFamily: tema.fonte, fontSize: 12, lineHeight: 15, fontWeight: 500 },
    queda: { color: tema.queda, fontFamily: tema.fonte, fontSize: 12, lineHeight: 15, fontWeight: 500 },
    estavel: { color: tema.suave, fontFamily: tema.fonte, fontSize: 12, lineHeight: 15, fontWeight: 500 },
  };
  const larguraRotulo = deitado ? larguraRotuloDeitado(largura) : larguraPorItem - 8;
  const formatarRotulo = (nome) => {
    const i = itens.find((x) => x.rotulo === nome);
    const linhas = quebrarNome(String(nome).replace(/[{}|]/g, ''), Math.floor(larguraRotulo / LARGURA_LETRA));
    const nomeRico = linhas.map((l) => `{nome|${l}}`).join('\n');
    return i ? `${nomeRico}\n{${sinalDaVariacao(i.vela.fechamento)}|${formatar(i.vela.fechamento)}}` : nomeRico;
  };

  const eixoSetores = {
    type: 'category',
    data: rotulos,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: {
      interval: 0,
      rotate: 0,
      rich,
      formatter: formatarRotulo,
      ...(deitado
        ? { align: 'right', margin: 10 }
        : { align: 'center', margin: 12 }),
    },
    ...(deitado ? { inverse: true } : {}),
  };

  const eixoValores = {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: tema.suave, fontFamily: tema.fonte, fontSize: 12, formatter: (v) => formatar(v), hideOverlap: true },
    splitNumber: deitado ? 3 : 4,
    splitLine: { show: true, lineStyle: { color: tema.fio, type: 'dotted', width: 1, opacity: 0.5 } },
  };

  return {
    ...animacaoGrafico(animar),
    textStyle: { fontFamily: tema.fonteTexto },
    grid: { left: 4, right: deitado ? 16 : 8, top: deitado ? 8 : 16, bottom: 4, containLabel: true },
    tooltip: {
      ...transicaoBalao(animar),
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      triggerOn: 'mousemove|click',
      enterable: false,
      confine: true,
      backgroundColor: tema.superficie,
      borderColor: tema.borda,
      borderWidth: 1,
      borderRadius: 12,
      padding: [10, 12],
      textStyle: { color: tema.texto, fontFamily: tema.fonteTexto, fontSize: 13 },
      extraCssText: 'z-index:1000;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.55);',
      position: posicaoTooltip,
      formatter,
    },
    xAxis: deitado ? eixoValores : eixoSetores,
    yAxis: deitado ? eixoSetores : eixoValores,
    series: [
      {
        name: T.tabela,
        type: 'candlestick',
        data: dados,
        barMaxWidth: deitado ? 18 : 28,
        barMinWidth: 8,
        itemStyle: {
          color: comOpacidade(tema.alta, 0.35),
          color0: comOpacidade(tema.queda, 0.35),
          borderColor: tema.alta,
          borderColor0: tema.queda,
          borderColorDoji: tema.suave,
          borderWidth: 2,
        },
        emphasis: { itemStyle: { borderWidth: 3 } },
        // Linha do zero: referência para saber se o setor subiu ou caiu.
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { color: tema.borda, type: 'solid', width: 1 },
          data: [deitado ? { xAxis: 0 } : { yAxis: 0 }],
        },
      },
    ],
  };
}
