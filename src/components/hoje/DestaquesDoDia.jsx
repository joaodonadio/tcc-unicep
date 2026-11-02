import { Link } from 'react-router-dom';
import { numero } from '../../lib/formato.js';
import { usePreferencias } from '../../context/contextos.js';
import { ROTULO_STATUS, TEXTOS, porNivel } from '../../lib/textos.js';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { Linhas } from '../ui/Estados.jsx';
import { Variacao } from './Variacao.jsx';

const MAX_VOLUME = 3;

/**
 * Uma linha de destaque na grade rótulo | ticker e empresa | valor à direita.
 * Todas as linhas com rótulo usam a mesma grade, então o ticker fica na mesma coluna.
 * Sem rótulo (grupo de volume), a grade fica com duas colunas e o ticker começa na borda.
 */
function Linha({ rotulo, ticker, empresa, valor }) {
  const classe = rotulo ? 'hoje-linha hoje-linha--grade' : 'hoje-linha hoje-linha--grade hoje-linha--sem-rotulo';
  return (
    <li className={classe}>
      {rotulo && <span className="hoje-linha-rotulo">{rotulo}</span>}
      <span className="hoje-linha-quem">
        <Link className="hoje-link" to={`/acao/${ticker}`}>
          {ticker}
        </Link>
        {empresa && <span className="hoje-linha-empresa">{empresa}</span>}
      </span>
      <span className="hoje-linha-valor">{valor}</span>
    </li>
  );
}

/**
 * Destaques do pregão: maior alta, maior queda e até 3 ações com volume incomum.
 * `alertas` é data.painel_alertas.
 */
export function DestaquesDoDia({ alertas, carregando = false }) {
  const { nivel } = usePreferencias();
  const alta = alertas?.alta ?? null;
  const queda = alertas?.queda ?? null;
  const volume = (alertas?.volume?.itens ?? []).slice(0, MAX_VOLUME);
  const algum = Boolean(alta || queda || volume.length);

  let conteudo;
  if (carregando) {
    conteudo = <Linhas quantidade={3} />;
  } else if (!alertas) {
    conteudo = <p className="hoje-vazio">{ROTULO_STATUS.indisponivel}</p>;
  } else if (!algum) {
    conteudo = <p className="hoje-vazio">{porNivel(TEXTOS.hoje.semDestaques, nivel)}</p>;
  } else {
    conteudo = (
      <ul className="hoje-lista">
        {alta && (
          <Linha
            rotulo={porNivel(TEXTOS.hoje.maiorAlta, nivel)}
            ticker={alta.ticker}
            empresa={alta.empresa}
            valor={<Variacao valor={alta.variacao} />}
          />
        )}
        {queda && (
          <Linha
            rotulo={porNivel(TEXTOS.hoje.maiorQueda, nivel)}
            ticker={queda.ticker}
            empresa={queda.empresa}
            valor={<Variacao valor={queda.variacao} />}
          />
        )}
        {volume.length > 0 && (
          <li className="hoje-subgrupo">
            <BotaoTermo chave="volume">{porNivel(TEXTOS.hoje.volumeIncomum, nivel)}</BotaoTermo>
          </li>
        )}
        {volume.map((item) => (
          <Linha
            key={item.ticker}
            ticker={item.ticker}
            empresa={item.empresa}
            valor={porNivel(TEXTOS.hoje.vezesMediana, nivel)(numero(item.vezes, { casas: 1 }))}
          />
        ))}
      </ul>
    );
  }

  return (
    <section className="hoje-bloco" aria-labelledby="hoje-destaques-titulo">
      <h2 id="hoje-destaques-titulo" className="hoje-bloco-titulo">
        {porNivel(TEXTOS.hoje.destaquesTitulo, nivel)}
      </h2>
      {conteudo}
      <Link className="hoje-ver" to="/acoes">
        {TEXTOS.hoje.verAcoes}
      </Link>
    </section>
  );
}
