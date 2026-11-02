import { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useMinhaLista, usePreferencias } from '../../context/contextos.js';
import { useAnaliseDoDia, useRecarregarAnalise } from '../../hooks/useAnalise.js';
import { useResumos } from '../../hooks/useDados.js';
import { contarPorFiltro, destaquePorSetor, FILTROS, filtrarAcoes, ordenarAcoes, PASSO } from '../../lib/listaAcoes.js';
import { REGRAS } from '../../lib/sugestoes.js';
import { linhasDaTabela } from '../../lib/tabelaAcoes.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { Linhas } from '../ui/Estados.jsx';
import LinhaAcao, { CartaoDestaque, SeloSinal } from './LinhaAcao.jsx';

const FILTRO_PADRAO = 'todas';
const VISTA_DESTAQUES = 'destaques';
const VISTA_LISTA = 'lista';
/** Tipos de sinal na legenda, na ordem em que aparecem. */
const TIPOS_SINAL = ['forte', 'atencao', 'contexto'];

/**
 * Seção "As ações" da página Ações, com duas vistas e o mesmo cabeçalho: "Destaques por setor"
 * (uma ação por setor, a vista padrão do nível Simples) e "Todas as ações" (lista em blocos de
 * PASSO ações, a vista padrão do nível Técnica, com P/L e DY). Filtros, busca e legenda aparecem
 * nas duas vistas; a busca leva para "Todas as ações". Filtro gravado em ?filtro=, vista em
 * ?vista= (o antigo ?vista=tabela cai em "Todas as ações"). nivelTitulo diz se o título é h1
 * (página própria) ou h2.
 */
export default function SecaoAcoes({ nivelTitulo = 2 }) {
  const Titulo = `h${nivelTitulo}`;
  const Sub = `h${nivelTitulo + 1}`;
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const { tickers } = useMinhaLista();
  const { nivel } = usePreferencias();
  const { data, isPending, isError, error } = useAnaliseDoDia();
  const resumosConsulta = useResumos();
  const recarregar = useRecarregarAnalise();

  const tecnico = nivel === 'tecnico';
  const [busca, setBusca] = useState('');
  // Quantidade mostrada guarda a chave (filtro e busca) em que foi pedida: ao mudar, volta a PASSO.
  const [mostrar, setMostrar] = useState({ chave: '', n: PASSO });
  const abasRef = useRef([]);

  const filtroLido = params.get('filtro');
  const filtro = FILTROS.includes(filtroLido) ? filtroLido : FILTRO_PADRAO;
  const termo = busca.trim();
  const chave = `${filtro}|${termo}`;
  const quantas = mostrar.chave === chave ? mostrar.n : PASSO;

  const acoes = data?.acoes_pregao;
  const filtradas = useMemo(
    () => ordenarAcoes(filtrarAcoes(acoes, { filtro, busca: termo, lista: tickers })),
    [acoes, filtro, termo, tickers],
  );
  const contagens = useMemo(() => contarPorFiltro(acoes, tickers), [acoes, tickers]);
  // P/L e DY do nível Técnica: as mesmas ações filtradas, com resumo de todas (useResumos já está carregado).
  const linhasTabela = useMemo(
    () => linhasDaTabela(filtradas, data?.sugestoes, resumosConsulta.data),
    [filtradas, data, resumosConsulta.data],
  );
  const indicadorDe = useMemo(() => new Map(linhasTabela.map((l) => [l.ticker, l])), [linhasTabela]);

  // Destaques: uma ação por setor entre as ações filtradas (filtro e busca valem nas duas vistas).
  const destaques = useMemo(() => destaquePorSetor(filtradas, data?.sugestoes), [filtradas, data]);

  const vistaPadrao = tecnico ? VISTA_LISTA : VISTA_DESTAQUES;
  const vistaLida = params.get('vista') === 'tabela' ? VISTA_LISTA : params.get('vista');
  const vista = [VISTA_DESTAQUES, VISTA_LISTA].includes(vistaLida) ? vistaLida : vistaPadrao;
  const emDestaques = vista === VISTA_DESTAQUES;

  // Atualiza um parâmetro da URL preservando os demais; a página é sempre /acoes.
  const gravarNaUrl = (ajustar) => {
    const prox = new URLSearchParams(params);
    ajustar(prox);
    const busca = prox.toString();
    navegar(
      { pathname: '/acoes', search: busca ? '?' + busca : '' },
      { replace: true, preventScrollReset: true },
    );
  };

  const escolherFiltro = (proximo) => {
    gravarNaUrl((prox) => prox.set('filtro', proximo));
  };

  const escolherVista = (proxima) => {
    gravarNaUrl((prox) => {
      // A vista padrão do nível não precisa ficar na URL.
      if (proxima === vistaPadrao) prox.delete('vista');
      else prox.set('vista', proxima);
    });
  };

  // Buscar nos destaques leva para "Todas as ações", onde o resultado da busca é uma lista.
  const aoBuscar = (valor) => {
    setBusca(valor);
    if (valor.trim() && emDestaques) escolherVista(VISTA_LISTA);
  };

  const aoTeclarAba = (evento, indice) => {
    const passo = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0;
    if (!passo) return;
    evento.preventDefault();
    const proximo = (indice + passo + FILTROS.length) % FILTROS.length;
    escolherFiltro(FILTROS[proximo]);
    abasRef.current[proximo]?.focus();
  };

  const titulo =
    isPending || isError
      ? porNivel(TEXTOS.acoes.tituloSemTotal, nivel)
      : emDestaques
        ? porNivel(TEXTOS.acoes.tituloDestaques, nivel)
        : porNivel(TEXTOS.acoes.titulo, nivel)(acoes.length);

  const campoBusca = (
    <label className="lista-busca">
      <Search className="lista-busca__icone" size={16} strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">{TEXTOS.acoes.busca}</span>
      <input
        type="search"
        value={busca}
        placeholder={TEXTOS.acoes.buscaExemplo}
        autoComplete="off"
        onChange={(evento) => aoBuscar(evento.target.value)}
      />
    </label>
  );

  // Legenda fixa das duas vistas: uma frase, com os três selos embutidos no fim dela.
  const legenda = (
    <p className="lista-legenda">
      <span>{TEXTOS.acoes.legenda.checagens(REGRAS.length)}</span>{' '}
      {TIPOS_SINAL.map((tipo) => (
        <SeloSinal key={tipo} tipo={tipo}>
          {TEXTOS.acoes.legenda.nome[tipo]}
        </SeloSinal>
      ))}
    </p>
  );

  const cabecalho = () => (
    <div className="lista-cabecalho">
      <div className="lista-cabecalho__texto">
        <Titulo className="lista-titulo" id="acoes-titulo">
          {titulo}
        </Titulo>
        <p className="lista-intro">
          {emDestaques
            ? porNivel(TEXTOS.acoes.introDestaques, nivel)
            : porNivel(TEXTOS.acoes.intro, nivel)}
        </p>
        {legenda}
      </div>
    </div>
  );

  if (isError) {
    return (
      <section id="acoes" className="secao lista" aria-labelledby="acoes-titulo">
        {cabecalho()}
        <div className="estado estado--erro" role="alert">
          <Sub>{TEXTOS.estados.erroTitulo}</Sub>
          <p>{error?.mensagemUsuario ?? TEXTOS.estados.erroTexto}</p>
          <button type="button" className="botao" onClick={recarregar}>
            {TEXTOS.estados.tentarDeNovo}
          </button>
        </div>
      </section>
    );
  }

  if (isPending) {
    return (
      <section id="acoes" className="secao lista" aria-labelledby="acoes-titulo">
        {cabecalho()}
        <div className="estado" role="status" aria-live="polite">
          <p>{TEXTOS.estados.carregando}</p>
          <Linhas quantidade={4} />
        </div>
      </section>
    );
  }

  const visiveis = filtradas.slice(0, quantas);
  const restantes = filtradas.length - visiveis.length;

  let semAcoes = null;
  if (filtradas.length === 0) {
    if (termo) semAcoes = TEXTOS.acoes.semResultado(termo);
    else if (filtro === 'minha') semAcoes = porNivel(TEXTOS.acoes.listaVazia, nivel);
    else semAcoes = porNivel(TEXTOS.acoes.semResultadoFiltro, nivel);
  }

  const opcoesVista = [
    { chave: VISTA_DESTAQUES, rotulo: TEXTOS.acoes.vista.destaques },
    { chave: VISTA_LISTA, rotulo: TEXTOS.acoes.vista.lista },
  ];

  return (
    <section
      id="acoes"
      className={'secao lista' + (tecnico ? ' lista--tecnico' : '')}
      aria-labelledby="acoes-titulo"
    >
      {cabecalho()}

      <div className="lista-controles">
        <div className="lista-filtros" role="tablist" aria-label={TEXTOS.acoes.filtros}>
          {FILTROS.map((f, indice) => (
            <button
              key={f}
              ref={(el) => (abasRef.current[indice] = el)}
              type="button"
              role="tab"
              className="lista-filtro"
              title={porNivel(TEXTOS.acoes.filtroExplica[f], nivel)}
              aria-selected={f === filtro}
              aria-controls="acoes-area"
              tabIndex={f === filtro ? 0 : -1}
              onClick={() => escolherFiltro(f)}
              onKeyDown={(evento) => aoTeclarAba(evento, indice)}
            >
              {TEXTOS.acoes.filtro[f]}
              {' '}
              <span className="lista-filtro__contagem">{contagens[f]}</span>
            </button>
          ))}
        </div>

        <div className="lista-ferramentas">
          {campoBusca}
          <div className="lista-filtros lista-vista" role="group" aria-label={TEXTOS.acoes.vistaGrupo}>
            {opcoesVista.map((opcao) => (
              <button
                key={opcao.chave}
                type="button"
                className="lista-filtro"
                aria-pressed={vista === opcao.chave}
                onClick={() => escolherVista(opcao.chave)}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mesma largura e altura mínima nas duas vistas; a troca é um desvanecer de 150ms. */}
      <div id="acoes-area" key={vista} className="lista-area">
        {filtro !== 'todas' && (
          <p className="lista-filtro-ajuda">{porNivel(TEXTOS.acoes.filtroExplica[filtro], nivel)}</p>
        )}

        {emDestaques ? (
          semAcoes ? (
            <div className="estado estado--vazio">
              <p>{semAcoes}</p>
            </div>
          ) : destaques.length > 0 ? (
            <ul className="destaques" role="list" aria-label={TEXTOS.acoes.destaqueGrade}>
              {destaques.map((acao) => (
                <CartaoDestaque key={acao.ticker} acao={acao} nivel={nivel} nivelTitulo={nivelTitulo + 1} />
              ))}
            </ul>
          ) : (
            <div className="estado estado--vazio">
              <p>{porNivel(TEXTOS.acoes.destaqueVazio, nivel)}</p>
            </div>
          )
        ) : (
          <>
            <p className="lista-contagem" aria-live="polite">
              {TEXTOS.acoes.contagem(visiveis.length, filtradas.length)}
            </p>

            <div className="lista-tabela">
              {visiveis.length > 0 && (
                <div className="lista-colunas" aria-hidden="true">
                  <span className="lista-col">{TEXTOS.acoes.colunas.acao}</span>
                  <span className="lista-col">{TEXTOS.acoes.colunas.empresa}</span>
                  <span className="lista-col">{TEXTOS.acoes.colunas.setor}</span>
                  <span className="lista-col lista-col--num">{TEXTOS.acoes.colunas.fechamento}</span>
                  <span className="lista-col lista-col--num">{TEXTOS.acoes.colunas.variacao}</span>
                  {tecnico && (
                    <>
                      <span className="lista-col lista-col--num">{TEXTOS.acoes.colunas.pl}</span>
                      <span className="lista-col lista-col--num">{TEXTOS.acoes.colunas.dy}</span>
                    </>
                  )}
                  <span className="lista-col">{TEXTOS.acoes.colunas.regras}</span>
                  <span className="lista-col" />
                </div>
              )}

              <ul id="acoes-lista" className="lista-acoes" role="list">
                {visiveis.map((acao) => (
                  <LinhaAcao
                    key={acao.ticker}
                    acao={acao}
                    linha={tecnico ? indicadorDe.get(acao.ticker) : undefined}
                  />
                ))}
              </ul>
            </div>

            {semAcoes && (
              <div className="estado estado--vazio">
                <p>{semAcoes}</p>
              </div>
            )}

            {restantes > 0 && (
              <button
                type="button"
                className="botao"
                onClick={() => setMostrar({ chave, n: quantas + PASSO })}
              >
                {TEXTOS.acoes.mostrarMais(Math.min(PASSO, restantes))}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
