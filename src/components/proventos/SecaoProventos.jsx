import { useMemo } from 'react';
import { ChartColumn, Trophy } from 'lucide-react';
import { AlertasProventos } from './AlertasProventos.jsx';
import { CalendarioProventos } from './CalendarioProventos.jsx';
import { ComoFunciona } from './ComoFunciona.jsx';
import { AgendaProventos } from '../inicio/AgendaProventos.jsx';
import { GraficoPagamentos } from './GraficoPagamentos.jsx';
import { TabelaMaioresPagadoras } from './TabelaMaioresPagadoras.jsx';
import { useAgendaProventos } from '../../hooks/useAgenda.js';
import { useAcoes, useResumos } from '../../hooks/useDados.js';
import { maioresPagadoras, pagamentosPorMes } from '../../lib/proventosTela.js';
import { alertasDeProventos } from '../../lib/agenda.js';
import { usePreferencias, useMinhaLista } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/**
 * Seção "Proventos": como funciona, avisos e calendário, agenda dos próximos
 * pagamentos, gráfico por mês e ranking de quem mais pagou. Sempre renderizada;
 * cada bloco cuida do próprio carregamento e erro.
 */
export default function SecaoProventos({ nivelTitulo = 2 }) {
  const { nivel } = usePreferencias();
  const lista = useMinhaLista();
  const Titulo = `h${nivelTitulo}`;
  const Sub = `h${nivelTitulo + 1}`;
  const agenda = useAgendaProventos();
  const resumos = useResumos();
  const acoes = useAcoes();

  const futuros = agenda.data?.futuros;
  const grafico = useMemo(() => pagamentosPorMes(futuros, agenda.hoje), [futuros, agenda.hoje]);

  const aDefinir = agenda.data?.a_definir;
  const alertas = useMemo(
    () => alertasDeProventos([...(futuros ?? []), ...(aDefinir ?? [])], agenda.hoje, lista.tickers),
    [futuros, aDefinir, agenda.hoje, lista.tickers],
  );

  const ranking = useMemo(() => maioresPagadoras(resumos.data, acoes.data), [resumos.data, acoes.data]);
  const erroRanking = resumos.error ?? acoes.error ?? null;
  const carregandoRanking = !erroRanking && (resumos.isPending || acoes.isPending);

  return (
    <section id="proventos" className="secao proventos" aria-labelledby="proventos-titulo">
      <div className="proventos-topo">
        <Titulo id="proventos-titulo" className="proventos-titulo">
          {porNivel(TEXTOS.proventos.titulo, nivel)}
        </Titulo>
        <p className="proventos-intro">{porNivel(TEXTOS.proventos.intro, nivel)}</p>
      </div>

      <div className="proventos-faixa">
        <ComoFunciona nivelTitulo={nivelTitulo + 1} />
      </div>

      {!agenda.isPending && !agenda.isError && (
        <div className="proventos-faixa proventos-faixa-duas">
          <AlertasProventos alertas={alertas} nivelTitulo={nivelTitulo + 1} />
          <CalendarioProventos eventos={futuros ?? []} hoje={agenda.hoje} nivelTitulo={nivelTitulo + 1} />
        </div>
      )}

      <div className="proventos-faixa">
        <AgendaProventos nivelTitulo={nivelTitulo + 1} />
      </div>

      <div className="proventos-faixa proventos-faixa-duas">
        <section className="proventos-bloco" aria-labelledby="proventos-grafico-titulo">
          <Sub id="proventos-grafico-titulo" className="proventos-bloco-titulo proventos-com-icone">
            <ChartColumn size={22} aria-hidden="true" />
            <span>{porNivel(TEXTOS.proventos.graficoTitulo, nivel)}</span>
          </Sub>
          <p className="proventos-como-ler">{TEXTOS.proventos.comoLer.grafico}</p>
          <GraficoPagamentos
            datas={grafico.datas}
            valores={grafico.valores}
            carregando={agenda.isPending}
            erro={agenda.isError}
          />
        </section>

        <section className="proventos-bloco" aria-labelledby="proventos-ranking-titulo">
          <Sub id="proventos-ranking-titulo" className="proventos-bloco-titulo proventos-com-icone">
            <Trophy size={22} aria-hidden="true" />
            <span>{porNivel(TEXTOS.proventos.rankingTitulo, nivel)}</span>
          </Sub>
          <p className="proventos-como-ler">{TEXTOS.proventos.comoLer.ranking}</p>
          <TabelaMaioresPagadoras
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
    </section>
  );
}
