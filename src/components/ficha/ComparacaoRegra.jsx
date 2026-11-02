import { TEXTOS } from '../../lib/textos.js';

const F = TEXTOS.ficha;

/**
 * Número como aparece na tela ("12,3%", "+5,1%", "1,5×", "R$ 15,4 bi"). Negativo ("−1,2%")
 * ou outro formato não entra: a barra só compara o que dá para ler sem chutar.
 */
const NUMERO_EXIBIDO = /^(R\$ )?(\+?)(\d+(?:\.\d{3})*(?:,\d+)?) ?(%|×|x|bi|mi|mil)?$/;

function lerComparavel(texto) {
  const casa = NUMERO_EXIBIDO.exec(String(texto ?? '').trim());
  if (!casa) return null;
  const valor = Number(casa[3].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(valor) ? { valor, unidade: `${casa[1] ?? ''}${casa[4] ?? ''}` } : null;
}

/** Fração de cada barra (ação e setor) na mesma escala; null se não der para comparar. */
function barrasDe(valor, comparado) {
  const acao = lerComparavel(valor);
  const setor = lerComparavel(comparado);
  if (!acao || !setor || acao.unidade !== setor.unidade) return null;
  const maximo = Math.max(acao.valor, setor.valor);
  if (maximo === 0) return { acao: 0, setor: 0 };
  return { acao: acao.valor / maximo, setor: setor.valor / maximo };
}

/** Uma ficha com rótulo e valor; a barra só aparece quando há fração para ela. */
function Ficha({ papel, rotulo, valor, fracao }) {
  return (
    <div className="ficha-ficha" data-papel={papel}>
      <span className="ficha-ficha__rotulo">{rotulo}</span>
      <span className="ficha-ficha__valor">{valor}</span>
      {fracao != null && (
        <span className="ficha-barra" aria-hidden="true">
          <span className="ficha-barra__preench" style={{ width: `${fracao * 100}%` }} />
        </span>
      )}
    </div>
  );
}

/**
 * Números de uma regra. Linhas sem referência viram uma fileira de cartões (cada um com o próprio
 * rótulo); linhas com referência mantêm ação e setor lado a lado, com barras na mesma escala.
 */
export default function ComparacaoRegra({ dados, comSetor }) {
  const comRef = dados.filter((d) => comSetor && d.comparado);
  const semRef = dados.filter((d) => !comRef.includes(d));

  return (
    <div className="regra-comparacao">
      {semRef.length > 0 && (
        <dl className="regra-comparacao__cartoes">
          {semRef.map((d, i) => (
            <div
              key={d.rotulo}
              className={i === 0 ? 'regra-comparacao__cartao regra-comparacao__cartao--acao' : 'regra-comparacao__cartao'}
            >
              <dt className="regra-comparacao__legenda">{d.rotulo}</dt>
              <dd className="regra-comparacao__numero">{d.valor}</dd>
            </div>
          ))}
        </dl>
      )}
      {comRef.length > 0 && (
        <dl className="regra-comparacao__blocos">
          {comRef.map((d) => {
            const barras = barrasDe(d.valor, d.comparado);
            return (
              <div key={d.rotulo} className="regra-comparacao__linha">
                <dt className="regra-comparacao__rotulo">{d.rotulo}</dt>
                <dd className="regra-comparacao__valores">
                  <Ficha papel="acao" rotulo={F.colunaAcao} valor={d.valor} fracao={barras?.acao} />
                  <Ficha papel="setor" rotulo={F.colunaSetor} valor={d.comparado} fracao={barras?.setor} />
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}
