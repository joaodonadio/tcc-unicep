import Mascote from '../components/ui/Mascote.jsx';
import { useEffect } from 'react';
import SecaoAcerto from '../components/modelo/SecaoAcerto.jsx';
import Abertura from '../components/modelo/Abertura.jsx';
import FluxoDados from '../components/modelo/FluxoDados.jsx';
import ModeloExperimental from '../components/modelo/ModeloExperimental.jsx';
import Mencoes from '../components/modelo/Mencoes.jsx';
import { TEXTOS } from '../lib/textos.js';

/** Página O modelo: de onde vêm os dados, o modelo experimental, a régua de acerto contra o acaso e as menções. */
export default function Modelo() {
  useEffect(() => {
    document.title = TEXTOS.paginas.tituloDocumento(TEXTOS.paginas.modelo);
  }, []);

  return (
    <div className="pagina">
      <header className="pagina-topo">
        <h1 className="pagina-titulo">{TEXTOS.paginas.modelo}</h1>
        <div className="modelo-topo-linha">
          <Mascote humor="animado" className="modelo-guia__pavio" />
          <p className="pagina-intro">{TEXTOS.paginas.modeloIntro}</p>
        </div>
      </header>

      <Abertura />
      <FluxoDados />
      <ModeloExperimental />
      <SecaoAcerto />
      <Mencoes />
    </div>
  );
}
