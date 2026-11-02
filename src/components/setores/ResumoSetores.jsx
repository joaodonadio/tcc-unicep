import { useCallback, useMemo, useRef, useState } from 'react';
import { IconeSetor } from '../ui/IconeSetor.jsx';
import { pct } from '../../lib/formato.js';
import { ancoraDoSetor, maiorMediaAbsoluta, sinalDaVariacao } from '../../lib/setores.js';
import { colunasDosSetores } from '../../lib/setores3d.js';
import { TEXTOS } from '../../lib/textos.js';
import { Setores3D } from './Setores3D.jsx';
import { fraseDosSetores } from './fraseDosSetores.js';

const texto = (v) => (v == null ? TEXTOS.setores.semDado : pct(v));
/** Metade da trilha vai para cada lado do eixo zero: a barra maior ocupa 50%. */
const larguraDaBarra = (v, maximo) => (v == null || !(maximo > 0) ? 0 : Math.min(50, (Math.abs(v) / maximo) * 50));

/**
 * Ranking divergente: uma linha por setor, barra a partir do zero (direita sobe, esquerda cai).
 * Acima da lista, a vitrine dos setores: passar o mouse (ou o foco) numa linha gira a vitrine até o setor,
 * e a legenda da vitrine tem "Ver o setor", que aciona o link da lista.
 */
export function ResumoSetores({ setores, periodo }) {
  const frase = fraseDosSetores(setores, periodo);
  const maximo = maiorMediaAbsoluta(setores);
  const [destaque, setDestaque] = useState(null);
  const listaRef = useRef(null);
  const colunas = useMemo(() => colunasDosSetores(setores), [setores]);
  const sair = (nome) => setDestaque((d) => (d === nome ? null : d));
  // "Ver o setor" da legenda da vitrine: aciona o mesmo link da lista (só então a página rola).
  const escolher = useCallback((nome) => {
    listaRef.current?.querySelector(`a[href="#${ancoraDoSetor(nome)}"]`)?.click();
  }, []);

  return (
    <section className="setores-ranking cartao" aria-labelledby="setores-ranking-titulo">
      <h2 id="setores-ranking-titulo" className="setores-titulo">
        {TEXTOS.setores.rankingTitulo}
      </h2>
      <p className="setores-como-ler">{TEXTOS.setores.comoLerRanking}</p>

      <div className="setores-ranking__corpo">
        <Setores3D colunas={colunas} destaque={destaque} aoEscolher={escolher} />

        <ul key={periodo} ref={listaRef} className="setores-lista" aria-label={TEXTOS.setores.rankingLista}>
          {setores.map((s) => (
            <li key={s.setor}>
              <a
                className="setor-linha"
                href={`#${ancoraDoSetor(s.setor)}`}
                data-destaque={destaque === s.setor ? 'true' : undefined}
                onMouseEnter={() => setDestaque(s.setor)}
                onMouseLeave={() => sair(s.setor)}
                onFocus={() => setDestaque(s.setor)}
                onBlur={() => sair(s.setor)}
              >
                <span className="setor-linha-cabeca">
                  <IconeSetor setor={s.setor} tamanho={16} />
                  <span className="setor-linha-texto">
                    <span className="setor-linha-nome">{s.setor}</span>
                    <span className="setor-linha-frase">
                      {s.n > 0 ? TEXTOS.setores.subiramAcoes(s.subiram, s.n) : TEXTOS.setores.semDado}
                    </span>
                  </span>
                </span>
                <span className="setor-linha-barra">
                  <span className="setor-trilho-div" aria-hidden="true">
                    <span className="setor-eixo" />
                    <span
                      className="setor-barra-div"
                      data-sinal={sinalDaVariacao(s.media)}
                      style={{ width: `${larguraDaBarra(s.media, maximo)}%` }}
                    />
                  </span>
                  <span className="setor-linha-valor" data-sinal={sinalDaVariacao(s.media)}>
                    {texto(s.media)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {frase && <p className="setores-frase">{frase}</p>}
    </section>
  );
}
