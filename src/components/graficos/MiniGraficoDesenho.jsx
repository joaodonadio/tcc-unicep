import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, EffectScatterChart, LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { movimentoReduzido } from '../../lib/movimento.js';
import { lerToken, resolverCor } from '../../lib/temaGraficos.js';
import { montarOpcaoMini } from './opcoesMiniGrafico.js';
import { acompanharTamanho } from './redimensionar.js';

echarts.use([LineChart, BarChart, EffectScatterChart, ScatterChart, GridComponent, TooltipComponent, MarkLineComponent, SVGRenderer]);

const COR_PADRAO = 'var(--cor-serie-1)';

/**
 * Desenho do mini gráfico, carregado sob demanda pelo MiniGrafico; ocupa todo o contêiner do pai.
 * Sem suporte de desenho (jsdom), não desenha e não quebra: o pai já tem a descrição.
 * Só os pontos dependem da largura (tamanho de cada ponto): esperam a medida para o primeiro desenho.
 */
export function MiniGraficoDesenho({ tipo, valores, cor, cores, altura, faixaExata = false, interativo = false, datas, formatarValor, degraus = false, marcas }) {
  const alvoRef = useRef(null);
  const graficoRef = useRef(null);
  const [largura, setLargura] = useState(0);
  const [alturaMedida, setAlturaMedida] = useState(0);
  // as listas costumam chegar novas a cada render: o conteúdo é que define o desenho
  const chaveValores = valores.join('|');
  const chaveCores = (cores ?? []).join('|');
  const chaveDatas = (datas ?? []).join('|');
  const chaveMarcas = (marcas ?? []).map((m) => `${m.indice}:${m.marca}`).join('|');
  // fora dos pontos a largura não entra: redimensionar não refaz a opção (nem repete a animação)
  const larguraUsada = tipo === 'pontos' ? largura : 0;
  // os pontos se espalham na altura real do contêiner, que pode crescer com o cartão
  const alturaUsada = tipo === 'pontos' ? Math.max(alturaMedida, altura) : altura;

  const opcao = useMemo(
    () =>
      montarOpcaoMini({
        tipo,
        valores,
        cor: resolverCor(cor ?? COR_PADRAO),
        cores: (cores ?? []).map((c) => resolverCor(c)),
        fundo: lerToken('--cor-fundo'),
        suave: lerToken('--cor-texto-suave'),
        animar: !movimentoReduzido(),
        largura: larguraUsada || null,
        altura: alturaUsada,
        faixaExata,
        interativo,
        datas: datas ?? [],
        formatarValor,
        degraus,
        marcas: marcas ?? [],
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tipo, chaveValores, cor, chaveCores, larguraUsada, alturaUsada, faixaExata, interativo, chaveDatas, formatarValor, degraus, chaveMarcas],
  );

  // cria o gráfico uma vez por montagem e mede a largura; sem suporte de desenho, fica vazio
  useEffect(() => {
    const alvo = alvoRef.current;
    if (!alvo) return undefined;
    let grafico = null;
    try {
      grafico = echarts.init(alvo, null, { renderer: 'svg' });
    } catch {
      graficoRef.current = null;
      return undefined;
    }
    graficoRef.current = grafico;
    const medir = () => {
      setLargura(Math.round(alvo.clientWidth));
      setAlturaMedida(Math.round(alvo.clientHeight));
    };
    medir();
    const desligar = acompanharTamanho(alvo, grafico, medir);
    return () => {
      desligar();
      grafico.dispose();
      graficoRef.current = null;
    };
  }, []);

  useEffect(() => {
    const grafico = graficoRef.current;
    if (!grafico) return;
    // pontos sem largura medida esperam: o primeiro desenho já sai no tamanho certo
    if (tipo === 'pontos' && !larguraUsada) return;
    try {
      // sem notMerge: ao redimensionar, os pontos só mudam de tamanho, sem repetir a entrada
      grafico.setOption(opcao);
    } catch {
      /* sem desenho: a descrição do contêiner segue valendo */
    }
  }, [opcao, tipo, larguraUsada]);

  return <div ref={alvoRef} style={{ width: '100%', height: '100%' }} aria-hidden="true" />;
}
