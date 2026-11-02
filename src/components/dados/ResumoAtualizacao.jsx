import { CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { usePreferencias } from '../../context/contextos.js';
import { fatosDaAtualizacao, situacaoPainel } from '../../lib/sobreDados.js';
import { TEXTOS } from '../../lib/textos.js';

const ICONE_POR_TOM = { alta: CheckCircle2, acento: TriangleAlert, queda: TriangleAlert, neutro: Info };

/** Topo da página: a situação da última atualização e três fatos (pregão, publicação, número). */
export default function ResumoAtualizacao({ registro, dataReferencia }) {
  const { nivel } = usePreferencias();
  const { fatos: rotulos } = TEXTOS.dados;
  const situacao = situacaoPainel(registro.status);
  const Icone = ICONE_POR_TOM[situacao.tom];
  const valores = fatosDaAtualizacao({ dataReferencia, execucao: registro });

  const lista = [
    { chave: 'pregao', rotulo: rotulos.pregao, valor: valores.pregao },
    { chave: 'publicado', rotulo: rotulos.publicado, valor: valores.publicado },
    { chave: 'atualizacao', rotulo: rotulos.atualizacao, valor: valores.atualizacao },
    ...(nivel === 'tecnico' ? [{ chave: 'periodo', rotulo: rotulos.periodo, valor: valores.periodo }] : []),
  ].filter((fato) => fato.valor);

  return (
    <div className="dados__resumo">
      <span className="pilula" data-tom={situacao.tom}>
        <Icone aria-hidden="true" size={18} />
        {situacao.rotulo}
      </span>
      {lista.length > 0 && (
        <dl className="dados__fatos">
          {lista.map((fato) => (
            <div className="dados__fato" key={fato.chave}>
              <dt>{fato.rotulo}</dt>
              <dd>{fato.valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
