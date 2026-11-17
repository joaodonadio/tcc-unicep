import { Info, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import Mascote from '../ui/Mascote.jsx';
import { quantidadeCheia } from '../../lib/formato.js';
import { humorDoTom } from '../../lib/mascote.js';
import { LIMITE_POUCAS_MANCHETES } from '../../lib/empresasNoticias.js';
import { brilhoDoSentimento, porcentagemDoTotal } from '../../lib/termometroNoticias.js';
import { usePreferencias } from '../../context/contextos.js';
import { ROTULO_STATUS, TEXTOS, porNivel } from '../../lib/textos.js';

const INDISPONIVEL = ROTULO_STATUS.indisponivel;

/** Ordem das fatias da barra e da legenda; o ícone e a palavra dizem o sinal, não só a cor. */
const TONS = [
  { chave: 'positivas', rotulo: TEXTOS.dia.manchetesPositivas, icone: <TrendingUp aria-hidden="true" className="noticias-legenda-icone" /> },
  { chave: 'neutras', rotulo: TEXTOS.dia.manchetesNeutras, icone: <Minus aria-hidden="true" className="noticias-legenda-icone" /> },
  { chave: 'negativas', rotulo: TEXTOS.dia.manchetesNegativas, icone: <TrendingDown aria-hidden="true" className="noticias-legenda-icone" /> },
];

/**
 * Termômetro do dia: Cotinha, a frase do sentimento, o total de manchetes, a barra
 * com as três fatias e a legenda com número e porcentagem de cada tom.
 * @param {object} props
 * @param {object} [props.tom] data.tom_noticias ({total, positivas, neutras, negativas})
 * @param {string|null} [props.sentimento] data.sentimento_geral
 * @param {number|null} [props.totalEmpresas] empresas com manchetes (nota de poucos dados)
 */
export function TermometroNoticias({ tom, sentimento, totalEmpresas = null }) {
  const { nivel } = usePreferencias();
  const total = tom?.total ?? null;
  const frase = TEXTOS.dia.sentimento[sentimento] ? porNivel(TEXTOS.dia.sentimento[sentimento], nivel) : INDISPONIVEL;

  // A barra só aparece com as três contagens; ausência não vira fatia.
  const temBarra = Boolean(total) && TONS.every(({ chave }) => tom[chave] != null);
  const poucas = Number.isFinite(total) && total > 0 && total < LIMITE_POUCAS_MANCHETES;

  return (
    <section className="noticias-termometro cartao" data-brilho={brilhoDoSentimento(sentimento)} aria-labelledby="noticias-termometro-titulo">
      <div className="noticias-termometro-topo">
        <Mascote humor={humorDoTom(tom)} className="noticias-pavio" />
        <div className="noticias-termometro-texto">
          <h2 id="noticias-termometro-titulo" className="noticias-termometro-titulo">
            <BotaoTermo chave="tom_noticias">{porNivel(TEXTOS.dia.termometro, nivel)}</BotaoTermo>
          </h2>
          <p className="noticias-frase">{frase}</p>
          {total ? (
            <p className="noticias-total">
              <span className="num">{quantidadeCheia(total)}</span> {TEXTOS.dia.palavraLidas(total)}
            </p>
          ) : null}
        </div>
      </div>

      {total ? (
        <>
          {temBarra && (
            <div className="noticias-barra" aria-hidden="true">
              {TONS.map(({ chave }) => (
                <span key={chave} data-contagem={chave} style={{ flexGrow: tom[chave] }} />
              ))}
            </div>
          )}
          <ul className="noticias-legenda">
            {TONS.map(({ chave, rotulo, icone }) => (
              <li key={chave} className="noticias-legenda-item" data-contagem={chave}>
                {icone}
                <span className="noticias-legenda-nome">{rotulo}</span>
                {tom[chave] == null ? (
                  <>
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">{INDISPONIVEL}</span>
                  </>
                ) : (
                  <span className="noticias-legenda-numeros">
                    <span className="num">{quantidadeCheia(tom[chave])}</span>
                    {' · '}
                    <span className="num">{porcentagemDoTotal(tom[chave], total)}%</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {poucas && (
        <p className="noticias-aviso" data-aviso="poucas-manchetes">
          {porNivel(TEXTOS.paginas.poucasManchetes, nivel)(total, totalEmpresas ?? 0)}
        </p>
      )}

      <p className="noticias-nota">
        <Info aria-hidden="true" className="noticias-nota-icone" />
        <span>{porNivel(TEXTOS.dia.noticiasNota, nivel)}</span>
      </p>
    </section>
  );
}
