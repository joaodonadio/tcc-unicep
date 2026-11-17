import { CheckCircle2, Minus, TriangleAlert } from 'lucide-react';
import { usePreferencias } from '../../context/contextos.js';
import { linhasDePacotes } from '../../lib/sobreDados.js';
import { contar, quantidadeCheia } from '../../lib/formato.js';
import { exibirNumero } from '../../lib/valor.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const ICONE_POR_SELO = { atualizado: CheckCircle2, semMudanca: Minus, ausente: TriangleAlert };

/** Quantidade do pacote na linha. Zero não aparece (o ícone de "Sem mudança" já diz isso); ausente vira "—". */
function quantidadeSimples(linha) {
  const { itens } = TEXTOS.dados;
  if (linha.registros === null) return exibirNumero(null);
  if (linha.registros === 0) return '';
  return contar(linha.registros, itens.um, itens.varios);
}

/** O que chegou nesta atualização: quadro com uma linha compacta por pacote enviado. */
export default function PacotesAtualizacao({ registro, nivelSecao = 2 }) {
  const { nivel } = usePreferencias();
  const Sub = `h${nivelSecao}`;
  const { dados } = TEXTOS;
  const linhas = linhasDePacotes(registro);

  if (linhas.length === 0) return null;

  return (
    <section className="dados__bloco dados__quadro" aria-labelledby="dados-pacotes">
      <Sub id="dados-pacotes" className="dados__subtitulo">
        {dados.secoes.pacotes}
      </Sub>
      <ul className="dados__lista entra-cartoes">
        {linhas.map((linha) => {
          const chaveSelo = linha.selo ?? 'ausente';
          const Icone = ICONE_POR_SELO[chaveSelo];
          const rotuloSelo = {
            atualizado: dados.selos.atualizado,
            semMudanca: porNivel(dados.selos.semMudanca, nivel),
            ausente: dados.semQuantidade,
          }[chaveSelo];
          const quantidade = quantidadeSimples(linha);
          return (
            <li className="dados__item" data-selo={chaveSelo} key={linha.chave}>
              <Icone aria-hidden="true" size={18} className="dados__item-icone" />
              <div className="dados__item-corpo">
                <p className="dados__item-nome">
                  <span className="sr-only">{rotuloSelo}. </span>
                  {linha.nome}
                </p>
                {linha.retirados !== null && (
                  <p className="dados__nota-item">{dados.selos.retirados(quantidadeCheia(linha.retirados))}</p>
                )}
                {nivel === 'tecnico' && linha.arquivo && <p className="dados__arquivo">{linha.arquivo}</p>}
                {nivel === 'tecnico' && (
                  <p className="dados__cru">
                    {dados.cru(
                      exibirNumero(linha.registros, quantidadeCheia),
                      exibirNumero(linha.removidos, quantidadeCheia),
                    )}
                  </p>
                )}
              </div>
              {quantidade && <span className="dados__quantidade">{quantidade}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
