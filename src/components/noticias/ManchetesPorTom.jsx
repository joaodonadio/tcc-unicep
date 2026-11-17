import { useId, useRef, useState } from 'react';
import { ExternalLink, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Manchete } from './Manchete.jsx';
import { useAlturaSuave } from '../../hooks/useAlturaSuave.js';
import { useIndicador } from '../../hooks/useIndicador.js';
import Mascote from '../ui/Mascote.jsx';
import { quantidadeCheia } from '../../lib/formato.js';
import { BRILHO_POR_TOM } from '../../lib/termometroNoticias.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/** Seis fecham fileiras completas em 1, 2 ou 3 colunas: a grade não fica com buraco. */
const MAX_VISIVEIS = 6;
const SENTIDO_DA_TECLA = { ArrowRight: 1, ArrowLeft: -1 };

/** Uma aba por tom. `chave` é o nome da contagem em tom_noticias; `tom`, a chave de manchetes_por_tom. */
const COLUNAS = [
  { tom: 'positivo', chave: 'positivas', rotulo: TEXTOS.dia.manchetesPositivas, Icone: TrendingUp },
  { tom: 'neutro', chave: 'neutras', rotulo: TEXTOS.dia.manchetesNeutras, Icone: Minus },
  { tom: 'negativo', chave: 'negativas', rotulo: TEXTOS.dia.manchetesNegativas, Icone: TrendingDown },
];

/** Lista do tom escolhido: até seis manchetes e um botão no fim para o resto. Trocar de aba remonta e volta ao recolhido. */
function ListaTom({ lista, idBase }) {
  const [aberta, setAberta] = useState(false);
  const listaRef = useRef(null);
  useAlturaSuave(listaRef, aberta);
  const idLista = `${idBase}-lista`;

  if (lista.length === 0) {
    return <p className="noticias-tom-vazio">{TEXTOS.dia.semManchetesTom}</p>;
  }

  const visiveis = aberta ? lista : lista.slice(0, MAX_VISIVEIS);
  return (
    <>
      <ul ref={listaRef} id={idLista} className="noticias-lista entra-lista">
        {visiveis.map((m, i) => (
          <li key={`${m.tag}-${i}`}>
            <a className="noticias-item" href={m.link} target="_blank" rel="noopener noreferrer">
              <Manchete titulo={m.titulo} />
              <span className="noticias-item-fonte">
                <span>{m.fonte}</span>
                <ExternalLink aria-hidden="true" className="noticias-item-icone" />
              </span>
              <span className="sr-only"> {TEXTOS.dia.abreNovaAba}</span>
            </a>
          </li>
        ))}
      </ul>

      {lista.length > MAX_VISIVEIS && (
        <button
          type="button"
          className="noticias-mais"
          aria-expanded={aberta}
          aria-controls={idLista}
          onClick={() => setAberta((v) => !v)}
        >
          {aberta ? TEXTOS.dia.mostrarMenosManchetes : TEXTOS.dia.mostrarTodasManchetes(lista.length)}
        </button>
      )}
    </>
  );
}

/**
 * Manchetes do pregão separadas por tom, em abas: uma lista visível por vez, na largura toda.
 * @param {object} props
 * @param {object} [props.manchetes] data.manchetes_por_tom
 * A contagem de cada aba é a das manchetes da lista; o total do dia (tom_noticias) fica no termômetro acima.
 */
export function ManchetesPorTom({ manchetes }) {
  const { nivel } = usePreferencias();
  const idBase = useId();
  const colunas = COLUNAS.map((coluna) => ({ ...coluna, lista: manchetes?.[coluna.tom] ?? [] }));
  const semNenhuma = colunas.every((coluna) => coluna.lista.length === 0);
  // a aba inicial é a primeira com manchetes; sem nenhuma, a primeira
  const [escolhido, setEscolhido] = useState(() => (colunas.find((c) => c.lista.length > 0) ?? colunas[0]).tom);
  const botoes = useRef({});
  // o marcador da aba escolhida desliza até ela (useIndicador)
  const indicador = useIndicador(escolhido);
  const atual = colunas.find((coluna) => coluna.tom === escolhido);

  // setas trocam de aba (com volta), Home e End vão à primeira e à última
  const aoTeclar = (evento, indice) => {
    const sentido = SENTIDO_DA_TECLA[evento.key];
    let proximo;
    if (sentido) proximo = colunas[(indice + sentido + colunas.length) % colunas.length].tom;
    else if (evento.key === 'Home') proximo = colunas[0].tom;
    else if (evento.key === 'End') proximo = colunas[colunas.length - 1].tom;
    else return;
    evento.preventDefault();
    setEscolhido(proximo);
    botoes.current[proximo]?.focus();
  };

  return (
    <section className="noticias-bloco" aria-labelledby="noticias-manchetes-titulo">
      <div className="noticias-bloco-titulo-linha">
        <Mascote humor="atento" className="noticias-pavio-titulo" />
        <h2 id="noticias-manchetes-titulo" className="noticias-bloco-titulo">
          {porNivel(TEXTOS.dia.manchetesTitulo, nivel)}
        </h2>
      </div>
      {semNenhuma ? (
        <p className="noticias-vazio">{porNivel(TEXTOS.dia.semManchetes, nivel)}</p>
      ) : (
        <>
          <div ref={indicador.trilhoRef} className="noticias-abas" role="tablist" aria-label={TEXTOS.dia.tonsManchetes}>
            <span ref={indicador.indicadorRef} className="noticias-aba-indicador" aria-hidden="true" />
            {colunas.map((coluna, indice) => {
              const ativa = coluna.tom === escolhido;
              const { Icone } = coluna;
              return (
                <button
                  key={coluna.tom}
                  ref={(el) => {
                    botoes.current[coluna.tom] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${idBase}-aba-${coluna.tom}`}
                  aria-selected={ativa}
                  aria-controls={`${idBase}-painel`}
                  tabIndex={ativa ? 0 : -1}
                  data-indicador-alvo={ativa ? 'true' : undefined}
                  data-brilho={BRILHO_POR_TOM[coluna.tom]}
                  className="noticias-aba"
                  onClick={() => setEscolhido(coluna.tom)}
                  onKeyDown={(evento) => aoTeclar(evento, indice)}
                >
                  <Icone aria-hidden="true" className="noticias-aba-icone" />
                  <span className="noticias-aba-rotulo">{coluna.rotulo}</span>
                  <span className="noticias-aba-contagem">
                    <span className="num">{quantidadeCheia(coluna.lista.length)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            id={`${idBase}-painel`}
            role="tabpanel"
            aria-labelledby={`${idBase}-aba-${escolhido}`}
            className="noticias-painel cartao"
            data-brilho={BRILHO_POR_TOM[escolhido]}
            data-tom={escolhido}
          >
            <ListaTom key={escolhido} lista={atual.lista} idBase={`${idBase}-${escolhido}`} />
          </div>
        </>
      )}
    </section>
  );
}
