import { Volume2 } from 'lucide-react';
import { useAnaliseDoDia, useRecarregarAnalise } from '../../hooks/useAnalise.js';
import { useLeituraEmVoz } from '../../hooks/useLeituraEmVoz.js';
import { diaMes, diaSemanaCurto } from '../../lib/datas.js';
import { semAbertura } from '../../lib/hoje.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import { DestaquesDoDia } from './DestaquesDoDia.jsx';
import { GraficoIbovespa } from './GraficoIbovespa.jsx';
import { NumerosDoDia } from './NumerosDoDia.jsx';
import { ResumoMinhaLista } from './ResumoMinhaLista.jsx';
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
  const voz = useLeituraEmVoz(resumo);

  const ref = data?.data_referencia;
  const titulo = ref ? porNivel(TEXTOS.hoje.titulo, nivel)(`${diaSemanaCurto(ref)}, ${diaMes(ref)}`) : porNivel(TEXTOS.hoje.tituloSemData, nivel);

  return (
    <div className="hoje">
      <Top5Destaque />

      <header className="hoje-topo">
        <h2 className="hoje-titulo">{titulo}</h2>

        {isError ? (
          <BlocoErro titulo={TEXTOS.hoje.erroTitulo} mensagem={TEXTOS.hoje.erro} onTentarNovamente={recarregar} />
        ) : isPending ? (
          <Linhas quantidade={3} larguras={['100%', '94%', '72%']} />
        ) : (
          <>
            <p className="hoje-resumo">{resumo}</p>
            {voz.disponivel && (
              <button
                type="button"
                className="botao hoje-ouvir"
                onClick={voz.alternar}
              >
                <Volume2 size={16} aria-hidden="true" focusable="false" />
                {voz.falando ? TEXTOS.hoje.parar : TEXTOS.hoje.ouvir}
              </button>
            )}
          </>
        )}

      </header>

      <section className="hoje-secao hoje-secao--primeira" aria-labelledby="hoje-numeros-titulo">
        <h2 id="hoje-numeros-titulo" className="hoje-secao-titulo">
          {porNivel(TEXTOS.hoje.numeros, nivel)}
        </h2>
        <NumerosDoDia fatos={data?.fatos_pregao} dataPregao={data?.data_referencia} carregando={isPending} />
      </section>

      <div className="hoje-secao hoje-duas">
        <GraficoIbovespa />
        <DestaquesDoDia alertas={data?.painel_alertas} carregando={isPending} />
      </div>

      <div className="hoje-secao hoje-trios">
        <ResumoProventos />
        <ResumoNoticias tom={data?.tom_noticias} sentimento={data?.sentimento_geral} carregando={isPending} />
        <ResumoMinhaLista acoes={data?.acoes_pregao} carregando={isPending} />
      </div>
    </div>
  );
}
