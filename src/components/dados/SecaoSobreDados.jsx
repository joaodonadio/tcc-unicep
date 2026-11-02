import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import { useAnaliseDoDia, useRecarregarAnalise } from '../../hooks/useAnalise.js';
import { useExecucao } from '../../hooks/useDados.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import ResumoAtualizacao from './ResumoAtualizacao.jsx';
import OrigensDados from './OrigensDados.jsx';
import PacotesAtualizacao from './PacotesAtualizacao.jsx';
import AvisosColeta from './AvisosColeta.jsx';

/**
 * Página "De onde vêm os números?": situação da última atualização, de onde vêm os dados,
 * o que chegou em cada pacote e os avisos da coleta.
 */
export default function SecaoSobreDados({ nivelTitulo = 2 }) {
  const { nivel } = usePreferencias();
  const Titulo = `h${nivelTitulo}`;
  const nivelSecao = nivelTitulo + 1;
  const analise = useAnaliseDoDia();
  const execucao = useExecucao();
  const recarregar = useRecarregarAnalise();
  const { dados } = TEXTOS;

  const carregando = analise.isPending || execucao.isPending;
  const erro = analise.isError || execucao.isError;
  const registro = execucao.data ?? null;

  return (
    <section id="dados" className="secao dados" aria-labelledby="dados-titulo">
      <Titulo id="dados-titulo" className="dados__titulo">
        {porNivel(dados.titulo, nivel)}
      </Titulo>

      {carregando ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">{dados.carregando}</span>
          <Linhas quantidade={4} />
        </div>
      ) : erro ? (
        <BlocoErro onTentarNovamente={recarregar} />
      ) : !registro ? (
        <p>{porNivel(dados.semDado, nivel)}</p>
      ) : (
        <ResumoAtualizacao registro={registro} dataReferencia={analise.data?.data_referencia} />
      )}

      <OrigensDados nivelSecao={nivelSecao} />

      {registro && (
        <>
          <PacotesAtualizacao registro={registro} nivelSecao={nivelSecao} />
          <AvisosColeta registro={registro} nivelSecao={nivelSecao} />
        </>
      )}
    </section>
  );
}
