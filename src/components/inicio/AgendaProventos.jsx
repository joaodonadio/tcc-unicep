import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { useAgendaProventos } from '../../hooks/useAgenda.js';
import { agruparPorSemana, partesDaData } from '../../lib/agenda.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';

/**
 * Próximos pagamentos de proventos das ações acompanhadas. Busca os próprios
 * dados: carregamento e erro ficam só neste bloco, sem travar a página.
 */

const T = TEXTOS.proventos;

const EXPLICA_TIPO = {
  DIVIDENDO: 'Dividendo: parte do lucro paga em dinheiro aos acionistas.',
  JCP: 'JCP: juros sobre capital próprio, outra forma de repassar lucro aos acionistas, com imposto descontado na fonte.',
};

const ROTULO_DO_GRUPO = {
  esta_semana: TEXTOS.dia.estaSemana,
  proxima_semana: TEXTOS.dia.proximaSemana,
  mais_adiante: TEXTOS.dia.maisAdiante,
};

/** Quantos pagamentos aparecem antes de "Mostrar todos". */
const LIMITE = 8;

/** Corta os grupos para caberem `limite` itens no total, mantendo a ordem. */
function cortarGrupos(grupos, limite) {
  let resta = limite;
  return grupos
    .map((g) => {
      const itens = g.itens.slice(0, Math.max(resta, 0));
      resta -= itens.length;
      return { ...g, itens };
    })
    .filter((g) => g.itens.length > 0);
}

export function AgendaProventos({ nivelTitulo = 3 }) {
  const { nivel } = usePreferencias();
  const T1 = `h${nivelTitulo}`;
  const T2 = `h${nivelTitulo + 1}`;
  const { data, hoje, falhas, isPending, isError, error, refetch } = useAgendaProventos();
  const [todos, setTodos] = useState(false);
  const futuros = data?.futuros ?? [];
  const aDefinir = data?.a_definir ?? [];
  const tickersADefinir = [...new Set(aDefinir.map((a) => a.ticker))].join(', ');
  const gruposCompletos = agruparPorSemana(futuros, hoje);
  const grupos = todos ? gruposCompletos : cortarGrupos(gruposCompletos, LIMITE);
  const escondidos = futuros.length - LIMITE;

  let conteudo;
  if (isError) {
    conteudo = (
      <BlocoErro
        titulo={TEXTOS.dia.proventosErro}
        mensagem={error?.mensagemUsuario ?? TEXTOS.dia.erro}
        onTentarNovamente={refetch}
      />
    );
  } else if (isPending) {
    conteudo = (
      <div role="status">
        <p className="proventos-status">{TEXTOS.dia.proventosCarregando}</p>
        <Linhas quantidade={6} />
      </div>
    );
  } else if (futuros.length === 0) {
    conteudo = <p className="proventos-vazio">{TEXTOS.dia.semProventos}</p>;
  } else {
    conteudo = grupos.map((grupo) => (
      <div key={grupo.chave} className="proventos-ag-grupo">
        <T2 className="proventos-ag-grupo-titulo">{ROTULO_DO_GRUPO[grupo.chave] ?? grupo.rotulo}</T2>
        <ol className="proventos-ag-lista">
          {grupo.itens.map((ev) => {
            const data = partesDaData(ev.data_pagamento);
            return (
              <li key={ev.id}>
                <Link className="proventos-ag-item" to={`/acao/${ev.ticker}?pergunta=proventos`}>
                  <time className="proventos-data-bloco" dateTime={ev.data_pagamento} title={TEXTOS.dia.pagamento(ev.data_extenso)}>
                    <span className="proventos-data-dia">{data.dia}</span>
                    <span className="proventos-data-mes">{data.mes}</span>
                  </time>
                  <span className="proventos-ag-quem">
                    <span className="proventos-ag-ticker">{ev.ticker}</span>
                    {ev.empresa && ev.empresa !== ev.ticker && <span className="proventos-ag-empresa"> · {ev.empresa}</span>}
                    <span className="proventos-ag-com">{TEXTOS.dia.dataCom(ev.data_com_texto || TEXTOS.dia.naoInformada)}</span>
                  </span>
                  <span className="proventos-ag-meta">
                    <span className="proventos-ag-tipo" data-tipo={ev.tipo === 'JCP' ? 'jcp' : 'dividendo'} title={EXPLICA_TIPO[ev.tipo] ?? undefined}>
                      {ev.tipo_rotulo}
                    </span>
                    <span className="proventos-ag-valor">
                      {ev.valor_texto ? (
                        <>
                          {ev.valor_texto}
                          <small> por ação</small>
                        </>
                      ) : (
                        T.valorNaoInformado
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    ));
  }

  return (
    <section className="proventos-bloco proventos-agenda" aria-labelledby="agenda-proventos-titulo" aria-busy={isPending}>
      <T1 id="agenda-proventos-titulo" className="proventos-bloco-titulo proventos-com-icone">
        <CalendarClock size={22} aria-hidden="true" />
        <span>{TEXTOS.dia.proventos}</span>
      </T1>
      <p className="proventos-como-ler">
        {TEXTOS.dia.proventosNota} <BotaoTermo chave="data_com">{T.termoDataCom}</BotaoTermo>{' '}
        {porNivel(T.agendaNota, nivel)}
      </p>

      <div className="proventos-ag-moldura" data-expandida={todos || undefined}>
        <div className="proventos-ag-rolagem" role="region" aria-label={T.agendaRolagem} tabIndex={0}>
          {conteudo}
        </div>
      </div>

      {!isPending && !isError && escondidos > 0 && (
        <button type="button" className="proventos-ag-mais" aria-expanded={todos} onClick={() => setTodos((v) => !v)}>
          {todos ? T.agendaMostrarMenos : TEXTOS.dia.mostrarTodosProventos(futuros.length)}
        </button>
      )}

      {aDefinir.length > 0 && <p className="proventos-rodape">{TEXTOS.dia.aDefinir(aDefinir.length, tickersADefinir)}</p>}
      {falhas.length > 0 && <p className="proventos-rodape">{TEXTOS.dia.falhasProventos(falhas.length)}</p>}
    </section>
  );
}
