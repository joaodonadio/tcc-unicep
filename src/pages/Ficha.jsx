import { Fragment, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAcoes, useResumo } from '../hooks/useDados.js';
import { usePreferencias } from '../context/contextos.js';
import { BotaoTermo } from '../components/ui/BotaoTermo.jsx';
import { BlocoErro, BlocoVazio, Linhas } from '../components/ui/Estados.jsx';
import { NavPerguntas } from '../components/ficha/NavPerguntas.jsx';
import { PorQueApareceu } from '../components/ficha/PorQueApareceu.jsx';
import { PainelIndicadores } from '../components/ficha/PainelIndicadores.jsx';
import { PainelPreco } from '../components/ficha/PainelPreco.jsx';
import { PainelBalancos } from '../components/ficha/PainelBalancos.jsx';
import { GraficosBalanco } from '../components/ficha/GraficosBalanco.jsx';
import { PainelHistorico } from '../components/ficha/PainelHistorico.jsx';
import { HistoricoAno } from '../components/ficha/HistoricoAno.jsx';
import { PainelProventos } from '../components/ficha/PainelProventos.jsx';
import { PainelNoticias } from '../components/ficha/PainelNoticias.jsx';
import { PainelNegociacao } from '../components/ficha/PainelNegociacao.jsx';
import { Fundamentos } from '../components/ficha/Fundamentos.jsx';
import { BlocoObjeto3D } from '../components/modelos3d/BlocoObjeto3D.jsx';
import { SeloRevisao } from '../components/ui/SeloRevisao.jsx';
import { variacaoDiaConfiavel, variacaoDiaSuspeita } from '../lib/crivel.js';
import { textoTipoAcao } from '../lib/fichaIndicadores.js';
import { BRILHO_DA_PERGUNTA, PERGUNTAS, chavesDaPergunta, perguntaDaUrl } from '../lib/perguntasFicha.js';
import { brl, pct } from '../lib/formato.js';
import { rolarParaBaixoDe, trocarComTransicao } from '../lib/movimento.js';
import { corDoSetor } from '../lib/setores.js';
import { TEXTOS, porNivel } from '../lib/textos.js';
import { valorOuNulo } from '../lib/valor.js';

/**
 * FICHA DA AÇÃO, por perguntas. Rota `/acao/:ticker`. A pergunta atual fica
 * na URL (?pergunta=) e ?aba= antigo continua valendo (perguntaDaUrl).
 */

/** ON/PN têm entrada própria no glossário; outros tipos (UNIT) ficam sem termo. */
function termoTipo(tipo) {
  if (tipo.startsWith('ON')) return 'acao_on';
  if (tipo.startsWith('PN')) return 'acao_pn';
  return null;
}

/**
 * Só o número da variação fica em Atkinson Hyperlegible Mono: o texto ao redor ("no dia") segue em Atkinson Hyperlegible Next.
 * Sem número (variação zero), a frase inteira vai como veio.
 */
function variacaoComNumeroEmMono(texto, numero) {
  const inicio = numero ? texto.indexOf(numero) : -1;
  if (inicio < 0) return texto;
  return (
    <>
      {texto.slice(0, inicio)}
      <span className="ficha-variacao__numero">{numero}</span>
      {texto.slice(inicio + numero.length)}
    </>
  );
}

/**
 * Volta para onde o leitor estava: se a página foi aberta por um link interno (há histórico),
 * volta no histórico; se entrou direto pela URL, leva para a lista de ações.
 */
function VoltarFicha() {
  const navegar = useNavigate();
  const location = useLocation();
  if (location.key !== 'default') {
    return (
      <button type="button" className="ficha-voltar" onClick={() => navegar(-1)}>
        {TEXTOS.ficha.voltarAnterior}
      </button>
    );
  }
  return (
    <Link className="ficha-voltar" to="/acoes">
      {TEXTOS.ficha.voltar}
    </Link>
  );
}

/** Compara dois textos ignorando caixa e espaços extras (subsetor igual ao setor não se repete). */
function mesmoTexto(a, b) {
  const normal = (t) => String(t ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  return normal(a) === normal(b);
}

export default function Ficha() {
  const { ticker: param = '' } = useParams();
  const ticker = param.toUpperCase();
  const [busca, setBusca] = useSearchParams();
  const { nivel } = usePreferencias();
  const painelRef = useRef(null);
  const alinharPainel = useRef(false);

  const acoes = useAcoes();
  const resumo = useResumo(ticker);

  const acao = acoes.data?.find((a) => a.ticker === ticker) ?? null;
  const textoTipo = acao ? textoTipoAcao(acao.tipo_acao) : null;
  const tipoCurto = typeof acao?.tipo_acao === 'string' && acao.tipo_acao.trim() ? acao.tipo_acao.trim().toUpperCase() : null;
  const setorFraco = resumo.data?.setor_comparacao_fraca === true;
  const notaSetor = setorFraco ? <p className="ficha-nota">{TEXTOS.ficha.setorFraco}</p> : null;
  const id = perguntaDaUrl(busca);
  const pergunta = PERGUNTAS.find((p) => p.id === id);
  const temExtraTecnico = nivel !== 'tecnico' && Boolean(pergunta?.tecnico?.length || pergunta?.extraTecnico);
  const chaves = chavesDaPergunta(id, nivel);

  const fechamento = valorOuNulo(resumo.data?.cotacao?.fechamento);
  // Variação impossível no dia (grupamento não ajustado) não entra: no lugar dela, o selo "mudou de escala".
  const variacaoRecebida = valorOuNulo(resumo.data?.cotacao?.variacao_dia);
  const emRevisao = variacaoDiaSuspeita(variacaoRecebida);
  const variacao = variacaoDiaConfiavel(variacaoRecebida);
  const direcao = variacao == null ? null : variacao > 0 ? 'alta' : variacao < 0 ? 'queda' : 'estavel';
  const numeroVariacao = direcao == null || direcao === 'estavel' ? null : pct(Math.abs(variacao), { sinal: false });
  const textoVariacao =
    direcao == null
      ? null
      : direcao === 'estavel'
        ? TEXTOS.ficha.variacao.estavel
        : TEXTOS.ficha.variacao[direcao](numeroVariacao);

  const naoEncontrada = acoes.isSuccess && !acao && resumo.isSuccess && !resumo.data;

  useEffect(() => {
    const nome = acao?.empresa ? `${ticker}${TEXTOS.ficha.separador}${acao.empresa}` : ticker;
    document.title = TEXTOS.paginas.tituloDocumento(nome);
  }, [ticker, acao?.empresa]);

  // depois de trocar a aba, e ainda dentro do quadro novo: só rola se o painel estiver escondido atrás da barra
  useLayoutEffect(() => {
    if (!alinharPainel.current) return;
    alinharPainel.current = false;
    const painel = painelRef.current;
    rolarParaBaixoDe(painel, painel?.parentElement?.querySelector('.ficha-abas'));
  }, [id]);

  // a troca de aba faz o painel dar um crossfade curto (ver movimento.css, seção 21)
  const irPara = (novoId) => {
    alinharPainel.current = true;
    trocarComTransicao(() => setBusca({ pergunta: novoId }, { replace: true, preventScrollReset: true, flushSync: true }), 'suave');
  };

  const metadados = acao
    ? [
        acao.setor && { chave: 'setor', texto: acao.setor },
        acao.subsetor && !mesmoTexto(acao.subsetor, acao.setor) && { chave: 'subsetor', texto: acao.subsetor, termo: 'subsetor' },
        tipoCurto && { chave: 'tipo', texto: tipoCurto, titulo: textoTipo, termo: termoTipo(tipoCurto) },
      ].filter(Boolean)
    : [];

  const cabecalho = (
    <>
      <VoltarFicha />
      <header className="ficha-topo">
        <div className="ficha-id">
          <h1 className="ficha-ticker">{ticker}</h1>
          {acao && <p className="ficha-empresa">{acao.empresa}</p>}
          {metadados.length > 0 && (
            <p className="ficha-meta">
              {metadados.map((m, i) => (
                <Fragment key={m.chave}>
                  {i > 0 && TEXTOS.ficha.separador}
                  {m.termo ? (
                    <span title={m.titulo}>
                      <BotaoTermo chave={m.termo}>{m.texto}</BotaoTermo>
                    </span>
                  ) : (
                    <span title={m.titulo}>{m.texto}</span>
                  )}
                </Fragment>
              ))}
            </p>
          )}
        </div>
        <div className="ficha-cotacao">
          {resumo.isPending ? (
            <Linhas quantidade={1} />
          ) : (
            <p className="ficha-preco">
              <span className="ficha-preco-valor">{fechamento == null ? '—' : brl(fechamento)}</span>
              {textoVariacao && (
                <span className={`ficha-variacao valor--${direcao}`}>
                  {variacaoComNumeroEmMono(textoVariacao, numeroVariacao)}
                </span>
              )}
              {emRevisao && <SeloRevisao />}
            </p>
          )}
        </div>
      </header>
    </>
  );

  if (naoEncontrada) {
    return (
      <article className="ficha pagina" style={{ '--cor-linha': corDoSetor(undefined) }}>
        <VoltarFicha />
        <BlocoVazio titulo={TEXTOS.ficha.naoEncontrada} mensagem={TEXTOS.ficha.naoEncontradaTexto(ticker)} nivel={1} />
      </article>
    );
  }

  let conteudo = null;
  switch (id) {
    case 'regras':
      conteudo = <PorQueApareceu ticker={ticker} />;
      break;
    case 'divida':
      conteudo = (
        <>
          <PainelIndicadores ticker={ticker} chaves={chaves} />
          {notaSetor}
          <GraficosBalanco ticker={ticker} qual="divida" />
          {nivel === 'tecnico' && <PainelBalancos ticker={ticker} />}
        </>
      );
      break;
    case 'cara':
      conteudo = (
        <>
          <PainelIndicadores ticker={ticker} chaves={chaves} />
          {notaSetor}
          <GraficosBalanco ticker={ticker} qual="resultado" />
          <HistoricoAno ticker={ticker} />
          <PainelHistorico ticker={ticker} />
        </>
      );
      break;
    case 'proventos':
      conteudo = (
        <>
          <PainelIndicadores ticker={ticker} chaves={chaves} />
          <PainelProventos ticker={ticker} resumo={resumo.data ?? null} />
        </>
      );
      break;
    case 'oscila':
      conteudo = (
        <>
          <PainelIndicadores ticker={ticker} chaves={chaves} />
          <PainelNegociacao ticker={ticker} />
        </>
      );
      break;
    case 'preco':
      conteudo = <PainelPreco ticker={ticker} resumo={resumo.data ?? null} />;
      break;
    case 'noticias':
      conteudo = <PainelNoticias ticker={ticker} />;
      break;
    default:
      conteudo = null;
  }

  return (
    <article className="ficha pagina" style={{ '--cor-linha': corDoSetor(acao?.setor) }}>
      {cabecalho}

      <Fundamentos ticker={ticker} resumo={resumo.data ?? null} carregando={resumo.isPending} />

      {resumo.isError && (
        <BlocoErro
          titulo={TEXTOS.estados.erroTitulo}
          mensagem={resumo.error?.mensagemUsuario}
          onTentarNovamente={resumo.refetch}
        />
      )}

      <NavPerguntas atual={id} aoEscolher={irPara} />

      <section
        ref={painelRef}
        className="ficha-painel"
        data-brilho={BRILHO_DA_PERGUNTA[id]}
        role="tabpanel"
        id={'painel-' + id}
        aria-labelledby={'aba-' + id}
      >
        <h2 className="ficha-pergunta">{porNivel(TEXTOS.ficha.perguntas[id].titulo, nivel)}</h2>
        <p className="ficha-intro">{porNivel(TEXTOS.ficha.perguntas[id].intro, nivel)}</p>
        <BlocoObjeto3D pergunta={id} resumo={resumo.data ?? null} ticker={ticker} tecnico={nivel === 'tecnico'} />
        {conteudo}
        {temExtraTecnico && <p className="ficha-nota">{TEXTOS.ficha.tecnicoNota}</p>}
      </section>

    </article>
  );
}
