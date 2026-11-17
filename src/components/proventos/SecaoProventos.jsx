import { useMemo } from "react";
import { ChartColumn, HandCoins } from "lucide-react";
import { ResumoProventos } from "./ResumoProventos.jsx";
import { AgendaProventos } from "./AgendaProventos.jsx";
import { GraficoPagamentos } from "./GraficoPagamentos.jsx";
import { RankingPagadoras } from "./RankingPagadoras.jsx";
import { useAgendaProventos } from "../../hooks/useAgenda.js";
import { useAcoes, useResumos } from "../../hooks/useDados.js";
import { maioresPagadoras, pagamentosPorMes } from "../../lib/proventosTela.js";
import { usePreferencias } from "../../context/contextos.js";
import { TEXTOS, porNivel } from "../../lib/textos.js";

/**
 * Seção "Proventos": resumo com a linha do tempo, próximos pagamentos à esquerda
 * e, à direita, pagamentos por mês e o ranking de quem mais pagou. Sempre
 * renderizada; cada bloco cuida do próprio carregamento e erro.
 */
export default function SecaoProventos({ nivelTitulo = 2 }) {
  const { nivel } = usePreferencias();
  const Titulo = `h${nivelTitulo}`;
  const Sub = `h${nivelTitulo + 1}`;
  const agenda = useAgendaProventos();
  const resumos = useResumos();
  const acoes = useAcoes();

  const futuros = agenda.data?.futuros;
  const grafico = useMemo(
    () => pagamentosPorMes(futuros, agenda.hoje),
    [futuros, agenda.hoje],
  );

  const aDefinir = agenda.data?.a_definir;
  // eventos do calendário da faixa de resumo: pagamentos marcados e datas a definir
  const eventos = useMemo(
    () => [...(futuros ?? []), ...(aDefinir ?? [])],
    [futuros, aDefinir],
  );

  const ranking = useMemo(
    () => maioresPagadoras(resumos.data, acoes.data),
    [resumos.data, acoes.data],
  );
  const erroRanking = resumos.error ?? acoes.error ?? null;
  const carregandoRanking =
    !erroRanking && (resumos.isPending || acoes.isPending);

  return (
    <section
      id="proventos"
      className="secao proventos"
      aria-labelledby="proventos-titulo"
    >
      <div className="proventos-topo">
        <Titulo id="proventos-titulo" className="proventos-titulo">
          {porNivel(TEXTOS.proventos.titulo, nivel)}
        </Titulo>
        <p className="proventos-intro">
          {porNivel(TEXTOS.proventos.intro, nivel)}
        </p>
      </div>

      <div className="proventos-faixa">
        <ResumoProventos
          futuros={futuros}
          aDefinir={aDefinir}
          hoje={agenda.hoje}
          eventos={eventos}
          ranking={ranking}
          carregando={agenda.isPending}
        />
      </div>

      <div className="proventos-faixa proventos-duas">
        <AgendaProventos nivelTitulo={nivelTitulo + 1} />

        <div className="proventos-coluna">
          <section
            className="proventos-bloco proventos-grafico-cartao"
            aria-labelledby="proventos-grafico-titulo"
          >
            <Sub
              id="proventos-grafico-titulo"
              className="proventos-bloco-titulo proventos-com-icone"
            >
              <ChartColumn size={22} aria-hidden="true" />
              <span>{porNivel(TEXTOS.proventos.graficoTitulo, nivel)}</span>
            </Sub>
            <p className="proventos-como-ler">
              {TEXTOS.proventos.comoLer.grafico}
            </p>
            <GraficoPagamentos
              datas={grafico.datas}
              valores={grafico.valores}
              carregando={agenda.isPending}
              erro={agenda.isError}
            />
          </section>

          <section
            className="proventos-bloco"
            aria-labelledby="proventos-ranking-titulo"
          >
            <Sub
              id="proventos-ranking-titulo"
              className="proventos-bloco-titulo proventos-com-icone"
            >
              <HandCoins size={22} aria-hidden="true" />
              <span>{porNivel(TEXTOS.proventos.rankingTitulo, nivel)}</span>
            </Sub>
            <RankingPagadoras
              ranking={ranking}
              carregando={carregandoRanking}
              erro={erroRanking}
              onTentarNovamente={() => {
                resumos.refetch();
                acoes.refetch();
              }}
            />
          </section>
        </div>
      </div>
    </section>
  );
}
