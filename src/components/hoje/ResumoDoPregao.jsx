import { Link } from 'react-router-dom';
import { usePreferencias } from '../../context/contextos.js';
import { pct, quantidadeCheia } from '../../lib/formato.js';
import { partesDaAmplitude } from '../../lib/hoje.js';
import { direcaoDe } from '../../lib/mapaPregao.js';
import { humorDaVariacao } from '../../lib/mascote.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import Mascote from '../ui/Mascote.jsx';
import { Variacao } from './Variacao.jsx';

const F = TEXTOS.hoje.fatos;

/** Um fato na sub-superfície: rótulo, valor e, se houver, um detalhe abaixo. */
function Fato({ rotulo, children, detalhe }) {
  return (
    <div className="hoje-fato">
      <dt>{rotulo}</dt>
      <dd>{children}</dd>
      {detalhe}
    </div>
  );
}

/** Ticker da maior alta ou queda, com a variação e o nome da empresa embaixo. */
function Destaque({ item }) {
  return (
    <>
      <Link className="hoje-link" to={`/acao/${item.ticker}`}>
        {item.ticker}
      </Link>{' '}
      <Variacao valor={item.variacao} />
    </>
  );
}

/** Uma contagem do Subiram/caíram: número e palavra não quebram; o "·" fica na frente da seguinte. */
function Contagem({ n, palavra, parte, separador = false }) {
  return (
    <span className="hoje-fato-par">
      {separador && <span className="hoje-fato-ponto">· </span>}
      <span data-parte={parte}>
        <span className="num">{quantidadeCheia(n)}</span> {palavra}
      </span>
    </span>
  );
}

/**
 * Resumo do pregão: frase-guia com o Ibovespa, o Cotinha e uma fileira de fatos.
 * Sem `fatos` (ou sem pontos do Ibovespa), mostra o parágrafo `resumo` como antes.
 * Ausente (null) não aparece; nunca vira 0.
 */
export function ResumoDoPregao({ fatos, resumo }) {
  const { nivel } = usePreferencias();
  const t = (chave) => porNivel(F[chave], nivel);
  const ibov = fatos?.ibov;

  if (!Number.isFinite(ibov?.pontos)) {
    return (
      <div className="hoje-resumo-linha">
        <Mascote humor={humorDaVariacao(ibov?.variacao)} className="hoje-pavio" />
        <p className="hoje-resumo">{resumo}</p>
      </div>
    );
  }

  const temVariacao = Number.isFinite(ibov.variacao);
  const direcao = direcaoDe(ibov.variacao);
  const amp = fatos.amplitude;
  const partes = partesDaAmplitude(amp);
  const itens = [];

  if (partes) {
    itens.push(
      <Fato
        key="amplitude"
        rotulo={t('amplitude')}
        detalhe={
          <div className="hoje-fato-regua" aria-hidden="true">
            <span data-parte="alta" style={{ flexGrow: partes.alta }} />
            <span data-parte="estavel" style={{ flexGrow: partes.estavel }} />
            <span data-parte="queda" style={{ flexGrow: partes.queda }} />
          </div>
        }
      >
        {/* cada contagem não quebra no meio; o "·" vai com a contagem seguinte */}
        <Contagem parte="alta" n={amp.subiram} palavra={F.subiu(amp.subiram)} />{' '}
        <Contagem parte="queda" separador n={amp.cairam} palavra={F.caiu(amp.cairam)} />
        {amp.estaveis > 0 && (
          <>
            {' '}
            <Contagem parte="estavel" separador n={amp.estaveis} palavra={F.estaveis(amp.estaveis)} />
          </>
        )}
      </Fato>,
    );
  }

  if (fatos.maior_alta && Number.isFinite(fatos.maior_alta.variacao)) {
    itens.push(
      <Fato key="alta" rotulo={t('maiorAlta')} detalhe={<p className="hoje-fato-empresa">{fatos.maior_alta.empresa}</p>}>
        <Destaque item={fatos.maior_alta} />
      </Fato>,
    );
  }

  if (fatos.maior_queda && Number.isFinite(fatos.maior_queda.variacao)) {
    itens.push(
      <Fato key="queda" rotulo={t('maiorQueda')} detalhe={<p className="hoje-fato-empresa">{fatos.maior_queda.empresa}</p>}>
        <Destaque item={fatos.maior_queda} />
      </Fato>,
    );
  }

  if (fatos.dolar && !fatos.dolar.suspeito && Number.isFinite(fatos.dolar.variacao)) {
    itens.push(
      <Fato key="dolar" rotulo={t('dolar')}>
        <Variacao valor={fatos.dolar.variacao} />
      </Fato>,
    );
  }

  if (Number.isFinite(fatos.brent?.variacao)) {
    itens.push(
      <Fato key="brent" rotulo={t('brent')}>
        <Variacao valor={fatos.brent.variacao} />
      </Fato>,
    );
  }

  return (
    <>
      <div className="hoje-resumo-linha">
        <Mascote humor={humorDaVariacao(ibov.variacao)} className="hoje-pavio" />
        <p className="hoje-lead">
          {t('leadInicio')} <span className="num">{quantidadeCheia(ibov.pontos)}</span> {t('leadPontos')}
          {temVariacao && (
            <>
              , <span className="num hoje-lead-var" data-sinal={direcao}>{pct(ibov.variacao)}</span> {t('leadVariacao')}
            </>
          )}
          .
        </p>
      </div>

      {itens.length > 0 && <dl className="hoje-fatos">{itens}</dl>}
    </>
  );
}
