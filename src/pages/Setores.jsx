import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DispersaoSetores } from '../components/setores/DispersaoSetores.jsx';
import { GradeSetores } from '../components/setores/GradeSetores.jsx';
import { ResumoSetores } from '../components/setores/ResumoSetores.jsx';
import { SeletorPeriodo } from '../components/setores/SeletorPeriodo.jsx';
import { OQueEUmSetor } from '../components/setores/OQueEUmSetor.jsx';
import { MapaPregao } from '../components/inicio/MapaPregao.jsx';
import { BlocoErro, Linhas } from '../components/ui/Estados.jsx';
import { usePreferencias } from '../context/contextos.js';
import { useAnaliseDoDia, useRecarregarAnalise } from '../hooks/useAnalise.js';
import { useAcoes, useResumos } from '../hooks/useDados.js';
import { PERIODOS_SETOR, setoresPorPeriodo } from '../lib/setores.js';
import { TEXTOS } from '../lib/textos.js';

const PERIODO_INICIAL = 'd1';

/** Página Setores: o que mudou em cada setor, a comparação entre eles e o mapa do pregão. */
export default function Setores() {
  const analise = useAnaliseDoDia();
  const recarregar = useRecarregarAnalise();
  const resumos = useResumos();
  const acoes = useAcoes();
  const { nivel } = usePreferencias();
  const [params, setParams] = useSearchParams();

  const periodoDaUrl = params.get('periodo');
  const periodo = PERIODOS_SETOR.includes(periodoDaUrl) ? periodoDaUrl : PERIODO_INICIAL;
  const escolher = (chave) => setParams({ periodo: chave }, { replace: true, preventScrollReset: true });

  useEffect(() => {
    document.title = TEXTOS.paginas.tituloDocumento(TEXTOS.paginas.setores);
  }, []);

  const porPeriodo = useMemo(
    () =>
      Object.fromEntries(PERIODOS_SETOR.map((p) => [p, setoresPorPeriodo(resumos.data, acoes.data, p)])),
    [resumos.data, acoes.data],
  );
  const setores = porPeriodo[periodo];

  const erro = resumos.isError || acoes.isError ? resumos.error ?? acoes.error : null;
  const pendente = resumos.isPending || acoes.isPending;

  let corpo;
  if (erro) {
    corpo = <BlocoErro mensagem={erro?.mensagemUsuario} onTentarNovamente={() => { resumos.refetch(); acoes.refetch(); }} />;
  } else if (pendente) {
    corpo = (
      <div role="status">
        <span className="sr-only">{TEXTOS.setores.carregando}</span>
        <Linhas quantidade={6} />
      </div>
    );
  } else if (setores.length === 0) {
    corpo = <p className="setores-vazio">{TEXTOS.setores.vazio}</p>;
  } else {
    corpo = (
      <>
        <ResumoSetores setores={setores} periodo={periodo} />
        {nivel === 'tecnico' && <DispersaoSetores setores={setores} periodo={periodo} />}
        <GradeSetores
          setores={setores}
          tecnico={nivel === 'tecnico'}
          tomPorSetor={analise.data?.tom_por_setor}
          porPeriodo={porPeriodo}
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

      <OQueEUmSetor />

      <SeletorPeriodo periodo={periodo} onEscolher={escolher} />

      <div id="setores-painel" role="tabpanel" aria-labelledby={`aba-${periodo}`}>
        {corpo}
      </div>

      <section className="secao setores-mapa" aria-label={TEXTOS.setores.mapaTitulo}>
        {analise.isError ? (
          <BlocoErro mensagem={analise.error?.mensagemUsuario} onTentarNovamente={recarregar} />
        ) : analise.isPending ? (
          <Linhas quantidade={4} />
        ) : (
          <MapaPregao acoes={analise.data.acoes_pregao} titulo={TEXTOS.setores.mapaTitulo} />
        )}
      </section>
    </div>
  );
}
