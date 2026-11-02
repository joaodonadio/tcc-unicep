import { useState } from 'react';
import { MODELO_DA_PERGUNTA, dadosDoResumo } from '../../lib/modelos3d.js';
import { TEXTOS } from '../../lib/textos.js';
import Modelo3D from './Modelo3D.jsx';

const T = TEXTOS.modelos3d;

/**
 * "Entenda com um objeto" no topo do painel da pergunta. Modo simples: sempre aberto.
 * Modo técnico: recolhido num <details>, e o objeto só monta (e o three só baixa) ao abrir.
 * Perguntas sem objeto ou resumo ainda não carregado: nada.
 */
export function BlocoObjeto3D({ pergunta, resumo, ticker, tecnico }) {
  const [aberto, setAberto] = useState(false);
  const tipo = MODELO_DA_PERGUNTA[pergunta];
  if (!tipo || !resumo) return null;
  const modelo = <Modelo3D tipo={tipo} dados={dadosDoResumo(tipo, resumo)} ticker={ticker} />;

  if (tecnico) {
    return (
      <details className="modelo3d-bloco" onToggle={(e) => setAberto(e.currentTarget.open)}>
        <summary>{T.detalhesTecnico}</summary>
        {aberto && modelo}
      </details>
    );
  }
  return (
    <section className="modelo3d-bloco" aria-labelledby="modelo3d-titulo">
      <h3 id="modelo3d-titulo" className="modelo3d-titulo">
        {T.titulo}
      </h3>
      {modelo}
    </section>
  );
}
