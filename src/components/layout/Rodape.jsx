import { Link } from 'react-router-dom';
import { useMetaPublicacao } from '../../hooks/useMetaPublicacao.js';
import { dataBR, dataHoraBR } from '../../lib/datas.js';
import { AVISO_FIXO, TEXTOS } from '../../lib/textos.js';

/**
 * RF-0.4 — rodapé permanente.
 * Requisito ético/CVM: o sistema é educacional; o aviso legal (AVISO_FIXO)
 * não pode depender de rolagem nem de estado.
 */
export function Rodape() {
  const { data } = useMetaPublicacao();
  const pregao = dataBR(data?.data_referencia);
  const publicado = dataHoraBR(data?.gerado_em);

  return (
    <footer className="rodape">
      <div className="pagina">
        <p className="aviso">{AVISO_FIXO}</p>
        <p>{TEXTOS.rodape.projeto}</p>
        {pregao && publicado && <p>{TEXTOS.rodape.dados(pregao, publicado)}</p>}
        <p>{TEXTOS.rodape.fonte}</p>
        <p>
          <Link to="/dados">{TEXTOS.dados.linkRodape}</Link>
        </p>
      </div>
    </footer>
  );
}
