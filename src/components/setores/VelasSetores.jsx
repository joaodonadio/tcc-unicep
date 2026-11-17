import { useMemo } from 'react';
import { GraficoVelas } from '../graficos/GraficoVelas.jsx';
import { Carregador } from '../ui/Estados.jsx';
import { SeloCalculo } from '../ui/SeloCalculo.jsx';
import { TEXTOS } from '../../lib/textos.js';

/** Uma vela por setor no período; setor sem dado no período vai numa nota. */
export function VelasSetores({ velas = [], periodo, carregando = false, falhou = false }) {
  const T = TEXTOS.setores.velas;

  const { itens, semDados } = useMemo(
    () => ({
      itens: velas
        .filter((v) => v.vela)
        .map((v) => ({ rotulo: v.setor, vela: v.vela, n: v.n, inicio: v.inicio, fim: v.fim })),
      semDados: velas.filter((v) => !v.vela).map((v) => v.setor),
    }),
    [velas],
  );

  return (
    <section className="secao setores-velas" data-brilho="dado" aria-labelledby="setores-velas-titulo">
      <h2 id="setores-velas-titulo" className="setores-titulo">
        {T.titulo}
      </h2>
      <p className="setores-como-ler">{T.comoLer}</p>
      {periodo === 'd1' && <p className="setores-velas-nota">{T.notaDia}</p>}

      <ul className="setores-velas-legenda" aria-label={T.legenda}>
        <li>
          <i className="velas-amostra velas-corpo" aria-hidden="true" />
          {T.legendaCorpo}
        </li>
        <li>
          <i className="velas-amostra velas-pavio" aria-hidden="true" />
          {T.legendaPavio}
        </li>
        <li>{T.legendaSinal}</li>
      </ul>

      {carregando ? (
        <Carregador compacto rotulo={T.carregando} />
      ) : falhou ? (
        <p className="setores-velas-nota">{T.erro}</p>
      ) : (
        <>
          <GraficoVelas key={periodo} itens={itens} />
          {semDados.length > 0 && <p className="setores-velas-nota">{T.semDados(semDados.join(', '))}</p>}
          <SeloCalculo conta="velas" />
        </>
      )}
    </section>
  );
}
