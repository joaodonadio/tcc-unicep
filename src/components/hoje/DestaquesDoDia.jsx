import { Link } from 'react-router-dom';
import { useDetalhes } from '../../hooks/useDetalhes.js';
import { numero, vezes } from '../../lib/formato.js';
import { fracaoDe, tetoVezes } from '../../lib/hoje.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { BotaoDetalhes, PainelDetalhes } from '../ui/Detalhes.jsx';
import { Linhas } from '../ui/Estados.jsx';

const MAX_VOLUME = 3;

/** Barra fina proporcional, decorativa (o número ao lado diz o mesmo). `normal` marca o 1× no volume. */
function Barra({ fracao, sinal, normal = null }) {
  if (fracao == null) return <span className="hoje-barra" aria-hidden="true" />;
  return (
    <span className="hoje-barra" data-sinal={sinal} aria-hidden="true" style={normal != null ? { '--normal': normal } : undefined}>
      <span className="hoje-barra-cheio" style={{ '--fracao': fracao }} />
      {normal != null && <span className="hoje-barra-normal" />}
    </span>
  );
}

/** Linha compacta: rótulo (se houver) | ticker | barra | valor. */
function Linha({ rotulo, ticker, barra, valor }) {
  return (
    <li className={rotulo ? 'hoje-destaque' : 'hoje-destaque hoje-destaque--sem-rotulo'}>
      {rotulo && <span className="hoje-destaque-rotulo">{rotulo}</span>}
      <Link className="hoje-link" to={`/acao/${ticker}`}>
        {ticker}
      </Link>
      {barra}
      <span className="hoje-destaque-valor">{valor}</span>
    </li>
  );
}

/**
 * Volume incomum do pregão: até 3 ações com volume acima do normal ("2,3×", barra com a marca do normal).
 * Maior alta e maior queda ficam no Resumo do pregão. Sem volume incomum, o bloco não aparece.
 * `alertas` é data.painel_alertas.
 */
export function DestaquesDoDia({ alertas, carregando = false }) {
  const { nivel } = usePreferencias();
  const detalhes = useDetalhes();
  const volume = (alertas?.volume?.itens ?? []).slice(0, MAX_VOLUME);
  const titulo = porNivel(TEXTOS.hoje.destaquesTitulo, nivel);
  if (!carregando && volume.length === 0) return null;

  const teto = tetoVezes(volume.map((i) => i.vezes));
  const empresas = [...new Map(volume.filter((x) => x.empresa).map((x) => [x.ticker, x])).values()];
  const comPainel = !carregando;

  return (
    <section className="hoje-bloco" aria-labelledby="hoje-destaques-titulo">
      <div className="hoje-bloco-topo">
        <h2 id="hoje-destaques-titulo" className="hoje-bloco-titulo">
          {titulo}
        </h2>
        {comPainel && <BotaoDetalhes nome={titulo} aberto={detalhes.aberto} controla={detalhes.id} onClick={detalhes.alternar} />}
      </div>
      {carregando ? (
        <Linhas quantidade={3} />
      ) : (
        <ul className="hoje-lista">
          <li className="hoje-subgrupo">
            <BotaoTermo chave="volume">{porNivel(TEXTOS.hoje.volumeIncomum, nivel)}</BotaoTermo>
          </li>
          {volume.map((item) => (
            <Linha
              key={item.ticker}
              ticker={item.ticker}
              barra={<Barra fracao={fracaoDe(item.vezes, teto)} sinal="volume" normal={fracaoDe(1, teto)} />}
              valor={
                <>
                  <span className="hoje-vezes" aria-hidden="true">
                    {vezes(item.vezes)}
                  </span>
                  <span className="sr-only">{porNivel(TEXTOS.hoje.vezesMediana, nivel)(numero(item.vezes, { casas: 1 }))}</span>
                </>
              }
            />
          ))}
        </ul>
      )}
      {comPainel && (
        <PainelDetalhes id={detalhes.id} aberto={detalhes.aberto}>
          <p>{porNivel(TEXTOS.hoje.volumeNota, nivel)}</p>
          {empresas.map((e) => (
            <p key={e.ticker}>{TEXTOS.hoje.quemE(e.ticker, e.empresa)}</p>
          ))}
        </PainelDetalhes>
      )}
      <Link className="hoje-ver" to="/acoes">
        {TEXTOS.hoje.verAcoes}
      </Link>
    </section>
  );
}
