import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { dataBR } from '../../lib/datas.js';
import { brl } from '../../lib/formato.js';
import { movimentoReduzido } from '../../lib/movimento.js';
import { TEXTOS } from '../../lib/textos.js';
import { ariaDosEventos, marcasDosEventos } from '../../lib/eventosMercado.js';
import { montarOpcao } from './opcoesGrafico.js';
import { acompanharTamanho } from './redimensionar.js';

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
  trocaSuave = false,
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
  eventos = [],
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
  // eventos fora das datas somem; as marcas entram como [{ indice, marca }]
  const marcas = horizontal ? [] : marcasDosEventos(eventos, datas);
  const chaveMarcas = marcas.map((m) => `${m.indice}:${m.marca}`).join('|');

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
            trocaSuave,
            eventos: marcas,
          })
        : null,
    // formatar/formatarData costumam ser funções novas a cada render; os dados e o modo definem o desenho.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [temDados, lista, rotulosEixo, modo, linhaZero, eixo, rotulosX, corPorSinal, trocaSuave, chaveMarcas],
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
    const desligar = acompanharTamanho(alvo, grafico);
    return () => {
      desligar();
      grafico.dispose();
      graficoRef.current = null;
    };
  }, [temDados]);

  useEffect(() => {
    if (!opcao || !graficoRef.current) return;
    try {
      // trocaSuave mantém as séries pelo id: as que ficam deslizam e só a nova se desenha
      graficoRef.current.setOption(opcao, trocaSuave ? { replaceMerge: ['series'] } : true);
    } catch {
      /* sem desenho: a tabela segue disponível */
    }
  }, [opcao, temDados, trocaSuave]);

  if (!temDados) {
    // Sem `carregando` explícito, segue o comportamento antigo (esqueleto); com consulta terminada, mostra o vazio.
    if (carregando ?? true) {
      return <div className="esqueleto" style={{ height: `${altura / 16}rem`, marginTop: '1.125rem' }} />;
    }
    return <p className="grafico-vazio">{TEXTOS.grafico.semDados}</p>;
  }

  const textoBase = descricao
    ?? (horizontal
      ? TEXTOS.grafico.descricaoBarras(n)
      : series?.length
        ? `${lista.map((s) => TEXTOS.grafico.descricaoMulti(s.rotulo, formatar(primeiroFinito(s.valores)), formatar(ultimoFinito(s.valores)))).join('; ')}.`
        : TEXTOS.grafico.descricaoSerie(formatar(primeiroFinito(serie)), formatar(ultimoFinito(serie))));
  const textoAria = [textoBase, horizontal ? '' : ariaDosEventos(eventos, datas)].filter(Boolean).join(' ');

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
