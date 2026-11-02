import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ThumbsUp, TriangleAlert } from 'lucide-react';
import { usePreferencias } from '../../context/contextos.js';
import { useAnaliseDoDia, useRecarregarAnalise } from '../../hooks/useAnalise.js';
import { useExperimentoTop } from '../../hooks/useDados.js';
import { brl, numero, pct } from '../../lib/formato.js';
import { movimentoReduzido } from '../../lib/movimento.js';
import { TEXTOS } from '../../lib/textos.js';
import { dadosDosModelos, numerosChave, top5ParaEstudar } from '../../lib/top5Estudo.js';
import { REGRAS } from '../../lib/sugestoes.js';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { IconeSetor } from '../ui/IconeSetor.jsx';
import Modelo3D from '../modelos3d/Modelo3D.jsx';
import { Variacao } from './Variacao.jsx';

const T = TEXTOS.top5Hoje;
const OBJETOS = ['balanca', 'moedas', 'cofrinho', 'pendulo'];
// abas do painel: a primeira é a que abre; o 3D só monta na última
const ABAS_PAINEL = ['porque', 'numeros', 'objeto'];

const porcento = (v) => pct(v, { casas: 0, sinal: false });

/** Índice da aba que a tecla pede: setas circulares, Home e End; null para as outras teclas. */
function destinoDaTecla(tecla, indice, total) {
  if (tecla === 'ArrowRight' || tecla === 'ArrowDown') return indice === total - 1 ? 0 : indice + 1;
  if (tecla === 'ArrowLeft' || tecla === 'ArrowUp') return indice === 0 ? total - 1 : indice - 1;
  if (tecla === 'Home') return 0;
  if (tecla === 'End') return total - 1;
  return null;
}

/** Contagem de sinais do item, só quando os dois números existem (ausência não vira zero). */
const temContagem = (item) => Number.isFinite(item.contagem?.forte) && Number.isFinite(item.contagem?.atencao);

/** Rola até o painel quando ele fica abaixo da lista (celular); sem suporte, não faz nada. */
function rolarAte(elemento) {
  if (!elemento?.scrollIntoView) return;
  const estreito = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 899px)').matches;
  if (!estreito) return;
  const reduzido = movimentoReduzido();
  elemento.scrollIntoView({ behavior: reduzido ? 'auto' : 'smooth', block: 'start' });
}

function ItemDaLista({ item, selecionado, tecnico, aoEscolher }) {
  const { pl, dy } = numerosChave(item.resumo);
  return (
    <li>
      <button type="button" className="top5-item" aria-pressed={selecionado} onClick={() => aoEscolher(item.ticker)}>
        <span className="top5-pos" aria-hidden="true">
          {item.posicao}
        </span>
        <span className="top5-item-corpo">
          <span className="top5-item-linha">
            <span className="top5-ticker">{item.ticker}</span>
            {item.empresa && <span className="top5-empresa">{item.empresa}</span>}
            <Variacao valor={item.variacao} />
          </span>
          {item.setor && (
            <span className="top5-setor">
              <IconeSetor setor={item.setor} tamanho={14} />
              {item.setor}
            </span>
          )}
          {item.motivoCurto && <span className="top5-motivo">{item.motivoCurto}</span>}
          {tecnico && (
            <span className="top5-tecnico">
              {pl != null && (
                <span>
                  {T.pl} {numero(pl, { casas: 1 })}
                </span>
              )}
              {dy != null && (
                <span>
                  {T.dy} {pct(dy, { casas: 1, sinal: false })}
                </span>
              )}
              {temContagem(item) && <span>{T.contagem(item.contagem.forte, item.contagem.atencao)}</span>}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

/** Até essas frases aparecem na aba "Por que está aqui"; o resto vira "Mais K na ficha completa". */
const MAX_FRASES = 2;

/** Quantas frases ficam de fora da aba "Por que está aqui" (ausência de frase não vira zero). */
const frasesFora = (item) => Math.max(0, item.favor.length + item.atencao.length - MAX_FRASES);

/** Conteúdo da aba "Por que está aqui": a contagem e até duas frases. */
function AbaPorQue({ item, tecnico }) {
  const frases = [
    ...item.favor.map((s) => ({ ...s, tom: 'favor' })),
    ...item.atencao.map((s) => ({ ...s, tom: 'atencao' })),
  ];
  const mostradas = frases.slice(0, MAX_FRASES);
  return (
    <div className="top5-aba-corpo">
      {item.chance && <p className="top5-chance">{T.chance(porcento(item.chance.valor), porcento(item.chance.referencia))}</p>}
      {temContagem(item) && (
        <div className="top5-contagem">
          <p className="top5-contagem-titulo">{T.resumoDe(REGRAS.length)}</p>
          <div className="top5-contagem-cartoes">
            <p className="top5-contagem-item" data-tom="favor">
              <span className="top5-contagem-icone" aria-hidden="true">
                <ThumbsUp size={18} />
              </span>
              <strong>{item.contagem.forte}</strong>
              <span className="top5-contagem-rotulo">{T.resumoFavor}</span>
            </p>
            <p className="top5-contagem-item" data-tom="atencao">
              <span className="top5-contagem-icone" aria-hidden="true">
                <TriangleAlert size={18} />
              </span>
              <strong>{item.contagem.atencao}</strong>
              <span className="top5-contagem-rotulo">{T.resumoAtencao}</span>
            </p>
          </div>
        </div>
      )}
      <ul className="top5-frases">
        {mostradas.map((s) => (
          <li key={`${s.tom}-${s.id}`} className="top5-frase" data-tom={s.tom}>
            {s.tom === 'favor' ? (
              <ThumbsUp size={16} aria-hidden="true" />
            ) : (
              <TriangleAlert size={16} aria-hidden="true" />
            )}
            <span>{tecnico && s.tecnico ? s.tecnico : s.simples}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Conteúdo da aba "Números": as pílulas com P/L, dividend yield e alta em 6 meses. */
function AbaNumeros({ resumo }) {
  const { pl, dy, alta6m } = numerosChave(resumo);
  if (pl == null && dy == null && alta6m == null) {
    return (
      <div className="top5-aba-corpo">
        <p className="top5-vazio">{T.semNumeros}</p>
      </div>
    );
  }
  return (
    <div className="top5-aba-corpo">
      <p className="top5-intro">{T.numerosIntro}</p>
      <ul className="top5-pilulas">
        {pl != null && (
          <li className="top5-pilula">
            <span>
              <BotaoTermo chave="pl">{T.pl}</BotaoTermo>
            </span>{' '}
            <strong>{numero(pl, { casas: 1 })}</strong>
          </li>
        )}
        {dy != null && (
          <li className="top5-pilula">
            <span>
              <BotaoTermo chave="dividend_yield">{T.dy}</BotaoTermo>
            </span>{' '}
            <strong>{pct(dy, { casas: 1, sinal: false })}</strong>
          </li>
        )}
        {alta6m != null && (
          <li className="top5-pilula">
            <span>{T.alta6m}</span> <strong>{pct(alta6m)}</strong>
          </li>
        )}
      </ul>
    </div>
  );
}

/** Conteúdo da aba "Entenda com um objeto": perguntas e o objeto 3D (só existe com a aba aberta). */
function AbaObjeto({ item, resumo }) {
  const [objeto, setObjeto] = useState(OBJETOS[0]);
  const botoes = useRef({});
  const idBase = useId();
  const dados = dadosDosModelos(resumo)[objeto];

  const escolher = (tipo) => {
    setObjeto(tipo);
    botoes.current[tipo]?.focus();
  };
  const aoTecla = (e, indice) => {
    const destino = destinoDaTecla(e.key, indice, OBJETOS.length);
    if (destino === null) return;
    e.preventDefault();
    escolher(OBJETOS[destino]);
  };

  return (
    <div className="top5-aba-corpo top5-aba-corpo--objeto">
      <div className="top5-abas" role="tablist" aria-label={T.abasRotulo}>
        {OBJETOS.map((tipo, indice) => (
          <button
            key={tipo}
            ref={(el) => {
              botoes.current[tipo] = el;
            }}
            id={`${idBase}-${tipo}`}
            type="button"
            role="tab"
            className="top5-aba"
            aria-selected={objeto === tipo}
            aria-controls={`${idBase}-painel`}
            tabIndex={objeto === tipo ? 0 : -1}
            onClick={() => setObjeto(tipo)}
            onKeyDown={(e) => aoTecla(e, indice)}
          >
            {T.abas[tipo]}
          </button>
        ))}
      </div>
      <div className="top5-objeto" role="tabpanel" id={`${idBase}-painel`} aria-labelledby={`${idBase}-${objeto}`}>
        <Modelo3D tipo={objeto} ticker={item.ticker} dados={dados} />
      </div>
    </div>
  );
}

/**
 * Painel da ação escolhida. Cabeçalho e botão da ficha ficam fixos; o meio troca entre
 * três abas, para o painel não ficar mais alto que a lista.
 */
function Painel({ item, tecnico, painelRef }) {
  const [aba, setAba] = useState(ABAS_PAINEL[0]);
  const botoesAba = useRef({});
  const rotuloAba = { porque: T.porQue, numeros: T.numeros, objeto: T.entenda };
  const idAba = (chave) => `top5-aba-${chave}`;

  const escolherAba = (chave) => {
    setAba(chave);
    botoesAba.current[chave]?.focus();
  };
  const aoTeclaAba = (e, indice) => {
    const destino = destinoDaTecla(e.key, indice, ABAS_PAINEL.length);
    if (destino === null) return;
    e.preventDefault();
    escolherAba(ABAS_PAINEL[destino]);
  };

  return (
    <div className="top5-painel" role="region" ref={painelRef} tabIndex={-1} aria-label={T.painelRotulo}>
      <header className="top5-painel-topo">
        <span className="top5-pos top5-pos--grande" aria-hidden="true">
          {item.posicao}
        </span>
        <span className="sr-only">{T.posicao(item.posicao)}</span>
        <div className="top5-painel-cabeca">
          <p className="top5-painel-ticker">
            {item.ticker}
            {item.empresa && <span className="top5-empresa"> {item.empresa}</span>}
          </p>
          {(item.preco != null || item.variacao != null) && (
            <p className="top5-painel-preco">
              {item.preco != null && <span className="top5-painel-valor">{brl(item.preco)}</span>}
              <Variacao valor={item.variacao} />
            </p>
          )}
          {item.setor && (
            <p className="top5-painel-meta">
              <span className="top5-setor">
                <IconeSetor setor={item.setor} tamanho={14} />
                {item.setor}
              </span>
            </p>
          )}
        </div>
      </header>

      <div className="top5-abas-painel" role="tablist" aria-label={T.abasPainelRotulo}>
        {ABAS_PAINEL.map((chave, indice) => (
          <button
            key={chave}
            ref={(el) => {
              botoesAba.current[chave] = el;
            }}
            id={idAba(chave)}
            type="button"
            role="tab"
            className="top5-aba"
            aria-selected={aba === chave}
            aria-controls="top5-conteudo"
            tabIndex={aba === chave ? 0 : -1}
            onClick={() => setAba(chave)}
            onKeyDown={(e) => aoTeclaAba(e, indice)}
          >
            {rotuloAba[chave]}
          </button>
        ))}
      </div>

      <div className="top5-painel-corpo" id="top5-conteudo" role="tabpanel" aria-labelledby={idAba(aba)}>
        {aba === 'porque' && <AbaPorQue item={item} tecnico={tecnico} />}
        {aba === 'numeros' && <AbaNumeros resumo={item.resumo} />}
        {aba === 'objeto' && <AbaObjeto item={item} resumo={item.resumo} />}
      </div>

      {aba === 'porque' && frasesFora(item) > 0 && <p className="top5-mais">{T.maisNaFicha(frasesFora(item))}</p>}
      <Link className="botao top5-ficha" to={`/acao/${item.ticker}?pergunta=regras`}>
        {T.abrirFicha}
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}

/**
 * Top 5 para estudar hoje: lista à esquerda e, ao escolher uma ação, o porquê ao lado.
 * Vem do modelo quando ele existe; senão, das regras. Não é indicação de compra.
 */
export default function Top5Destaque() {
  const { data, isPending, isError } = useAnaliseDoDia();
  const experimento = useExperimentoTop();
  const recarregar = useRecarregarAnalise();
  const { nivel } = usePreferencias();
  const tecnico = nivel === 'tecnico';
  const [escolhido, setEscolhido] = useState(null);
  const painelRef = useRef(null);

  const carregando = isPending || (Boolean(data) && experimento.isPending);
  const top = data ? top5ParaEstudar({ experimento: experimento.data, sugestoes: data.sugestoes }) : null;
  const itens = top?.itens ?? [];
  const atual = itens.find((i) => i.ticker === escolhido) ?? itens[0] ?? null;

  const escolher = (ticker) => {
    setEscolhido(ticker);
    rolarAte(painelRef.current);
  };

  let corpo;
  if (isError) {
    corpo = <BlocoErro titulo={T.erroTitulo} mensagem={T.erro} onTentarNovamente={recarregar} />;
  } else if (carregando) {
    corpo = (
      <div role="status">
        <span className="sr-only">{T.carregando}</span>
        <Linhas quantidade={5} larguras={['100%', '92%', '100%', '88%', '96%']} />
      </div>
    );
  } else if (itens.length === 0) {
    corpo = <p className="top5-vazio">{T.vazio}</p>;
  } else {
    corpo = (
      <>
        <div className="top5-grade">
          <ol className="top5-lista" aria-label={T.listaRotulo}>
            {itens.map((item) => (
              <ItemDaLista
                key={item.ticker}
                item={item}
                selecionado={item.ticker === atual.ticker}
                tecnico={tecnico}
                aoEscolher={escolher}
              />
            ))}
          </ol>
          <Painel key={atual.ticker} item={atual} tecnico={tecnico} painelRef={painelRef} />
        </div>
        <p className="sr-only" aria-live="polite">
          {T.escolhido(atual.ticker)}
        </p>
        <p className="top5-origem">{top.origem === 'modelo' ? T.origemModelo : T.origemRegras}</p>
      </>
    );
  }

  return (
    <section id="top5" className="cartao top5" aria-labelledby="top5-titulo">
      <h1 id="top5-titulo" className="top5-titulo">
        <span className="top5-ambar">{T.tituloInicio}</span> {T.tituloFim}
      </h1>
      <p className="top5-apoio">{T.apoio}</p>
      {corpo}
    </section>
  );
}
