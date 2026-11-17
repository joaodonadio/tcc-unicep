import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { calendarioDoMes, diasEntre, somarMeses } from '../../lib/agenda.js';
import { dataBR } from '../../lib/datas.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/**
 * Calendário de proventos do mês (domingo a sábado). Bolinha marca o pagamento; losango
 * marca a data-com. Tocar num dia lista os proventos dele no painel ao lado.
 */

const T = TEXTOS.proventos;
const MAX_OUTROS_DIAS = 6;
const MAX_TICKERS_NA_LINHA = 3;

// menor data (pagamento ou data-com) que começa com o prefixo; sem prefixo, a menor de todas
function menorData(eventos, prefixo = '') {
  let menor = null;
  for (const ev of eventos) {
    for (const d of [ev.data_pagamento, ev.data_com]) {
      if (d && d.startsWith(prefixo) && (menor === null || d < menor)) menor = d;
    }
  }
  return menor;
}

export function CalendarioProventos({ eventos, hoje, nivelTitulo = 3 }) {
  const { nivel } = usePreferencias();
  const Titulo = `h${nivelTitulo}`;
  const Sub = `h${nivelTitulo + 1}`;

  // só datas de hoje em diante entram no calendário
  const vigentes = useMemo(
    () =>
      (eventos ?? []).map((ev) => ({
        ...ev,
        data_pagamento: ev.data_pagamento && ev.data_pagamento >= hoje ? ev.data_pagamento : null,
        data_com: ev.data_com && ev.data_com >= hoje ? ev.data_com : null,
      })),
    [eventos, hoje],
  );

  // abre no mês do próximo evento, com esse dia já selecionado
  const [mes, setMes] = useState(() => (menorData(vigentes) ?? hoje ?? '').slice(0, 7));
  const [dia, setDia] = useState(() => menorData(vigentes));
  const [sentido, setSentido] = useState(1);

  // semana toda vazia no fim do mês não vira linha na grade
  const semanas = useMemo(
    () => calendarioDoMes(vigentes, mes).filter((semana) => semana.some(Boolean)),
    [vigentes, mes],
  );
  if (!mes) return null;

  const dias = dia ? diasEntre(hoje, dia) : null;
  const itens = dia
    ? [
        ...vigentes.filter((ev) => ev.data_pagamento === dia).map((ev) => ({ ev, tipo: 'pagamento' })),
        ...vigentes.filter((ev) => ev.data_com === dia).map((ev) => ({ ev, tipo: 'com' })),
      ]
    : [];

  // outros dias do mês, para o painel não ficar vazio em dia com um evento só
  const outrosDias = semanas
    .flat()
    .filter((c) => c && c.iso !== dia && c.qtd + c.com > 0)
    .slice(0, Math.max(2, MAX_OUTROS_DIAS - itens.length))
    .map((c) => ({
      iso: c.iso,
      tickers: [
        ...new Set(vigentes.filter((ev) => ev.data_pagamento === c.iso || ev.data_com === c.iso).map((ev) => ev.ticker)),
      ],
    }));

  // muda o mês e seleciona o primeiro dia com evento dele (ou nenhum)
  const mudar = (n) => {
    setSentido(n);
    setMes(somarMeses(mes, n));
    setDia(menorData(vigentes, somarMeses(mes, n)));
  };

  return (
    <section className="proventos-cal" aria-labelledby="proventos-calendario-titulo">
      <Titulo id="proventos-calendario-titulo" className="proventos-bloco-titulo proventos-com-icone">
        <CalendarDays size={22} aria-hidden="true" />
        <span>{porNivel(T.calendarioTitulo, nivel)}</span>
      </Titulo>
      <p className="proventos-como-ler">{porNivel(T.calendarioDica, nivel)}</p>

      <div className="proventos-cal-corpo">
        <div className="proventos-cal-esquerda">
          <div className="proventos-cal-cabeca">
            <button type="button" className="proventos-cal-nav" aria-label={T.mesAnterior} onClick={() => mudar(-1)}>
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <p className="proventos-cal-mes" aria-live="polite">
              {T.meses[Number(mes.slice(5, 7)) - 1]} de {mes.slice(0, 4)}
            </p>
            <button type="button" className="proventos-cal-nav" aria-label={T.proximoMes} onClick={() => mudar(1)}>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div key={mes} className="proventos-cal-grade" style={{ '--sentido': sentido }}>
            {T.diasSemanaCurto.map((letra, i) => (
              <span key={T.diasSemanaLongo[i]} className="proventos-cal-semana" title={T.diasSemanaLongo[i]} aria-hidden="true">
                {letra}
              </span>
            ))}
            {semanas.flat().map((c, i) => {
              if (!c) return <span key={`v${i}`} className="proventos-cal-vazio" aria-hidden="true" />;
              const ehHoje = c.iso === hoje;
              if (c.qtd + c.com === 0) {
                return (
                  <span key={c.iso} className="proventos-cal-dia" data-hoje={ehHoje || undefined} aria-hidden="true">
                    {c.dia}
                  </span>
                );
              }
              return (
                <button
                  key={c.iso}
                  type="button"
                  className="proventos-cal-dia proventos-cal-dia-pag"
                  data-hoje={ehHoje || undefined}
                  aria-pressed={dia === c.iso}
                  aria-label={T.celulaComEventos(dataBR(c.iso), c.qtd, c.com)}
                  onClick={() => setDia(c.iso)}
                >
                  <span>{c.dia}</span>
                  <span className="proventos-cal-marcas" aria-hidden="true">
                    {Array.from({ length: Math.min(c.qtd, 3) }, (_, k) => (
                      <span key={`p${k}`} className="proventos-cal-marca proventos-cal-marca-pag" />
                    ))}
                    {Array.from({ length: Math.min(c.com, 3) }, (_, k) => (
                      <span key={`c${k}`} className="proventos-cal-marca proventos-cal-marca-com" />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="proventos-cal-legenda">
            <span>
              <span className="proventos-cal-marca proventos-cal-marca-pag" aria-hidden="true" />
              {T.legendaPagamento}
            </span>
            <span>
              <span className="proventos-cal-marca proventos-cal-marca-com" aria-hidden="true" />
              {T.termoDataCom}
            </span>
          </p>
        </div>

        <div key={dia ?? 'sem-dia'} className="proventos-cal-painel">
          {dia ? (
            <>
              <Sub className="proventos-cal-painel-titulo">{T.listaDoDia(dataBR(dia))}</Sub>
              <ul className="proventos-cal-itens">
                {itens.map(({ ev, tipo }) => (
                  <li key={`${ev.id}-${tipo}`}>
                    <Link to={`/acao/${ev.ticker}?pergunta=proventos`} className="proventos-cal-item">
                      <span className="proventos-cal-item-corpo">
                        <span className="proventos-cal-item-topo">
                          <span className="num proventos-cal-ticker">{ev.ticker}</span>
                          {ev.empresa && ev.empresa !== ev.ticker && (
                            <span className="proventos-cal-empresa">{ev.empresa}</span>
                          )}
                        </span>
                        <span className="proventos-cal-item-tipo">
                          {tipo === 'pagamento' ? T.legendaPagamento : T.termoDataCom}
                          {ev.tipo_rotulo ? ` · ${ev.tipo_rotulo}` : ''}
                          {ev.valor_texto ? ` · ${ev.valor_texto}` : ''}
                        </span>
                      </span>
                      {dias !== null && (
                        <span className="proventos-prazo">
                          <Clock size={14} aria-hidden="true" />
                          <span>{T.prazo(dias)}</span>
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              {outrosDias.length > 0 && (
                <>
                  <p className="proventos-cal-outros-titulo">{T.outrosDiasDoMes}</p>
                  <ul className="proventos-cal-outros">
                    {outrosDias.map(({ iso, tickers }) => (
                      <li key={iso}>
                        <button type="button" className="proventos-cal-outro" onClick={() => setDia(iso)}>
                          <span className="num">{dataBR(iso).slice(0, 5)}</span>
                          <span className="proventos-cal-outro-nomes">
                            {tickers.slice(0, MAX_TICKERS_NA_LINHA).join(', ')}
                            {tickers.length > MAX_TICKERS_NA_LINHA && ` +${tickers.length - MAX_TICKERS_NA_LINHA}`}
                          </span>
                          <span className="proventos-cal-outro-prazo">{T.prazo(diasEntre(hoje, iso))}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="proventos-vazio">{porNivel(T.mesSemPagamento, nivel)}</p>
          )}
        </div>
      </div>
    </section>
  );
}
