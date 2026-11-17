import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { CandlestickChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { pct } from '../../lib/formato.js';
import { movimentoReduzido } from '../../lib/movimento.js';
import { TEXTOS } from '../../lib/textos.js';
import { temaGraficos } from '../../lib/temaGraficos.js';
import { sinalDaVariacao } from '../../lib/setores.js';
import { montarOpcaoVelas, velasDeitadas } from './opcoesVelas.js';
import { acompanharTamanho } from './redimensionar.js';

echarts.use([CandlestickChart, GridComponent, TooltipComponent, MarkLineComponent, SVGRenderer]);

/**
 * Gráfico de velas por setor (Apache ECharts, renderizador SVG): uma vela por item.
 *
 * `itens` = [{ rotulo, vela, n, inicio, fim }], em que `vela` é { abertura, fechamento, maxima, minima }
 * em fração (0.053 = +5,3%). O corpo vai da abertura ao fechamento; o pavio, da mínima à máxima.
 * Acessibilidade: o contêiner é uma imagem descrita e uma lista só para leitores de tela traz os valores de cada setor.
 */

const ALTURA_EM_PE = 360;
const ALTURA_EM_PE_MINIMA = 240;
const ALTURA_LINHA_DEITADA = 44;
// No celular a coluna do nome é estreita e ele pode ir a 3 linhas (mais a variação): a linha cresce.
const ALTURA_LINHA_ESTREITA = 60;
const LARGURA_ESTREITA = 480;
const ALTURA_EIXO_DEITADO = 40;

const formatarPadrao = (v) => pct(v);

const reduzirMovimento = () => movimentoReduzido();

export function GraficoVelas({ itens = [], formatar = formatarPadrao, descricao, altura }) {
  const alvoRef = useRef(null);
  const graficoRef = useRef(null);
  const [largura, setLargura] = useState(0);
  const temDados = itens.length > 0;
  // Sem medida ainda (primeira pintura ou jsdom), vale a largura de conforto.
  const larguraPorItem = temDados && largura > 0 ? Math.round(largura / itens.length) : 120;
  const deitado = velasDeitadas(larguraPorItem);
  // Deitado, a altura é a soma das linhas (sem espaço vazio); em pé, não passa de ~70% da altura da tela.
  const alturaTela = typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : Infinity;
  const alturaFinal = altura ?? (deitado
    ? itens.length * (largura < LARGURA_ESTREITA ? ALTURA_LINHA_ESTREITA : ALTURA_LINHA_DEITADA) + ALTURA_EIXO_DEITADO
    : Math.min(ALTURA_EM_PE, Math.max(ALTURA_EM_PE_MINIMA, Math.round(alturaTela * 0.7))));

  const opcao = useMemo(
    () =>
      temDados
        ? montarOpcaoVelas({ itens, formatar, tema: temaGraficos(), animar: !reduzirMovimento(), largura, larguraPorItem })
        : null,
    [temDados, itens, formatar, largura, larguraPorItem],
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

    // Girar o aparelho ou mudar a janela: esconde o balão aberto, mede e redimensiona.
    setLargura(alvo.clientWidth);
    const desligar = acompanharTamanho(alvo, grafico, (el) => setLargura(el.clientWidth));
    return () => {
      desligar();
      grafico.dispose();
      graficoRef.current = null;
    };
  }, [temDados]);

  // Só a primeira pintura anima: redesenhar ao girar o aparelho não repete a entrada das velas.
  // Sem largura medida ainda, espera: a 1ª pintura já sai no layout certo (em pé ou deitado).
  const jaDesenhouRef = useRef(false);
  useEffect(() => {
    if (!opcao || !graficoRef.current || largura === 0) return;
    try {
      graficoRef.current.setOption(jaDesenhouRef.current ? { ...opcao, animation: false } : opcao, true);
      jaDesenhouRef.current = true;
    } catch {
      /* sem desenho: a lista para leitores de tela segue disponível */
    }
  }, [opcao, largura]);

  if (!temDados) return null;

  const T = TEXTOS.setores.velas;
  const textoAria = descricao ?? T.descricao(itens.length);
  const palavraDoSinal = { alta: T.tooltip.subiu, queda: T.tooltip.caiu, estavel: T.tooltip.estavel };

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
              `${palavraDoSinal[sinalDaVariacao(i.vela.fechamento)]} ${formatar(i.vela.fechamento)}`,
              `${T.tooltip.maxima} ${formatar(i.vela.maxima)}`,
              `${T.tooltip.minima} ${formatar(i.vela.minima)}`,
            ].join('; ')}
          </li>
        ))}
      </ul>
    </div>
  );
}
