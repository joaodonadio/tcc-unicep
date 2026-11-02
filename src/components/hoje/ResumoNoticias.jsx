import { Link } from 'react-router-dom';
import { partesDoTom } from '../../lib/hoje.js';
import { tons } from '../../lib/formato.js';
import { usePreferencias } from '../../context/contextos.js';
import { ROTULO_STATUS, TEXTOS, porNivel } from '../../lib/textos.js';
import { Linhas } from '../ui/Estados.jsx';
import { TextoComTermo } from '../ui/TextoComTermo.jsx';

/**
 * Tom das notícias do dia: barra empilhada fina (decorativa, a contagem vem em texto)
 * e o tom geral quando há. `tom` é data.tom_noticias; `sentimento` é data.sentimento_geral.
 */
export function ResumoNoticias({ tom, sentimento, carregando = false }) {
  const { nivel } = usePreferencias();
  const partes = partesDoTom(tom);
  const temContagem = Boolean(tom) && [tom.positivas, tom.neutras, tom.negativas].every((v) => typeof v === 'number');

  let conteudo;
  if (carregando) {
    conteudo = <Linhas quantidade={2} />;
  } else if (!tom) {
    conteudo = <p className="hoje-vazio">{ROTULO_STATUS.indisponivel}</p>;
  } else if (!partes) {
    conteudo = <p className="hoje-vazio">{porNivel(TEXTOS.hoje.semNoticias, nivel)}</p>;
  } else {
    conteudo = (
      <>
        <div className="hoje-tom-barra" aria-hidden="true">
          <span className="hoje-tom-positivas" style={{ width: `${partes.positivas * 100}%` }} />
          <span className="hoje-tom-neutras" style={{ width: `${partes.neutras * 100}%` }} />
          <span className="hoje-tom-negativas" style={{ width: `${partes.negativas * 100}%` }} />
        </div>
        {temContagem && <p className="hoje-texto">{TEXTOS.hoje.tomContagem(tons(tom.positivas, tom.neutras, tom.negativas))}</p>}
        {sentimento && porNivel(TEXTOS.hoje.sentimento[sentimento], nivel) && (
          <p className="hoje-nota">{porNivel(TEXTOS.hoje.sentimento[sentimento], nivel)}</p>
        )}
        <p className="hoje-nota">
          <TextoComTermo chave="tom_noticias" texto={TEXTOS.hoje.legendaTom} />
        </p>
      </>
    );
  }

  return (
    <section className="hoje-bloco" aria-labelledby="hoje-tom-titulo">
      <h2 id="hoje-tom-titulo" className="hoje-bloco-titulo">
        {porNivel(TEXTOS.hoje.noticiasTitulo, nivel)}
      </h2>
      {conteudo}
      <Link className="hoje-ver" to="/noticias">
        {TEXTOS.hoje.verNoticias}
      </Link>
    </section>
  );
}
