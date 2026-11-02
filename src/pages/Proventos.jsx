import { useEffect } from 'react';
import SecaoProventos from '../components/proventos/SecaoProventos.jsx';
import { TEXTOS } from '../lib/textos.js';

/** Página Proventos: agenda de pagamentos, gráfico por mês e ranking de quem mais pagou. */
export default function Proventos() {
  useEffect(() => {
    document.title = TEXTOS.paginas.tituloDocumento(TEXTOS.paginas.proventos);
  }, []);

  return (
    <div className="pagina">
      <SecaoProventos nivelTitulo={1} />
    </div>
  );
}
