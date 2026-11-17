import { Link } from 'react-router-dom';
import { useDetalhes } from '../../hooks/useDetalhes.js';
import { centesimosDoTom } from '../../lib/hoje.js';
import { contar, quantidadeCheia } from '../../lib/formato.js';
import { humorDoTom } from '../../lib/mascote.js';
import { usePreferencias } from '../../context/contextos.js';
import { ROTULO_STATUS, TEXTOS, porNivel } from '../../lib/textos.js';
import { MiniGrafico } from '../graficos/MiniGrafico.jsx';
import { BotaoDetalhes, PainelDetalhes } from '../ui/Detalhes.jsx';
import { Linhas } from '../ui/Estados.jsx';
import Mascote from '../ui/Mascote.jsx';
import { TextoComTermo } from '../ui/TextoComTermo.jsx';

/** Ordem da matriz e dos números; `tom` liga à bolinha (.hoje-tom-numeros) e `cor` pinta o grupo de pontos. */
const SEGMENTOS = [
  { chave: 'positivas', tom: 'alta', cor: 'var(--cor-alta)' },
  { chave: 'neutras', tom: 'estavel', cor: 'var(--cor-estavel)' },
  { chave: 'negativas', tom: 'queda', cor: 'var(--cor-queda)' },
];
const CORES = SEGMENTOS.map((s) => s.cor);

/** "51%"; contagem acima de zero que arredonda para 0% vira "<1%", para não sumir. */
function textoPorcento(centesimos, contagem) {
  if (centesimos === 0 && contagem > 0) return '<1%';
  return `${centesimos}%`;
}

/**
 * Tom das notícias do dia: matriz de cem pontos (cada um vale 1% das manchetes), os três
 * percentuais com a palavra embaixo e uma frase-síntese. Contagens e o que é o "tom" ficam no painel.
 * `tom` é data.tom_noticias; `sentimento` é data.sentimento_geral.
 */
export function ResumoNoticias({ tom, sentimento, carregando = false }) {
  const { nivel } = usePreferencias();
  const detalhes = useDetalhes();
  const centesimos = centesimosDoTom(tom);
  const titulo = porNivel(TEXTOS.hoje.noticiasTitulo, nivel);
  const frase = sentimento ? porNivel(TEXTOS.hoje.sentimento[sentimento], nivel) : null;
  const comPainel = !carregando && Boolean(centesimos);

  let conteudo;
  if (carregando) {
    conteudo = <Linhas quantidade={2} />;
  } else if (!tom) {
    conteudo = <p className="hoje-vazio">{ROTULO_STATUS.indisponivel}</p>;
  } else if (!centesimos) {
    conteudo = <p className="hoje-vazio">{porNivel(TEXTOS.hoje.semNoticias, nivel)}</p>;
  } else {
    const porcentos = SEGMENTOS.map((s, i) => textoPorcento(centesimos[i], tom[s.chave]));
    conteudo = (
      <>
        <div className="hoje-tom-matriz">
          <MiniGrafico tipo="pontos" valores={centesimos} cores={CORES} altura={80} rotulo={TEXTOS.hoje.mini.tom(...porcentos)} />
        </div>
        <ul className="hoje-tom-numeros">
          {SEGMENTOS.map((s, i) => (
            <li key={s.chave} data-tom={s.tom}>
              <span className="num">{porcentos[i]}</span>
              <span className="hoje-tom-nome">{TEXTOS.hoje.legendaTomContagem[s.chave]}</span>
            </li>
          ))}
        </ul>
        {frase && (
          <div className="hoje-tom-sintese-linha">
            <Mascote humor={humorDoTom(tom)} className="hoje-pavio" />
            <p className="hoje-tom-sintese">{frase}</p>
          </div>
        )}
      </>
    );
  }

  return (
    <section className="hoje-bloco" data-brilho="lavanda" aria-labelledby="hoje-tom-titulo">
      <div className="hoje-bloco-topo">
        <h2 id="hoje-tom-titulo" className="hoje-bloco-titulo">
          {titulo}
        </h2>
        {comPainel && <BotaoDetalhes nome={titulo} aberto={detalhes.aberto} controla={detalhes.id} onClick={detalhes.alternar} />}
      </div>
      {conteudo}
      {comPainel && (
        <PainelDetalhes id={detalhes.id} aberto={detalhes.aberto}>
          <p>
            <TextoComTermo chave="tom_noticias" texto={TEXTOS.hoje.legendaTom} />
          </p>
          <p>
            {TEXTOS.hoje.tomContagens(
              quantidadeCheia(tom.positivas),
              quantidadeCheia(tom.neutras),
              quantidadeCheia(tom.negativas),
            )}
          </p>
          {Number.isFinite(tom.total) && (
            <p>{TEXTOS.hoje.tomTotal(contar(tom.total, 'manchete classificada', 'manchetes classificadas'))}</p>
          )}
        </PainelDetalhes>
      )}
      <Link className="hoje-ver" to="/noticias">
        {TEXTOS.hoje.verNoticias}
      </Link>
    </section>
  );
}
