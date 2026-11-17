import { useMemo } from 'react';
import { usePreferencias } from '../../context/contextos.js';
import { useProventos } from '../../hooks/useDados.js';
import { juntarPayout, listaPagamentos, proventosPorAno } from '../../lib/proventos.js';
import { brl, pct } from '../../lib/formato.js';
import { EXPLICACOES } from '../../lib/explicacoes.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { BlocoErro, BlocoVazio, Linhas } from '../ui/Estados.jsx';
import { TextoComTermo } from '../ui/TextoComTermo.jsx';

const P = TEXTOS.ficha.proventos;
const T = TEXTOS.ficha.tec;
const F = TEXTOS.ficha.frases;
const ULTIMOS_SIMPLES = 4;

const EXPLICA_TIPO = {
  DIVIDENDO: P.explicaDividendo,
  JCP: P.explicaJcp,
};

/** Frase de leitura do gráfico, gerada dos totais por ano; sem total em nenhum ano, null. */
function fraseProventos(porAno) {
  const comTotal = porAno.filter((a) => a.total != null);
  const atual = comTotal[comTotal.length - 1];
  if (!atual) return null;
  const anterior = comTotal[comTotal.length - 2];
  return anterior
    ? F.proventosAnoAnterior(atual.ano, brl(atual.total), anterior.ano, brl(anterior.total))
    : F.proventosAno(atual.ano, brl(atual.total));
}

const brlOuTraco = (v) => (v == null ? '—' : brl(v));

/** Proventos da ficha: barras por ano (dividendo, JCP e outros) e lista de pagamentos. */
export function PainelProventos({ ticker, resumo }) {
  const { nivel } = usePreferencias();
  const simples = nivel !== 'tecnico';
  const proventos = useProventos(ticker);
  const porAno = useMemo(
    () =>
      juntarPayout(
        proventosPorAno(proventos.data, { porAnoResumo: resumo?.proventos_por_ano }),
        resumo?.payout_por_ano,
      ),
    [proventos.data, resumo],
  );
  const pagamentos = useMemo(() => listaPagamentos(proventos.data), [proventos.data]);

  if (proventos.isError) {
    return (
      <BlocoErro
        titulo={P.indisponiveis}
        mensagem={proventos.error?.mensagemUsuario}
        onTentarNovamente={proventos.refetch}
      />
    );
  }
  if (proventos.isPending) return <Linhas quantidade={5} />;

  const temAlgo = porAno.some((a) => a.total != null || a.total_resumo != null);
  if (!temAlgo) return <BlocoVazio titulo={porNivel(TEXTOS.ficha.semProventos, nivel)} />;

  const maior = Math.max(0, ...porAno.filter((a) => a.total != null).map((a) => a.total));
  const temOutros = porAno.some((a) => a.outros > 0);
  const frase = fraseProventos(porAno);

  return (
    <div className="ficha-proventos">
      {simples && (
        <p className="ficha-nota">
          {EXPLICACOES.proventos.simples} <TextoComTermo chave="data_com" texto={P.abertura} />
        </p>
      )}
      {simples && frase && <p className="ficha-leitura-frase">{frase}</p>}

      <ul className="ficha-prov-grafico" aria-label={P.grafico}>
        {porAno.map((a) => (
          <li className="ficha-prov-ano" key={a.ano}>
            <div className="ficha-prov-coluna" aria-hidden="true">
              {maior > 0 &&
                [
                  ['dividendo', 'dividendo'],
                  ['jcp', 'jcp'],
                  ['outros', 'outros'],
                ].map(([campo, modificador]) =>
                  a[campo] > 0 ? (
                    <span
                      key={campo}
                      className={`ficha-prov-parte ficha-prov-parte--${modificador}`}
                      style={{ '--parte': `${(a[campo] / maior) * 100}%` }}
                    />
                  ) : null,
                )}
            </div>
            <span className="ficha-prov-rotulo">{a.ano}</span>
            <span className="ficha-prov-total">{a.total == null ? P.semRegistro : brl(a.total)}</span>
            {a.total_resumo != null && <span className="ficha-prov-conferencia">{P.resumoConf(brl(a.total_resumo))}</span>}
            {a.payout != null && (
              <span className="ficha-prov-conferencia">{P.payoutConf(pct(a.payout, { casas: 0, sinal: false }))}</span>
            )}
            <span className="sr-only">
              {a.total == null
                ? P.semRegistroAno(a.ano)
                : P.detalheAno(a.ano, brl(a.dividendo), brl(a.jcp), brl(a.total))}
            </span>
          </li>
        ))}
      </ul>

      {simples && porAno.some((a) => a.payout != null) && <p className="ficha-nota">{P.payoutNota}</p>}

      <ul className="ficha-prov-legenda" aria-label={P.legenda}>
        <li>
          <i className="ficha-prov-cor ficha-prov-parte--dividendo" aria-hidden="true" /> <BotaoTermo chave="dividendo">{P.dividendo}</BotaoTermo>
        </li>
        <li>
          <i className="ficha-prov-cor ficha-prov-parte--jcp" aria-hidden="true" /> <BotaoTermo chave="jcp">{P.jcp}</BotaoTermo>
        </li>
        {temOutros && (
          <li>
            <i className="ficha-prov-cor ficha-prov-parte--outros" aria-hidden="true" /> {P.outros}
          </li>
        )}
      </ul>

      {simples ? (
        <>
          <h3 className="ficha-grupo-titulo">{T.ultimosPagamentos}</h3>
          <ul className="ficha-prov-ultimos">
            {pagamentos.slice(0, ULTIMOS_SIMPLES).map((p) => (
              <li key={p.id}>{T.itemPagamento(p.data_com_texto, p.tipo_rotulo, p.valor_texto)}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="ficha-rolagem" role="region" aria-label={T.porAnoRegiao} tabIndex={0}>
            <table className="ficha-tab">
              <caption className="sr-only">{T.porAno}</caption>
              <thead>
                <tr>
                  <th scope="col">{T.colAno}</th>
                  <th scope="col" className="ficha-tab-num">{T.colDividendo}</th>
                  <th scope="col" className="ficha-tab-num">{T.colJcp}</th>
                  <th scope="col" className="ficha-tab-num">{T.colOutros}</th>
                  <th scope="col" className="ficha-tab-num">{T.colTotal}</th>
                  <th scope="col" className="ficha-tab-num">{T.colResumo}</th>
                  <th scope="col" className="ficha-tab-num">{T.colPayout}</th>
                </tr>
              </thead>
              <tbody>
                {[...porAno].reverse().map((a) => (
                  <tr key={a.ano}>
                    <th scope="row">{a.ano}</th>
                    <td className="ficha-tab-num" data-rotulo={T.colDividendo}>{brlOuTraco(a.dividendo)}</td>
                    <td className="ficha-tab-num" data-rotulo={T.colJcp}>{brlOuTraco(a.jcp)}</td>
                    <td className="ficha-tab-num" data-rotulo={T.colOutros}>{brlOuTraco(a.outros)}</td>
                    <td className="ficha-tab-num" data-rotulo={T.colTotal}>{brlOuTraco(a.total)}</td>
                    <td className="ficha-tab-num" data-rotulo={T.colResumo}>{brlOuTraco(a.total_resumo)}</td>
                    <td className="ficha-tab-num" data-rotulo={T.colPayout}>
                      {a.payout == null ? '—' : pct(a.payout, { casas: 0, sinal: false })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ficha-rolagem" role="region" aria-label={P.pagamentos} tabIndex={0}>
            <table className="ficha-tab">
              <caption className="sr-only">{P.pagamentosCaption}</caption>
              <thead>
                <tr>
                  <th scope="col">{P.dataCom}</th>
                  <th scope="col">{P.pagamento}</th>
                  <th scope="col">{P.tipo}</th>
                  <th scope="col" className="ficha-tab-num">{P.valorPorAcao}</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td data-rotulo={P.dataCom}>{p.data_com_texto}</td>
                    <td data-rotulo={P.pagamento}>{p.pagamento_texto}</td>
                    <td title={EXPLICA_TIPO[p.tipo] ?? undefined} data-rotulo={P.tipo}>{p.tipo_rotulo}</td>
                    <td className="ficha-tab-num" data-rotulo={P.valorPorAcao}>{p.valor_texto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
