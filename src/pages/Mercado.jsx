import { useEffect } from 'react';
import SecaoMercado from '../components/mercado/SecaoMercado.jsx';
import { TEXTOS } from '../lib/textos.js';

/** Página Mercado: índices, juros e dólar, setores (com o mapa do pregão) e destaques, em abas. */
export default function Mercado() {
  useEffect(() => {
    document.title = TEXTOS.paginas.tituloDocumento(TEXTOS.paginas.mercado);
  }, []);

  return (
    <div className="pagina">
      <SecaoMercado nivelTitulo={1} />
    </div>
  );
}
