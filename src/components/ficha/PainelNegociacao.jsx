import { usePreferencias } from '../../context/contextos.js';
import { useResumo } from '../../hooks/useDados.js';
import { faixaOscilacao } from '../../lib/fichaIndicadores.js';
import { numero, numeroCompacto, quantidade } from '../../lib/formato.js';
import { porNivel, TEXTOS } from '../../lib/textos.js';
import { exibir, valorOuNulo } from '../../lib/valor.js';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';

const N = TEXTOS.ficha.negociacao;
const F = TEXTOS.ficha.frases;

const limitarFracao = (x) => Math.min(1, Math.max(0, x));

/** Status em que a API segurou o número (fora do normal ou sem base); "não se aplica" e prejuízo não contam. */
const RETIDO = new Set(['historico_insuficiente', 'indisponivel']);
const algumRetido = (...campos) => campos.some((c) => c && RETIDO.has(c.status));

/** Uma barra do volume: nome, trilha proporcional (aria-hidden) e o número em texto. */
function BarraVolume({ nome, proporcao, campo }) {
  const numeroTexto = exibir(campo, numeroCompacto);
  return (
    <div className="ficha-negociacao-barra">
      <span className="ficha-negociacao-nome">{nome}</span>
      <span className="ficha-negociacao-trilha" aria-hidden="true">
        {proporcao != null && (
          <span className="ficha-negociacao-preenchimento" style={{ '--v': limitarFracao(proporcao) }} />
        )}
      </span>
      <span className="ficha-negociacao-numero">
        {numeroTexto.texto}
        {numeroTexto.motivo && <span className="valor-motivo">{numeroTexto.motivo}</span>}
      </span>
    </div>
  );
}

/**
 * "Como foi a negociação" na pergunta "Oscila muito?": volume do dia contra a
 * mediana de 20 pregões, e a faixa de oscilação com a posição entre as ações.
 * Ausência mostra o texto de ausência, nunca zero.
 */
export function PainelNegociacao({ ticker }) {
  const { nivel } = usePreferencias();
  const simples = nivel !== 'tecnico';
  const resumo = useResumo(ticker);

  if (resumo.isError) {
    return (
      <BlocoErro
        titulo={TEXTOS.estados.erroTitulo}
        mensagem={resumo.error?.mensagemUsuario}
        onTentarNovamente={resumo.refetch}
      />
    );
  }
  if (resumo.isPending) return <Linhas quantidade={3} />;

  const R = resumo.data ?? null;
  const total = valorOuNulo(R?.volume?.total);
  const mediana = valorOuNulo(R?.volume?.mediana_20);
  const escala = [total, mediana].filter((v) => v != null);
  const maior = escala.length ? Math.max(...escala) : 0;
  const relativoTexto = valorOuNulo(R?.volume?.relativo) != null ? (R.volume.relativo.texto ?? null) : null;
  const posicaoVolume = valorOuNulo(R?.volume?.posicao_pct);

  const posicao = valorOuNulo(R?.volatilidade_20d?.posicao_pct);
  const faixa = faixaOscilacao(posicao);
  const textoOscilacao = R?.volatilidade_20d?.texto ?? null;

  return (
    <div className="ficha-negociacao">
      <h3 className="ficha-grupo-titulo">{N.titulo}</h3>

      <div className="ficha-negociacao-bloco">
        <h4 className="ficha-negociacao-rotulo">
          <BotaoTermo chave="volume">{N.volume}</BotaoTermo>
        </h4>
        {simples && total != null && mediana != null && (
          <p className="ficha-negociacao-frase">{F.volume(quantidade(total), quantidade(mediana))}</p>
        )}
        {total == null ? (
          <p className="ficha-nota">{N.volumeAusente}</p>
        ) : (
          <>
            <BarraVolume nome={N.volume} proporcao={maior > 0 ? total / maior : null} campo={R.volume.total} />
            <BarraVolume
              nome={N.mediana}
              proporcao={mediana != null && maior > 0 ? mediana / maior : null}
              campo={R.volume.mediana_20}
            />
            {relativoTexto && <p className="ficha-negociacao-frase">{relativoTexto}</p>}
            {posicaoVolume != null && (
              <p className="ficha-negociacao-frase">
                {simples
                  ? N.volumeMaiorQue(numero(Math.round(posicaoVolume * 100), { casas: 0 }))
                  : N.volumePercentil(numero(Math.round(posicaoVolume * 100), { casas: 0 }))}
              </p>
            )}
          </>
        )}
      </div>

      <div className="ficha-negociacao-bloco">
        <h4 className="ficha-negociacao-rotulo">
          <BotaoTermo chave="volatilidade">{N.oscilacao}</BotaoTermo>
        </h4>
        {simples && faixa && <p className="ficha-negociacao-frase">{F.oscilacao(N.faixas[faixa].toLowerCase())}</p>}
        {posicao == null ? (
          <p className="ficha-nota">{N.semOscilacao}</p>
        ) : (
          <>
            <p className="ficha-negociacao-faixa">{N.faixa(N.faixas[faixa])}</p>
            <div className="ficha-regua" aria-hidden="true">
              <span className="ficha-regua-marca" style={{ '--v': limitarFracao(posicao) }} />
            </div>
            <p className="ficha-negociacao-frase">
              {simples
                ? N.oscilaMais(numero(Math.round(posicao * 100), { casas: 0 }))
                : TEXTOS.ficha.tec.percentil(numero(Math.round(posicao * 100), { casas: 0 }))}
            </p>
          </>
        )}
        {textoOscilacao && <p className="ficha-negociacao-frase">{textoOscilacao}</p>}
      </div>

      {algumRetido(R?.volume?.total, R?.volume?.mediana_20, R?.volume?.relativo, R?.volume?.posicao_pct, R?.volatilidade_20d) && (
        <p className="ficha-nota">{porNivel(N.retido, nivel)}</p>
      )}
    </div>
  );
}
