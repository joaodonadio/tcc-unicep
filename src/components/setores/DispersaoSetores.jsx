import { useMemo } from 'react';
import { GraficoBoxplot } from '../graficos/GraficoBoxplot.jsx';
import { quartis } from '../../lib/estatistica.js';
import { TEXTOS } from '../../lib/textos.js';

/** Quartis de cada setor entram como caixas; a lista de setores sem ações suficientes vai numa nota. */
export function DispersaoSetores({ setores, periodo }) {
  const T = TEXTOS.setores.dispersao;

  const { itens, semDados } = useMemo(() => {
    const todos = setores.map((s) => ({
      rotulo: s.setor,
      estat: quartis((s.acoes ?? []).map((a) => a.variacao)),
    }));
    return {
      itens: todos.filter((i) => i.estat).sort((a, b) => b.estat.mediana - a.estat.mediana),
      semDados: todos.filter((i) => !i.estat).map((i) => i.rotulo),
    };
  }, [setores]);

  return (
    <section className="secao setores-dispersao" data-brilho="dado" aria-labelledby="setores-dispersao-titulo">
      <h2 id="setores-dispersao-titulo" className="setores-titulo">
        {T.titulo}
      </h2>
      <p className="setores-como-ler">{T.comoLer}</p>

      <ul className="setores-dispersao-legenda" aria-label={T.legenda}>
        <li>
          <i className="dispersao-amostra dispersao-caixa" aria-hidden="true" />
          {T.legendaCaixa}
        </li>
        <li>
          <i className="dispersao-amostra dispersao-mediana" aria-hidden="true" />
          {T.legendaMediana}
        </li>
        <li>
          <i className="dispersao-amostra dispersao-atipico" aria-hidden="true" />
          {T.legendaAtipico}
        </li>
      </ul>

      <GraficoBoxplot key={periodo} itens={itens} />

      {semDados.length > 0 && <p className="setores-dispersao-nota">{T.semDados(semDados.join(', '))}</p>}
    </section>
  );
}
