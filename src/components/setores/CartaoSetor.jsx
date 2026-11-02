import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconeSetor } from '../ui/IconeSetor.jsx';
import { pct } from '../../lib/formato.js';
import { PERIODOS_SETOR, ancoraDoSetor, descricaoDoSetor, sinalDaVariacao } from '../../lib/setores.js';
import { tomDoSaldo } from '../../lib/mercadoTela.js';
import { TEXTOS } from '../../lib/textos.js';

const texto = (v) => (v == null ? TEXTOS.setores.semDado : pct(v));
const largura = (v, maximo) => (v == null || !(maximo > 0) ? 0 : Math.min(100, (Math.abs(v) / maximo) * 100));
const porcento = (parte, todo) => (todo > 0 ? `${(parte / todo) * 100}%` : '0%');

function Barrinha({ valor, maximo }) {
  return (
    <span className="setor-trilho" aria-hidden="true">
      <span className="setor-barra" data-sinal={sinalDaVariacao(valor)} style={{ width: `${largura(valor, maximo)}%` }} />
    </span>
  );
}

/**
 * Cartão de um setor: selo com o ícone, o que o setor faz, algumas empresas dele, o resultado do
 * período e quantas ações subiram e caíram. A lista completa de ações abre dentro de uma área com rolagem.
 * No modo técnico mostra também o tom das notícias e a variação nos 4 períodos.
 */
export function CartaoSetor({ setor, maximoAcoes, tecnico, tom, mediasPorPeriodo }) {
  const [aberto, setAberto] = useState(false);
  const idLista = useId();
  const chaveTom = tomDoSaldo(tom?.saldo);
  const descricao = descricaoDoSetor(setor.setor, TEXTOS.setores.descricoes);
  const exemplos = setor.acoes.slice(0, 3);

  return (
    <article id={ancoraDoSetor(setor.setor)} className="cartao setor-cartao">
      <header className="setor-cabeca">
        <span className="setor-selo-grande">
          <IconeSetor setor={setor.setor} tamanho={22} />
        </span>
        <h3 className="setor-nome">{setor.setor}</h3>
      </header>

      {descricao && <p className="setor-descricao">{descricao}</p>}

      {exemplos.length > 0 && (
        <div className="setor-bloco">
          <span className="setor-rotulo">{TEXTOS.setores.empresasDoSetor}</span>
          <ul className="setor-tickers">
            {exemplos.map((a) => (
              <li key={a.ticker}>
                <Link to={`/acao/${a.ticker}`}>{a.ticker}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="setor-bloco">
        <span className="setor-rotulo">{TEXTOS.setores.resultadoPeriodo}</span>
        <span className="setor-valor" data-sinal={sinalDaVariacao(setor.media)}>
          {texto(setor.media)}
        </span>
      </div>

      <div className="setor-bloco">
        {setor.n > 0 ? (
          <>
            <span className="setor-empilhada" aria-hidden="true">
              <span data-sinal="alta" style={{ width: porcento(setor.subiram, setor.n) }} />
              <span data-sinal="queda" style={{ width: porcento(setor.cairam, setor.n) }} />
            </span>
            <p className="setor-contagem">
              <span data-sinal="alta">{TEXTOS.setores.subiramDe(setor.subiram, setor.n)}</span>
              <span data-sinal="queda">{TEXTOS.setores.cairamDe(setor.cairam, setor.n)}</span>
            </p>
          </>
        ) : (
          <p className="setor-contagem">{TEXTOS.setores.semDado}</p>
        )}
      </div>

      {tecnico && (
        <p className="setor-tecnico">
          <span className="setor-rotulo">{TEXTOS.setores.tomNoticias}</span>
          <span>{chaveTom ? TEXTOS.setores.tom[chaveTom] : TEXTOS.setores.semDado}</span>
        </p>
      )}

      {tecnico && mediasPorPeriodo && (
        <table className="setor-periodos">
          <caption className="sr-only">{TEXTOS.setores.quatroPeriodos}</caption>
          <thead>
            <tr>
              {PERIODOS_SETOR.map((p) => (
                <th key={p} scope="col">
                  {TEXTOS.setores.periodos[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {PERIODOS_SETOR.map((p) => (
                <td key={p} data-sinal={sinalDaVariacao(mediasPorPeriodo[p])}>
                  {texto(mediasPorPeriodo[p])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      )}

      <button
        type="button"
        className="botao setor-expandir"
        aria-expanded={aberto}
        aria-controls={idLista}
        onClick={() => setAberto((a) => !a)}
      >
        {aberto ? TEXTOS.setores.esconder : TEXTOS.setores.ver}
      </button>

      <div id={idLista} className="setor-acoes-caixa" hidden={!aberto}>
        {aberto && (
          <ul className="setor-acoes" aria-label={TEXTOS.setores.acoesDoSetor(setor.setor)}>
            {setor.acoes.map((a) => (
              <li key={a.ticker} className="setor-acao-linha">
                <Link to={`/acao/${a.ticker}`}>{a.ticker}</Link>
                <Barrinha valor={a.variacao} maximo={maximoAcoes} />
                <span className="setor-numero" data-sinal={sinalDaVariacao(a.variacao)}>
                  {texto(a.variacao)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
