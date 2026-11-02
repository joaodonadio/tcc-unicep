import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { dataBR } from '../../lib/datas.js';
import { brl } from '../../lib/formato.js';
import { movimentoReduzido } from '../../lib/movimento.js';
import { TEXTOS } from '../../lib/textos.js';
import { montarOpcao } from './opcoesGrafico.js';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, MarkLineComponent, SVGRenderer]);

/**
 * Gráfico de linha ou barras (Apache ECharts, renderizador SVG).
 *
 * Aceita uma série (`serie`) ou várias (`series`) alinhadas às mesmas `datas`
 * ("AAAA-MM-DD"). Valor ausente quebra a linha; nunca vira 0. Modo `barras`
 * usa só a primeira série; `barrasHorizontais` usa `categorias` no lugar de
 * `datas` (uma barra por categoria, verde para positivo e rosa para negativo).
 * Acessibilidade: o contêiner é uma imagem descrita e uma tabela só para
 * leitores de tela traz os dados (no máximo os últimos 60 pontos).
 */

const ALTURA_PADRAO = 220;
const MAX_LINHAS_TABELA = 60;
const CORES = ['var(--cor-dado-1)', 'var(--cor-dado-2)', 'var(--cor-dado-3)'];

const finito = (v) => typeof v === 'number' && Number.isFinite(v);
const primeiroFinito = (valores) => valores.find(finito);
const ultimoFinito = (valores) => [...valores].reverse().find(finito);

const reduzirMovimento = () => movimentoReduzido();

export function GraficoInterativo({
  serie = [],
  datas = [],
  categorias,
  carregando,
  series,
  modo = 'linha',
  formatar = brl,
  formatarData = dataBR,
  descricao,
  linhaZero = false,
  eixo = true,
  rotulosX = false,
  notaLegenda,
  altura = ALTURA_PADRAO,
  corPorSinal = false,
}) {
  const alvoRef = useRef(null);
  const graficoRef = useRef(null);
  const horizontal = modo === 'barrasHorizontais';

  const lista = useMemo(
    () =>
      (series?.length ? series : [{ id: 'principal', rotulo: TEXTOS.grafico.rotuloPadrao, valores: serie }]).map((s, i) => ({
        ...s,
        id: s.id ?? String(i),
        valores: s.valores ?? [],
        cor: s.cor ?? CORES[i % CORES.length],
      })),
    [series, serie],
  );
  const n = Math.max(0, ...lista.map((s) => s.valores.length));
  const rotulosEixo = horizontal ? (categorias ?? []) : datas;
  const temDados = horizontal ? n >= 1 : n >= 2 && lista.some((s) => s.valores.filter(finito).length >= 2);

  const opcao = useMemo(
    () =>
      temDados
        ? montarOpcao({
            lista,
            rotulosEixo,
            modo,
            formatar,
            formatarData,
            linhaZero,
            eixo,
            rotulosX,
            corPorSinal,
            animar: !reduzirMovimento(),
          })
        : null,
    // formatar/formatarData costumam ser funções novas a cada render; os dados e o modo definem o desenho.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [temDados, lista, rotulosEixo, modo, linhaZero, eixo, rotulosX, corPorSinal],
  );

  // Cria o gráfico uma vez por montagem do contêiner; sem suporte de desenho (jsdom), cai para só a tabela.
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
      /* sem desenho: a tabela segue disponível */
    }
  }, [opcao, temDados]);

  if (!temDados) {
    // Sem `carregando` explícito, segue o comportamento antigo (esqueleto); com consulta terminada, mostra o vazio.
    if (carregando ?? true) {
      return <div className="esqueleto" style={{ height: `${altura / 16}rem`, marginTop: '1.125rem' }} />;
    }
    return <p className="grafico-vazio">{TEXTOS.grafico.semDados}</p>;
  }

  const textoAria = descricao
    ?? (horizontal
      ? TEXTOS.grafico.descricaoBarras(n)
      : series?.length
        ? `${lista.map((s) => TEXTOS.grafico.descricaoMulti(s.rotulo, formatar(primeiroFinito(s.valores)), formatar(ultimoFinito(s.valores)))).join('; ')}.`
        : TEXTOS.grafico.descricaoSerie(formatar(primeiroFinito(serie)), formatar(ultimoFinito(serie))));

  const inicio = Math.max(0, n - MAX_LINHAS_TABELA);
  const indices = Array.from({ length: n - inicio }, (_, k) => inicio + k);
  const rotuloLinha = (i) => (horizontal ? String(rotulosEixo[i] ?? '') : formatarData(rotulosEixo[i]));

  return (
    <div className="chart-bloco">
      <div
        ref={alvoRef}
        className="chart-stage"
        role="img"
        aria-label={textoAria}
        style={{ height: `${altura / 16}rem`, opacity: carregando === true ? 0.55 : undefined }}
      />

      <ul className="sr-only" aria-label={TEXTOS.grafico.tabelaLegenda}>
        {indices.map((i) => (
          <li key={i}>
            <span>{rotuloLinha(i)}</span>
            {': '}
            {lista
              .map((s) => {
                const v = finito(s.valores[i]) ? formatar(s.valores[i]) : TEXTOS.grafico.semDado;
                return lista.length > 1 ? TEXTOS.grafico.dupla(s.rotulo, v) : v;
              })
              .join('; ')}
          </li>
        ))}
      </ul>

      {(lista.length > 1 || notaLegenda) && (
        <ul className="chart-legenda">
          {lista.length > 1 &&
            lista.map((s) => (
              <li key={s.id}>
                <i
                  data-tracejada={s.tracejada ? 'true' : undefined}
                  style={{ '--cor': s.cor }}
                  aria-hidden="true"
                />
                {s.rotulo}
              </li>
            ))}
          {notaLegenda && <li className="chart-legenda-nota">{notaLegenda}</li>}
        </ul>
      )}
    </div>
  );
}
