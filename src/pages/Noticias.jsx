import { useEffect } from 'react';
import { EmpresasNoticias } from '../components/noticias/EmpresasNoticias.jsx';
import { ManchetesPorTom } from '../components/noticias/ManchetesPorTom.jsx';
import { TermometroNoticias } from '../components/noticias/TermometroNoticias.jsx';
import { useAnaliseDoDia, useRecarregarAnalise } from '../hooks/useAnalise.js';
import { useNoticias } from '../hooks/useDados.js';
import { contarEmpresasComManchetes, empresasComManchetes } from '../lib/empresasNoticias.js';
import { usePreferencias } from '../context/contextos.js';
import { BlocoErro, Linhas } from '../components/ui/Estados.jsx';
import { TEXTOS, porNivel } from '../lib/textos.js';

/** Página Notícias: termômetro do dia, manchetes por tom e as empresas mais citadas. */
export default function Noticias() {
  const { nivel } = usePreferencias();
  const { data, isPending, isError, error } = useAnaliseDoDia();
  const recarregar = useRecarregarAnalise();
  const { data: noticias } = useNoticias();
  const empresas = empresasComManchetes(noticias);
  const totalEmpresas = contarEmpresasComManchetes(noticias);

  useEffect(() => {
    document.title = TEXTOS.paginas.tituloDocumento(TEXTOS.paginas.noticias);
  }, []);

  return (
    <div className="pagina">
      <header className="pagina-topo">
        <h1 className="pagina-titulo">{porNivel(TEXTOS.paginas.noticiasTitulo, nivel)}</h1>
        <p className="pagina-intro">{porNivel(TEXTOS.paginas.noticiasIntro, nivel)}</p>
      </header>

      {isError ? (
        <BlocoErro mensagem={error?.mensagemUsuario} onTentarNovamente={recarregar} />
      ) : isPending ? (
        <Linhas quantidade={4} />
      ) : (
        <div className="noticias">
          <TermometroNoticias
            tom={data?.tom_noticias}
            sentimento={data?.sentimento_geral}
            totalEmpresas={totalEmpresas}
          />
          <ManchetesPorTom manchetes={data?.manchetes_por_tom} tom={data?.tom_noticias} />
          <EmpresasNoticias empresas={empresas} />
        </div>
      )}
    </div>
  );
}
