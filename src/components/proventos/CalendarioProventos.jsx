import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarioDoMes, somarMeses } from '../../lib/agenda.js';
import { dataBR } from '../../lib/datas.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/**
 * Calendário do mês (domingo a sábado). Dias com pagamento são botões de fundo claro com
 * uma bolinha por pagamento (até 3); tocar num dia lista os pagamentos dele.
 */

const T = TEXTOS.proventos;

export function CalendarioProventos({ eventos, hoje, nivelTitulo = 3 }) {
  const { nivel } = usePreferencias();
  const T1 = `h${nivelTitulo}`;
  const T2 = `h${nivelTitulo + 1}`;
  // abre no mês do próximo pagamento (o mês corrente pode não ter mais nenhum)
  const [mes, setMes] = useState(() => {
    if (!hoje) return '';
    const proximo = (eventos ?? [])
      .map((ev) => ev.data_pagamento)
      .filter((d) => typeof d === 'string' && d >= hoje)
      .sort()[0];
    return (proximo ?? hoje).slice(0, 7);
  });
  const [dia, setDia] = useState(null);

  const semanas = useMemo(() => calendarioDoMes(eventos, mes), [eventos, mes]);
  if (!mes) return null;

  const doDia = dia ? (eventos ?? []).filter((ev) => ev.data_pagamento === dia) : [];
  const totalNoMes = semanas.flat().reduce((s, c) => s + (c?.qtd ?? 0), 0);
  const mudar = (n) => {
    setMes((atual) => somarMeses(atual, n));
    setDia(null);
  };

  return (
    <section className="proventos-bloco proventos-calendario" aria-labelledby="proventos-calendario-titulo">
      <T1 id="proventos-calendario-titulo" className="proventos-bloco-titulo proventos-com-icone">
        <CalendarDays size={22} aria-hidden="true" />
        <span>{porNivel(T.calendarioTitulo, nivel)}</span>
      </T1>
      <p className="proventos-como-ler">{porNivel(T.calendarioDica, nivel)}</p>

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

      <div className="proventos-cal-grade">
        {T.diasSemanaCurto.map((letra, i) => (
          <span key={T.diasSemanaLongo[i]} className="proventos-cal-semana" title={T.diasSemanaLongo[i]} aria-hidden="true">
            {letra}
          </span>
        ))}
        {semanas.flat().map((c, i) => {
          if (!c) return <span key={`v${i}`} className="proventos-cal-vazio" aria-hidden="true" />;
          const ehHoje = c.iso === hoje;
          if (c.qtd === 0) {
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
              aria-label={T.celulaComPagamento(c.dia, c.qtd)}
              onClick={() => setDia((atual) => (atual === c.iso ? null : c.iso))}
            >
              <span>{c.dia}</span>
              <span className="proventos-cal-pontos" aria-hidden="true">
                {Array.from({ length: Math.min(c.qtd, 3) }, (_, k) => (
                  <span key={k} className="proventos-cal-ponto" />
                ))}
                {c.qtd > 3 && <span className="proventos-cal-mais">{T.calendarioMais}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {totalNoMes === 0 && <p className="proventos-vazio">{porNivel(T.mesSemPagamento, nivel)}</p>}

      {dia && (
        <div className="proventos-cal-lista">
          <T2 className="proventos-cal-lista-titulo">{T.listaDoDia(dataBR(dia))}</T2>
          {doDia.length === 0 ? (
            <p className="proventos-vazio">{T.listaDoDiaVazia}</p>
          ) : (
            <ul>
              {doDia.map((ev) => (
                <li key={ev.id}>
                  <Link to={`/acao/${ev.ticker}?pergunta=proventos`} className="proventos-alerta-item">
                    <span>
                      {ev.ticker}
                      {ev.empresa && ev.empresa !== ev.ticker ? ` · ${ev.empresa}` : ''}
                    </span>
                    <span className="proventos-prazo">
                      {ev.tipo_rotulo}
                      {ev.valor_texto ? `, ${ev.valor_texto}` : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
