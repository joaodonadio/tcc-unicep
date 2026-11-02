import { useEffect } from 'react';
import SecaoSobreDados from '../components/dados/SecaoSobreDados.jsx';
import { TEXTOS } from '../lib/textos.js';

/** Página Sobre os dados: o que chegou na última atualização, avisos e fontes. */
export default function Dados() {
  useEffect(() => {
    document.title = TEXTOS.paginas.tituloDocumento(TEXTOS.paginas.dados);
  }, []);

  return (
    <div className="pagina">
      <SecaoSobreDados nivelTitulo={1} />
    </div>
  );
}
