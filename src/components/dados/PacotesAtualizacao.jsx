import { usePreferencias } from '../../context/contextos.js';
import { linhasDePacotes } from '../../lib/sobreDados.js';
import { contar, quantidadeCheia } from '../../lib/formato.js';
import { exibirNumero } from '../../lib/valor.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/** Quantidade do pacote na linguagem simples. Zero não aparece: o selo "Sem mudança" já diz isso. */
function quantidadeSimples(linha) {
  const { itens, semQuantidade } = TEXTOS.dados;
  if (linha.registros === null) return semQuantidade;
  if (linha.registros === 0) return '';
  return contar(linha.registros, itens.um, itens.varios);
}

/** O que chegou nesta atualização: um cartão por pacote enviado. */
export default function PacotesAtualizacao({ registro, nivelSecao = 2 }) {
  const { nivel } = usePreferencias();
  const Sub = `h${nivelSecao}`;
  const Cabeca = `h${nivelSecao + 1}`;
  const { dados } = TEXTOS;
  const linhas = linhasDePacotes(registro);

  if (linhas.length === 0) return null;

  return (
    <section className="dados__bloco" aria-labelledby="dados-pacotes">
      <Sub id="dados-pacotes" className="dados__subtitulo">
        {dados.secoes.pacotes}
      </Sub>
      <ul className="dados__grade">
        {linhas.map((linha) => {
          const quantidade = quantidadeSimples(linha);
          return (
            <li className="dados__cartao" key={linha.chave}>
              <Cabeca className="dados__cartao-titulo">{linha.nome}</Cabeca>
              {nivel === 'tecnico' && linha.arquivo && <p className="dados__arquivo">{linha.arquivo}</p>}
              {quantidade && <p className="dados__quantidade">{quantidade}</p>}
              <div className="dados__selos">
                {linha.selo === 'atualizado' && (
                  <span className="pilula" data-tom="alta">
                    {dados.selos.atualizado}
                  </span>
                )}
                {linha.selo === 'semMudanca' && (
                  <span className="pilula" data-tom="neutro">
                    {porNivel(dados.selos.semMudanca, nivel)}
                  </span>
                )}
                {linha.retirados !== null && (
                  <span className="pilula" data-tom="acento">
                    {dados.selos.retirados(quantidadeCheia(linha.retirados))}
                  </span>
                )}
              </div>
              {nivel === 'tecnico' && (
                <p className="dados__cru">
                  {dados.cru(
                    exibirNumero(linha.registros, quantidadeCheia),
                    exibirNumero(linha.removidos, quantidadeCheia),
                  )}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
