import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GradeSetores } from '../components/setores/GradeSetores.jsx';
import { ResumoSetores } from '../components/setores/ResumoSetores.jsx';
import { SeletorPeriodo } from '../components/setores/SeletorPeriodo.jsx';
import { VelasSetores } from '../components/setores/VelasSetores.jsx';
import { BlocoErro, Carregador } from '../components/ui/Estados.jsx';
import { usePreferencias } from '../context/contextos.js';
import { useAnaliseDoDia } from '../hooks/useAnalise.js';
import { useAcoes, useResumos, useSeriesDaSemana, useVelasSetores } from '../hooks/useDados.js';
import { nomearVelas, PERIODOS_SETOR, semanaNoResumo, setoresPorPeriodo } from '../lib/setores.js';
import { TEXTOS } from '../lib/textos.js';
import { trocarComTransicao } from '../lib/movimento.js';
import { velasDoDia } from '../lib/velasSetores.js';

const PERIODO_INICIAL = 'd1';
const SEM_TICKERS = [];

/** Página Setores: o que mudou em cada setor no período escolhido e a comparação entre eles. */
export default function Setores() {
  const analise = useAnaliseDoDia();
  const resumos = useResumos();
  const acoes = useAcoes();
  const { nivel } = usePreferencias();
  const [params, setParams] = useSearchParams();

  const periodoDaUrl = params.get('periodo');
  const periodo = PERIODOS_SETOR.includes(periodoDaUrl) ? periodoDaUrl : PERIODO_INICIAL;
  // a troca de período anima os cartões e as linhas do ranking (view transitions, ver movimento.css)
  const escolher = (chave) =>
    trocarComTransicao(() => setParams({ periodo: chave }, { replace: true, preventScrollReset: true, flushSync: true }));

  useEffect(() => {
    document.title = TEXTOS.paginas.tituloDocumento(TEXTOS.paginas.setores);
  }, []);

  // Sem variacao_preco.s1 em todas as ações, as séries da semana vêm numa rota só do servidor.
  const precisaSemana = resumos.isSuccess && !semanaNoResumo(resumos.data);
  const tickers = useMemo(() => (acoes.data ?? []).map((a) => a.ticker), [acoes.data]);
  const semana = useSeriesDaSemana(precisaSemana ? tickers : SEM_TICKERS);

  const porPeriodo = useMemo(
    () =>
      Object.fromEntries(
        PERIODOS_SETOR.map((p) => [p, setoresPorPeriodo(resumos.data, acoes.data, p, semana.data)]),
      ),
    [resumos.data, acoes.data, semana.data],
  );
  const setores = porPeriodo[periodo];

  // Velas por setor: só no modo técnico. O período de 1 dia sai da média do dia, sem consulta.
  const tecnico = nivel === 'tecnico';
  const velas = useVelasSetores(acoes.data, { enabled: tecnico });
  const velasDoPeriodo = useMemo(
    () => (periodo === 'd1' ? velasDoDia(setores) : nomearVelas(velas.data?.[periodo])),
    [periodo, setores, velas.data],
  );

  const erro = resumos.isError || acoes.isError ? resumos.error ?? acoes.error : null;
  const pendente =
    resumos.isPending || acoes.isPending || (periodo === 's1' && precisaSemana && tickers.length > 0 && semana.isPending);
  // sem nenhuma série da semana, a aba 1 semana não pode fingir que está vazia
  const semanaFalhou = periodo === 's1' && precisaSemana && semana.data && [...semana.data.values()].every((s) => s == null);

  let corpo;
  if (erro) {
    corpo = <BlocoErro mensagem={erro?.mensagemUsuario} onTentarNovamente={() => { resumos.refetch(); acoes.refetch(); }} />;
  } else if (semanaFalhou) {
    corpo = <BlocoErro titulo={TEXTOS.setores.semanaErro} onTentarNovamente={() => semana.refetch()} />;
  } else if (pendente) {
    corpo = (
      <>
        <Carregador compacto rotulo={TEXTOS.setores.carregando} />
        <div className="setores-esqueleto" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="esqueleto" style={{ height: '9rem' }} />
          ))}
        </div>
      </>
    );
  } else if (setores.length === 0) {
    corpo = <p className="setores-vazio">{TEXTOS.setores.vazio}</p>;
  } else {
    corpo = (
      <>
        <ResumoSetores setores={setores} periodo={periodo} semanaCalculada={precisaSemana && periodo === 's1'} />
        {tecnico && (
          <VelasSetores
            velas={velasDoPeriodo}
            periodo={periodo}
            carregando={periodo !== 'd1' && velas.isPending}
            falhou={periodo !== 'd1' && velas.isError}
          />
        )}
        <GradeSetores
          setores={setores}
          tecnico={nivel === 'tecnico'}
          tomPorSetor={analise.data?.tom_por_setor}
        />
      </>
    );
  }

  return (
    <div className="pagina setores-pagina">
      <header className="pagina-topo">
        <h1 className="pagina-titulo">{TEXTOS.paginas.setores}</h1>
        <p className="pagina-intro">{TEXTOS.paginas.setoresIntro}</p>
      </header>

      <SeletorPeriodo periodo={periodo} onEscolher={escolher} />

      <div id="setores-painel" role="tabpanel" aria-labelledby={`aba-${periodo}`}>
        {corpo}
      </div>
    </div>
  );
}
