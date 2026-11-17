import { CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import Mascote from '../ui/Mascote.jsx';
import { usePreferencias } from '../../context/contextos.js';
import { fatosDaAtualizacao, situacaoPainel } from '../../lib/sobreDados.js';
import { TEXTOS } from '../../lib/textos.js';

const ICONE_POR_TOM = { alta: CheckCircle2, acento: TriangleAlert, queda: TriangleAlert, neutro: Info };

/** Primeiro cartão: situação, pavio com frase curta e os fatos numa linha de grade (o número do dia dentro). */
export default function ResumoAtualizacao({ registro, dataReferencia, dadosAte = null, nivelSecao = 2 }) {
  const { nivel } = usePreferencias();
  const { fatos: rotulos, ultima } = TEXTOS.dados;
  const Titulo = `h${nivelSecao}`;
  const situacao = situacaoPainel(registro.status);
  const Icone = ICONE_POR_TOM[situacao.tom];
  const valores = fatosDaAtualizacao({ dataReferencia, execucao: registro, dadosAte });

  const lista = [
    { chave: 'pregao', rotulo: rotulos.pregao, valor: valores.pregao },
    { chave: 'dadosAte', rotulo: rotulos.dadosAte, valor: valores.dadosAte },
    { chave: 'publicado', rotulo: rotulos.publicado, valor: valores.publicado },
    { chave: 'atualizacao', rotulo: rotulos.atualizacao, valor: valores.atualizacao },
    ...(nivel === 'tecnico' ? [{ chave: 'periodo', rotulo: rotulos.periodo, valor: valores.periodo }] : []),
  ].filter((fato) => fato.valor);

  return (
    <section className="dados__ultima" data-brilho={situacao.brilho} aria-labelledby="dados-ultima">
      <div className="dados__ultima-topo">
        <Mascote humor={situacao.humor} className="dados__pavio" />
        <div>
          <Titulo id="dados-ultima" className="dados__ultima-titulo">
            {ultima}
          </Titulo>
          <p className="dados__frase">{situacao.frase}</p>
        </div>
      </div>
      <dl className="dados__fatos">
        <div className="dados__fato">
          <dt>{rotulos.status}</dt>
          <dd className="dados__status" data-tom={situacao.tom}>
            <Icone aria-hidden="true" size={18} />
            {situacao.rotulo}
          </dd>
        </div>
        {lista.map((fato) => (
          <div className="dados__fato" key={fato.chave}>
            <dt>{fato.rotulo}</dt>
            <dd>{fato.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
