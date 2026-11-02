import { useEffect } from 'react';
import SecaoAcoes from '../components/inicio/SecaoAcoes.jsx';
import { TEXTOS } from '../lib/textos.js';

/** Página Ações: lista e tabela das ações do pregão, com filtros e busca. */
export default function Acoes() {
  useEffect(() => {
    document.title = TEXTOS.paginas.tituloDocumento(TEXTOS.paginas.acoes);
  }, []);

  return (
    <div className="pagina">
      <SecaoAcoes nivelTitulo={1} />
    </div>
  );
}
