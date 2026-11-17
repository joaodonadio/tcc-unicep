import { useId, useState } from 'react';
import { BlocoErro, Carregador, Linhas } from '../ui/Estados.jsx';
import { BotaoDetalhes, PainelDetalhes } from '../ui/Detalhes.jsx';
import { useAnaliseDoDia, useRecarregarAnalise } from '../../hooks/useAnalise.js';
import { useExecucao, useMercado } from '../../hooks/useDados.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import ResumoAtualizacao from './ResumoAtualizacao.jsx';
import OrigensDados from './OrigensDados.jsx';
import ContasDoSite from './ContasDoSite.jsx';
import PacotesAtualizacao from './PacotesAtualizacao.jsx';
import AvisosColeta from './AvisosColeta.jsx';
import { EtapasColeta, FatosColeta } from './DetalhesColeta.jsx';

/**
 * Página "De onde vêm os números?": situação da última atualização, de onde vêm os dados,
 * e, recolhidos para a equipe, o que chegou em cada pacote e os avisos da coleta.
 */
export default function SecaoSobreDados({ nivelTitulo = 2 }) {
  const { nivel } = usePreferencias();
  const Titulo = `h${nivelTitulo}`;
  const nivelSecao = nivelTitulo + 1;
  const analise = useAnaliseDoDia();
  const execucao = useExecucao();
  const mercado = useMercado();
  const recarregar = useRecarregarAnalise();
  const { dados } = TEXTOS;
  const [equipeAberta, setEquipeAberta] = useState(false);
  const idEquipe = useId();
  const Sub = `h${nivelSecao}`;

  const carregando = analise.isPending || execucao.isPending;
  const erro = analise.isError || execucao.isError;
  const registro = execucao.data ?? null;

  return (
    <section id="dados" className="secao dados" aria-labelledby="dados-titulo">
      <Titulo id="dados-titulo" className="dados__titulo">
        {porNivel(dados.titulo, nivel)}
      </Titulo>

      {carregando ? (
        <>
          <Carregador rotulo={dados.carregando} />
          <Linhas quantidade={4} />
        </>
      ) : erro ? (
        <BlocoErro onTentarNovamente={recarregar} />
      ) : !registro ? (
        <p>{porNivel(dados.semDado, nivel)}</p>
      ) : (
        <ResumoAtualizacao
          registro={registro}
          dataReferencia={analise.data?.data_referencia}
          dadosAte={mercado.data?.dados_ate ?? null}
          nivelSecao={nivelSecao}
        />
      )}

      <OrigensDados nivelSecao={nivelSecao} />

      <ContasDoSite nivelSecao={nivelSecao} />

      {registro && (
        <section className="dados__bloco dados__equipe" aria-labelledby={`${idEquipe}-titulo`}>
          <Sub id={`${idEquipe}-titulo`} className="dados__subtitulo">
            {dados.equipe.titulo}
          </Sub>
          <p className="dados__equipe-texto">{dados.equipe.texto}</p>
          <BotaoDetalhes
            texto={dados.equipe.abrir}
            aberto={equipeAberta}
            controla={`${idEquipe}-painel`}
            onClick={() => setEquipeAberta((v) => !v)}
          />
          <PainelDetalhes id={`${idEquipe}-painel`} aberto={equipeAberta}>
            <div className="dados__equipe-grade">
              <PacotesAtualizacao registro={registro} nivelSecao={nivelSecao + 1} />
              <AvisosColeta registro={registro} nivelSecao={nivelSecao + 1} />
              <FatosColeta registro={registro} nivelSecao={nivelSecao + 1} />
              <EtapasColeta registro={registro} nivelSecao={nivelSecao + 1} />
            </div>
          </PainelDetalhes>
        </section>
      )}
    </section>
  );
}
