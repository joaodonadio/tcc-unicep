import { useMemo } from 'react';
import { GraficoInterativo } from '../graficos/GraficoInterativo.jsx';
import { BlocoErro, BlocoVazio, Linhas } from '../ui/Estados.jsx';
import { usePreferencias } from '../../context/contextos.js';
import { useFundamentos } from '../../hooks/useDados.js';
import { seriesDoBalanco } from '../../lib/balancos.js';
import { rotuloTrimestre } from '../../lib/datas.js';
import { brlCompacto, vezes } from '../../lib/formato.js';
import { TEXTOS } from '../../lib/textos.js';

/**
 * Gráficos de balanço das perguntas da ficha. `qual="resultado"` (pergunta
 * "Está cara?") mostra receita e lucro em 12 meses; `qual="divida"` (pergunta
 * "Ela deve muito?") mostra a dívida líquida sobre o EBITDA.
 */
/** Posição do último valor numérico de uma lista, ou -1. */
const ultimoIndice = (valores) => valores.findLastIndex((v) => Number.isFinite(v));

/** Frase de leitura do gráfico de resultado, do último balanço; sem receita, null. */
function fraseResultado(series) {
  const F = TEXTOS.ficha.frases;
  const i = ultimoIndice(series.receita12m);
  if (i < 0) return null;
  const tri = rotuloTrimestre(series.datas[i]);
  const receita = brlCompacto(series.receita12m[i]);
  const lucro = series.lucro12m[i];
  return Number.isFinite(lucro) ? F.resultado(tri, receita, brlCompacto(lucro)) : F.resultadoSoReceita(tri, receita);
}

/** Frase de leitura do gráfico de dívida sobre EBITDA, com o valor de um ano antes quando existe. */
function fraseDivida(series) {
  const F = TEXTOS.ficha.frases;
  const i = ultimoIndice(series.dlEbitda);
  if (i < 0) return null;
  const atual = series.dlEbitda[i];
  const tri = rotuloTrimestre(series.datas[i]);
  const base = atual < 0 ? F.dividaCaixa(tri) : F.dividaVezes(tri, vezes(atual));
  const antes = series.dlEbitda[i - 4];
  return Number.isFinite(antes) && antes >= 0
    ? `${base} ${F.dividaAnterior(rotuloTrimestre(series.datas[i - 4]), vezes(antes))}`
    : base;
}

export function GraficosBalanco({ ticker, qual }) {
  const { nivel } = usePreferencias();
  const simples = nivel !== 'tecnico';
  const altura = simples ? undefined : 160;
  const fundamentos = useFundamentos(ticker);
  const series = useMemo(() => seriesDoBalanco(fundamentos.data), [fundamentos.data]);

  if (fundamentos.isError) {
    return (
      <BlocoErro
        titulo={TEXTOS.ficha.balancosIndisponiveis}
        mensagem={fundamentos.error?.mensagemUsuario}
        onTentarNovamente={fundamentos.refetch}
      />
    );
  }
  if (fundamentos.isPending) return <Linhas quantidade={4} />;
  if (series.datas.length === 0) return <BlocoVazio titulo={TEXTOS.ficha.semBalancos} />;

  if (qual === 'divida') {
    return (
      <section className="ficha-grafico ficha-grafico--balanco" aria-labelledby="ficha-balanco-divida-titulo">
        <h3 id="ficha-balanco-divida-titulo" className="ficha-grafico-titulo">
          {TEXTOS.ficha.dividaEbitdaTitulo}
        </h3>
        {simples && fraseDivida(series) && <p className="ficha-leitura-frase">{fraseDivida(series)}</p>}
        {simples && <p className="ficha-grafico-texto">{TEXTOS.ficha.dividaEbitdaTexto}</p>}
        <GraficoInterativo
          series={[
            { id: 'dl_ebitda', rotulo: TEXTOS.ficha.dividaEbitdaSerie, valores: series.dlEbitda, cor: 'var(--cor-serie-1)' },
          ]}
          datas={series.datas}
          modo="barras"
          formatar={vezes}
          formatarData={rotuloTrimestre}
          linhaZero
          rotulosX
          altura={altura}
          carregando={fundamentos.isPending}
        />
      </section>
    );
  }

  return (
    <section className="ficha-grafico ficha-grafico--balanco" aria-labelledby="ficha-balanco-resultado-titulo">
      <h3 id="ficha-balanco-resultado-titulo" className="ficha-grafico-titulo">
        {TEXTOS.ficha.resultadoTitulo}
      </h3>
      {simples && fraseResultado(series) && <p className="ficha-leitura-frase">{fraseResultado(series)}</p>}
      <GraficoInterativo
        series={[
          { id: 'receita', rotulo: TEXTOS.ficha.receitaSerie, valores: series.receita12m, cor: 'var(--cor-serie-1)' },
          { id: 'lucro', rotulo: TEXTOS.ficha.lucroSerie, valores: series.lucro12m, cor: 'var(--cor-serie-2)' },
        ]}
        datas={series.datas}
        formatar={brlCompacto}
        formatarData={rotuloTrimestre}
        linhaZero
        rotulosX
        altura={altura}
        carregando={fundamentos.isPending}
      />
    </section>
  );
}
