import { useEffect } from 'react';
import { TomNoticias } from '../components/inicio/TomNoticias.jsx';
import { useAnaliseDoDia, useRecarregarAnalise } from '../hooks/useAnalise.js';
import { useNoticias } from '../hooks/useDados.js';
import { contarEmpresasComManchetes, empresasComManchetes } from '../lib/empresasNoticias.js';
import { usePreferencias } from '../context/contextos.js';
import { BlocoErro } from '../components/ui/Estados.jsx';
import { TEXTOS, porNivel } from '../lib/textos.js';

/** Página Notícias: tom das manchetes do último pregão e as empresas mais citadas. */
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
      ) : (
        <TomNoticias
          titulo={porNivel(TEXTOS.paginas.tomTitulo, nivel)}
          carregando={isPending}
          tom={data?.tom_noticias}
          sentimento={data?.sentimento_geral}
          manchetes={data?.manchetes_por_tom}
          empresas={empresas}
          totalEmpresas={totalEmpresas}
        />
      )}
    </div>
  );
}
