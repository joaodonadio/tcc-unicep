import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Manchete } from '../noticias/Manchete.jsx';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { Linhas } from '../ui/Estados.jsx';
import { quantidadeCheia } from '../../lib/formato.js';
import { usePreferencias } from '../../context/contextos.js';
import { useAcoes } from '../../hooks/useDados.js';
import { LIMITE_POUCAS_MANCHETES } from '../../lib/empresasNoticias.js';
import { ROTULO_STATUS, TEXTOS, porNivel } from '../../lib/textos.js';

/**
 * Tom das notícias do pregão: sentimento geral, contagens com barra de
 * proporção, manchetes por tom (até três de cada, com "Mostrar mais") e as
 * empresas com mais manchetes.
 */

const INDISPONIVEL = ROTULO_STATUS.indisponivel;
const MAX_INICIAL = 3;

const CONTAGENS = [
  { chave: 'positivas', rotulo: TEXTOS.dia.manchetesPositivas },
  { chave: 'neutras', rotulo: TEXTOS.dia.manchetesNeutras },
  { chave: 'negativas', rotulo: TEXTOS.dia.manchetesNegativas },
];

const COLUNAS_TOM = [
  { tom: 'positivo', rotulo: TEXTOS.dia.manchetesPositivas },
  { tom: 'neutro', rotulo: TEXTOS.dia.manchetesNeutras },
  { tom: 'negativo', rotulo: TEXTOS.dia.manchetesNegativas },
];

/** Mesmo tom na pílula (.pilula) e na barrinha da manchete: alta, neutro ou queda. */
const TOM_VISUAL = { positivo: 'alta', neutro: 'neutro', negativo: 'queda' };

/** Um tom de manchetes: três primeiras e um botão que mostra o resto. */
function ColunaTom({ tom, rotulo, lista }) {
  const [aberta, setAberta] = useState(false);
  const visiveis = aberta ? lista : lista.slice(0, MAX_INICIAL);

  return (
    <div className="dia-manchetes-coluna" data-tom={tom}>
      <h3 className="dia-manchetes-titulo">{rotulo}</h3>
      <ul className="dia-manchetes-lista">
        {visiveis.map((m, i) => (
          <li key={`${m.tag}-${i}`} data-tom={TOM_VISUAL[tom]}>
            <span className="pilula" data-tom={TOM_VISUAL[tom]}>
              {TEXTOS.dia.tomDaManchete[tom]}
            </span>
            <a className="dia-manchete" href={m.link} target="_blank" rel="noopener noreferrer">
              <Manchete titulo={m.titulo} />
              <span className="sr-only"> {TEXTOS.dia.abreNovaAba}</span>
            </a>
            <div className="dia-manchete-fonte">{m.fonte}</div>
          </li>
        ))}
      </ul>
      {lista.length > MAX_INICIAL && (
        <button
          type="button"
          className="dia-mais-manchetes"
          aria-expanded={aberta}
          onClick={() => setAberta((v) => !v)}
        >
          {TEXTOS.dia.mostrarMaisManchetes}
        </button>
      )}
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} [props.tom] data.tom_noticias ({total, positivas, neutras, negativas})
 * @param {string|null} [props.sentimento] data.sentimento_geral
 * @param {object} [props.manchetes] data.manchetes_por_tom
 * @param {object[]} [props.empresas] saída de empresasComManchetes
 * @param {number|null} [props.totalEmpresas] empresas com manchetes (nota de poucos dados)
 * @param {boolean} [props.carregando]
 * @param {string} [props.titulo] título do cartão (padrão: "O que as notícias dizem?")
 */
export function TomNoticias({
  tom,
  sentimento,
  manchetes,
  empresas,
  totalEmpresas = null,
  carregando = false,
  titulo = null,
}) {
  const { nivel } = usePreferencias();
  const { data: acoes } = useAcoes();
  const nomePorTicker = new Map((acoes ?? []).map((acao) => [acao.ticker, acao.empresa]));
  const colunas = COLUNAS_TOM.map((coluna) => ({
    ...coluna,
    lista: manchetes?.[coluna.tom] ?? [],
  })).filter((coluna) => coluna.lista.length > 0);

  // A barra só aparece com as três contagens; ausência não vira fatia.
  const temBarra = Boolean(tom?.total) && CONTAGENS.every(({ chave }) => tom[chave] != null);

  const poucas = Number.isFinite(tom?.total) && tom.total > 0 && tom.total < LIMITE_POUCAS_MANCHETES;

  return (
    <section className="dia-bloco dia-noticias" aria-labelledby="noticias-titulo">
      <h2 id="noticias-titulo" className="dia-bloco-titulo">
        <BotaoTermo chave="tom_noticias">{titulo ?? porNivel(TEXTOS.dia.noticias, nivel)}</BotaoTermo>
      </h2>

      {carregando ? (
        <Linhas quantidade={4} />
      ) : (
        <>
          {poucas && (
            <p className="dia-nota" data-aviso="poucas-manchetes">
              {porNivel(TEXTOS.paginas.poucasManchetes, nivel)(tom.total, totalEmpresas ?? empresas?.length ?? 0)}
            </p>
          )}
          <p className="dia-tom">{sentimento ? porNivel(TEXTOS.dia.sentimento[sentimento], nivel) : INDISPONIVEL}</p>

          {tom?.total ? (
            <dl className="dia-contagens">
              {CONTAGENS.map(({ chave, rotulo }) => (
                <div key={chave} className="dia-contagem" data-contagem={chave}>
                  <dt>{rotulo}</dt>
                  <dd>{tom[chave] == null ? INDISPONIVEL : quantidadeCheia(tom[chave])}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {temBarra && (
            <div className="dia-barra" aria-hidden="true">
              {CONTAGENS.map(({ chave }) => (
                <span key={chave} data-contagem={chave} style={{ flexGrow: tom[chave] }} />
              ))}
            </div>
          )}

          <p className="dia-nota">{porNivel(TEXTOS.dia.noticiasNota, nivel)}</p>

          {colunas.length === 0 ? (
            <p className="dia-vazio">{porNivel(TEXTOS.dia.semManchetes, nivel)}</p>
          ) : (
            <div className="dia-manchetes">
              {colunas.map(({ tom: chaveTom, rotulo, lista }) => (
                <ColunaTom key={chaveTom} tom={chaveTom} rotulo={rotulo} lista={lista} />
              ))}
            </div>
          )}

          {empresas?.length > 0 && (
            <div className="dia-empresas">
              <h3 className="dia-manchetes-titulo">{porNivel(TEXTOS.dia.empresasTitulo, nivel)}</h3>
              <p className="dia-nota">{porNivel(TEXTOS.dia.empresasNota, nivel)}</p>
              <table className="tabela dia-tabela-empresas">
                <thead>
                  <tr>
                    <th scope="col">{TEXTOS.dia.colEmpresa}</th>
                    {CONTAGENS.map(({ chave, rotulo }) => (
                      <th key={chave} scope="col" className="num">
                        {rotulo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empresas.map((empresa) => (
                    <tr key={empresa.ticker}>
                      <th scope="row">
                        <Link to={`/acao/${empresa.ticker}?pergunta=noticias`}>{empresa.ticker}</Link>
                        {nomePorTicker.get(empresa.ticker) && (
                          <span className="dia-empresa-nome"> {nomePorTicker.get(empresa.ticker)}</span>
                        )}
                      </th>
                      {CONTAGENS.map(({ chave }) => (
                        <td key={chave} className="num" data-contagem={chave}>
                          {empresa[chave] == null ? (
                            <>
                              <span aria-hidden="true">—</span>
                              <span className="sr-only">{INDISPONIVEL}</span>
                            </>
                          ) : (
                            empresa[chave]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
