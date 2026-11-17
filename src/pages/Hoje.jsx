import { useEffect } from 'react';
import ComoUsar from '../components/hoje/ComoUsar.jsx';
import PainelHoje from '../components/hoje/PainelHoje.jsx';
import { useRolarParaAncora } from '../hooks/useRolarParaAncora.js';
import { TEXTOS } from '../lib/textos.js';

/** Página Hoje (rota "/"): como usar o painel e o resumo do pregão. */
export default function Hoje() {
  // o bloco Como usar é a única âncora da página (#como-usar); ele já está pronto ao montar
  useRolarParaAncora(true);

  useEffect(() => {
    document.title = TEXTOS.paginas.tituloDocumento(TEXTOS.paginas.hoje);
  }, []);

  return (
    <div className="pagina">
      <h1 className="sr-only">{TEXTOS.paginas.hoje}</h1>
      <ComoUsar />
      <PainelHoje />
    </div>
  );
}
