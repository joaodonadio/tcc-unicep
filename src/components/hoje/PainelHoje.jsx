import { useAnaliseDoDia, useRecarregarAnalise } from '../../hooks/useAnalise.js';
import { diaMes, diaSemanaCurto } from '../../lib/datas.js';
import { semAbertura } from '../../lib/hoje.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import { DestaquesDoDia } from './DestaquesDoDia.jsx';
import { GraficoIbovespa } from './GraficoIbovespa.jsx';
import { NumerosDoDia } from './NumerosDoDia.jsx';
import { ResumoDoPregao } from './ResumoDoPregao.jsx';
import { ResumoNoticias } from './ResumoNoticias.jsx';
import { ResumoProventos } from './ResumoProventos.jsx';
import Top5Destaque from './Top5Destaque.jsx';

/**
 * Painel "Hoje", a tela inicial: o essencial do pregão em poucos blocos. Cada bloco
 * leva à página completa. Os dados vêm dos hooks de cada bloco e da análise do dia.
 */
export default function PainelHoje() {
  const { nivel } = usePreferencias();
  const { data, isPending, isError } = useAnaliseDoDia();
  const recarregar = useRecarregarAnalise();
  const resumo = data ? semAbertura(data.resumo_simples) : undefined;
  const temDestaques = isPending || (data?.painel_alertas?.volume?.itens ?? []).length > 0;

  const ref = data?.data_referencia;
  const titulo = ref ? porNivel(TEXTOS.hoje.titulo, nivel)(`${diaSemanaCurto(ref)}, ${diaMes(ref)}`) : porNivel(TEXTOS.hoje.tituloSemData, nivel);

  return (
    <div className="hoje">
      <Top5Destaque />

      <header className="hoje-topo">
        <h2 className="hoje-titulo">{titulo}</h2>

        {isError ? (
          <BlocoErro titulo={TEXTOS.hoje.erroTitulo} mensagem={TEXTOS.hoje.erro} onTentarNovamente={recarregar} mascote />
        ) : isPending ? (
          <Linhas quantidade={3} larguras={['100%', '94%', '72%']} />
        ) : (
          <ResumoDoPregao fatos={data?.fatos_pregao} resumo={resumo} />
        )}

      </header>

      <section className="hoje-secao hoje-secao--primeira" aria-labelledby="hoje-numeros-titulo">
        <h2 id="hoje-numeros-titulo" className="hoje-secao-titulo">
          {porNivel(TEXTOS.hoje.numeros, nivel)}
        </h2>
        <NumerosDoDia fatos={data?.fatos_pregao} dataPregao={data?.data_referencia} carregando={isPending} />
      </section>

      {/* sem volume incomum o bloco some: o gráfico ocupa a linha inteira, sem buraco na grade */}
      <div className={temDestaques ? 'hoje-secao hoje-duas' : 'hoje-secao'}>
        <GraficoIbovespa />
        <DestaquesDoDia alertas={data?.painel_alertas} carregando={isPending} />
      </div>

      <div className="hoje-secao hoje-trios">
        <ResumoProventos />
        <ResumoNoticias tom={data?.tom_noticias} sentimento={data?.sentimento_geral} carregando={isPending} />
      </div>
    </div>
  );
}
