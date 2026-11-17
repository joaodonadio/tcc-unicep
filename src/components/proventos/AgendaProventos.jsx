import { useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import Mascote from '../ui/Mascote.jsx';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import { SeloCalculo } from '../ui/SeloCalculo.jsx';
import { useAgendaProventos } from '../../hooks/useAgenda.js';
import { MAX_PROXIMOS, mesesDosPagamentos, partesDaData } from '../../lib/agenda.js';
import { diaMes } from '../../lib/datas.js';
import { nomeCurto } from '../../lib/nomeEmpresa.js';
import { usePreferencias } from '../../context/contextos.js';
import { useAlturaSuave } from '../../hooks/useAlturaSuave.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/**
 * Próximos pagamentos das ações acompanhadas: os primeiros da lista, com botão
 * para ver o resto. Busca os próprios dados: carregamento e erro ficam só aqui.
 */

const T = TEXTOS.proventos;

const EXPLICA_TIPO = {
  DIVIDENDO: TEXTOS.ficha.proventos.explicaDividendo,
  JCP: TEXTOS.ficha.proventos.explicaJcp,
};

const porDataPagamento = (a, b) => String(a.data_pagamento).localeCompare(String(b.data_pagamento));

/** Uma linha de pagamento, com link para a ficha da ação. */
function ItemPagamento({ ev }) {
  const partes = partesDaData(ev.data_pagamento);
  const nome = nomeCurto(ev.empresa);
  const dataCom = ev.data_com ? diaMes(ev.data_com) : null;
  return (
    <li>
      <Link className="proventos-prox" to={`/acao/${ev.ticker}?pergunta=proventos`}>
        <time className="proventos-data-bloco" dateTime={ev.data_pagamento} title={TEXTOS.dia.pagamento(ev.data_extenso)}>
          <span className="proventos-data-dia">{partes.dia}</span>
          <span className="proventos-data-mes">{partes.mes}</span>
        </time>
        <span className="proventos-prox-quem">
          <span className="proventos-prox-ticker">{ev.ticker}</span>
          {nome && nome !== ev.ticker && <span className="proventos-prox-nome">{nome}</span>}
          {dataCom && <span className="proventos-prox-com">{T.dataComCurta(dataCom)}</span>}
        </span>
        <span className="proventos-prox-meta">
          <span className="proventos-tipo" data-tipo={ev.tipo === 'JCP' ? 'jcp' : 'dividendo'} title={EXPLICA_TIPO[ev.tipo] ?? undefined}>
            {ev.tipo_rotulo}
          </span>
          <span className="proventos-prox-valor">
            {ev.valor_texto ? (
              <>
                <span className="num">{ev.valor_texto}</span>
                <small>{T.porAcao}</small>
              </>
            ) : (
              T.valorNaoInformado
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}

export function AgendaProventos({ nivelTitulo = 3 }) {
  const { nivel } = usePreferencias();
  const T1 = `h${nivelTitulo}`;
  const { data, falhas, isPending, isError, error, refetch } = useAgendaProventos();
  const [todos, setTodos] = useState(false);
  // a entrada em cascata só roda na chegada da página
  const [jaAlternou, setJaAlternou] = useState(false);
  const listaRef = useRef(null);
  useAlturaSuave(listaRef, todos);
  const idLista = useId();
  const futuros = useMemo(() => [...(data?.futuros ?? [])].sort(porDataPagamento), [data]);
  const grupos = useMemo(() => mesesDosPagamentos(futuros), [futuros]);
  const aDefinir = data?.a_definir ?? [];
  const visiveis = todos ? futuros : futuros.slice(0, MAX_PROXIMOS);
  const escondidos = futuros.length - MAX_PROXIMOS;

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
        <p className="sr-only">{TEXTOS.dia.proventosCarregando}</p>
        <Linhas quantidade={4} />
      </div>
    );
  } else if (futuros.length === 0) {
    conteudo = (
      <div className="proventos-vazio-cartao">
        <Mascote humor="pensativo" className="proventos-mascote" />
        <p className="proventos-vazio">{TEXTOS.dia.semProventos}</p>
      </div>
    );
  } else {
    // array plano: os pagamentos mantêm a key ao abrir e fechar
    const linhas = todos
      ? grupos.flatMap((g) => [
          g.rotulo ? (
            <li key={`mes-${g.chave}`} role="presentation" className="proventos-prox-mes">
              <span>{g.rotulo}</span>
              <span>{T.mesPagamentos(g.itens.length)}</span>
            </li>
          ) : null,
          ...g.itens.map((ev) => <ItemPagamento key={ev.id} ev={ev} />),
        ])
      : visiveis.map((ev) => <ItemPagamento key={ev.id} ev={ev} />);
    conteudo = (
      <ol
        ref={listaRef}
        id={idLista}
        className={`proventos-prox-lista${jaAlternou ? '' : ' entra-lista'}`}
        aria-label={porNivel(T.agendaRolagem, nivel)}
        data-aberta={todos ? 'true' : undefined}
        tabIndex={todos ? 0 : undefined}
      >
        {linhas}
      </ol>
    );
  }

  return (
    <section className="proventos-bloco proventos-agenda" aria-labelledby="agenda-proventos-titulo" aria-busy={isPending}>
      <T1 id="agenda-proventos-titulo" className="proventos-bloco-titulo proventos-com-icone">
        <CalendarClock size={22} aria-hidden="true" />
        <span>{T.agendaTitulo}</span>
      </T1>
      <p className="proventos-como-ler">
        <BotaoTermo chave="data_com">{T.termoDataCom}</BotaoTermo>: {porNivel(T.agendaNota, nivel)}
      </p>
      <SeloCalculo conta="proventos" curto />

      {conteudo}

      {!isPending && !isError && todos && <p className="proventos-nota-aberta">{T.notaListaAberta}</p>}

      {!isPending && !isError && escondidos > 0 && (
        <button
          type="button"
          className="proventos-mais"
          aria-expanded={todos}
          aria-controls={idLista}
          onClick={() => {
            setJaAlternou(true);
            setTodos((v) => !v);
          }}
        >
          {todos ? T.verMenos : T.verTodos(futuros.length)}
        </button>
      )}

      {aDefinir.length > 0 && <p className="proventos-rodape">{T.aDefinirCurto(aDefinir.length)}</p>}
      {falhas?.length > 0 && <p className="proventos-rodape">{TEXTOS.dia.falhasProventos(falhas.length)}</p>}
    </section>
  );
}
