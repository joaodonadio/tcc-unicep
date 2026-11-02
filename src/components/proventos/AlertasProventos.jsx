import { Link } from 'react-router-dom';
import { BellRing, Bell, CalendarClock, Clock, Coins } from 'lucide-react';
import { partesDaData } from '../../lib/agenda.js';
import { diaMes } from '../../lib/datas.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/**
 * Alertas de proventos: data-com chegando, pagamento nesta semana e proventos
 * das ações da lista. Alerta sem itens não aparece; sem nenhum, uma frase.
 * Frases factuais sobre a agenda, nunca indicação de compra.
 */

const T = TEXTOS.proventos;

const tipoTexto = (ev) => (ev.tipo_rotulo === 'JCP' ? 'JCP' : (ev.tipo_rotulo ?? 'provento').toLowerCase());

// `data` é o campo cuja data aparece em destaque no cartão de cada aviso
const ALERTAS = {
  data_com: {
    Icone: Bell,
    titulo: T.alertaDataCom.titulo,
    data: 'data_com',
    frase: (ev) => T.fraseDataCom(ev.ticker, tipoTexto(ev), diaMes(ev.data_com)),
  },
  pagamento: {
    Icone: CalendarClock,
    titulo: T.alertaPagamento.titulo,
    data: 'data_pagamento',
    frase: (ev) => T.frasePagamento(ev.ticker, ev.valor_texto, diaMes(ev.data_pagamento)),
  },
  lista: {
    Icone: Coins,
    titulo: T.alertaLista.titulo,
    data: 'data_pagamento',
    frase: (ev) =>
      T.fraseLista(
        ev.ticker,
        tipoTexto(ev),
        ev.valor_texto,
        ev.data_pagamento ? T.quandoPagamento(diaMes(ev.data_pagamento)) : T.quandoADefinir,
      ),
  },
};

function DataDestaque({ iso }) {
  const p = partesDaData(iso);
  if (!p.dia) return <span className="proventos-data-bloco proventos-data-vazia">{T.dataAdefinir}</span>;
  return (
    <time className="proventos-data-bloco" dateTime={iso} aria-hidden="true">
      <span className="proventos-data-dia">{p.dia}</span>
      <span className="proventos-data-mes">{p.mes}</span>
    </time>
  );
}

export function AlertasProventos({ alertas, nivelTitulo = 3 }) {
  const { nivel } = usePreferencias();
  const T1 = `h${nivelTitulo}`;
  const T2 = `h${nivelTitulo + 1}`;

  return (
    <section className="proventos-bloco proventos-alertas" aria-labelledby="proventos-alertas-titulo">
      <T1 id="proventos-alertas-titulo" className="proventos-bloco-titulo proventos-com-icone">
        <BellRing size={22} aria-hidden="true" />
        <span>{porNivel(T.alertasTitulo, nivel)}</span>
      </T1>
      {alertas.length === 0 ? (
        <p className="proventos-vazio">{porNivel(T.alertasVazio, nivel)}</p>
      ) : (
        <>
          <p className="proventos-como-ler">{porNivel(T.alertasIntro, nivel)}</p>
          <div className="proventos-alertas-grade">
            {alertas.map((alerta) => {
              const { Icone, titulo, frase, data } = ALERTAS[alerta.chave];
              return (
                <article key={alerta.chave} className="proventos-alerta" data-alerta={alerta.chave}>
                  <T2 className="proventos-alerta-titulo">
                    <Icone size={20} aria-hidden="true" />
                    <span>{porNivel(titulo, nivel)}</span>
                  </T2>
                  <ul className="proventos-alerta-lista">
                    {alerta.itens.map((ev) => (
                      <li key={ev.id}>
                        <Link to={`/acao/${ev.ticker}?pergunta=proventos`} className="proventos-alerta-item">
                          <DataDestaque iso={ev[data]} />
                          <span className="proventos-alerta-texto">
                            <span>{frase(ev)}</span>
                            {ev.dias !== null && (
                              <span className="proventos-prazo">
                                <Clock size={14} aria-hidden="true" />
                                <span>{T.prazo(ev.dias)}</span>
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
