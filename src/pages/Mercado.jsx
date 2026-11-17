import { useEffect } from 'react';
import SecaoMercado from '../components/mercado/SecaoMercado.jsx';
import { TEXTOS } from '../lib/textos.js';

/** Página Mercado: índices, dólar e juros (os setores têm página própria). */
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
