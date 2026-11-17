import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { usePreferencias } from '../../context/contextos.js';
import { useAnaliseDoDia, useRecarregarAnalise } from '../../hooks/useAnalise.js';
import { useDetalhes } from '../../hooks/useDetalhes.js';
import { useIndicador } from '../../hooks/useIndicador.js';
import { brl, pct } from '../../lib/formato.js';
import { trocarComTransicao } from '../../lib/movimento.js';
import { humorDoResumo } from '../../lib/mascote.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import {
  dadosDosModelos,
  motivoPrincipal,
  motivosDoItem,
  numerosChave,
  resumoDosMotivos,
  tituloDoSinal,
  top5ParaEstudar,
} from '../../lib/top5Estudo.js';
import { REGRAS } from '../../lib/sugestoes.js';
import { BlocoErro, Carregador, Linhas } from '../ui/Estados.jsx';
import { BotaoDetalhes, PainelDetalhes } from '../ui/Detalhes.jsx';
import { IconeSetor } from '../ui/IconeSetor.jsx';
import Mascote from '../ui/Mascote.jsx';
import Modelo3D from '../modelos3d/Modelo3D.jsx';
import { Top5SeisMeses } from './Top5SeisMeses.jsx';
import { Variacao } from './Variacao.jsx';

const T = TEXTOS.top5Hoje;
const OBJETOS = ['balanca', 'moedas', 'cofrinho', 'pendulo'];
// abas do palco: a primeira é a que abre; o 3D só monta na segunda
const ABAS_PAINEL = ['porque', 'objeto'];
/** Até esses pontos aparecem na aba "Por que está aqui"; o resto vira "Mais N na ficha completa". */
const MAX_MOTIVOS = 4;
/** Ícone de cada tipo de sinal: forma diferente, além da cor e da palavra. */
const ICONE_DO_TOM = { forte: CircleCheck, atencao: TriangleAlert, contexto: Info };

const porcento = (v) => pct(v, { casas: 0, sinal: false });

/** Índice da aba que a tecla pede: setas circulares, Home e End; null para as outras teclas. */
function destinoDaTecla(tecla, indice, total) {
  if (tecla === 'ArrowRight' || tecla === 'ArrowDown') return indice === total - 1 ? 0 : indice + 1;
  if (tecla === 'ArrowLeft' || tecla === 'ArrowUp') return indice === 0 ? total - 1 : indice - 1;
  if (tecla === 'Home') return 0;
  if (tecla === 'End') return total - 1;
  return null;
}

/** Cartão da lista: posição, código, empresa, variação do dia e o motivo principal (os dois últimos só na coluna). */
function ItemDaLista({ item, selecionado, aoEscolher, nivel }) {
  const motivo = motivoPrincipal(item);
  const Icone = motivo ? ICONE_DO_TOM[motivo.tom] : null;
  return (
    <li>
      <button
        type="button"
        className="top5-item"
        aria-pressed={selecionado}
        data-indicador-alvo={selecionado ? 'true' : undefined}
        onClick={() => aoEscolher(item.ticker)}
      >
        <span className="top5-pos" aria-hidden="true">
          {item.posicao}
        </span>
        <span className="top5-item-nome">
          <span className="top5-ticker">{item.ticker}</span>
          {item.empresa && <span className="top5-empresa">{item.empresa}</span>}
        </span>
        <Variacao valor={item.variacao} />
        {motivo && (
          <span className="top5-item-motivo" data-tom={motivo.tom}>
            <Icone size={14} aria-hidden="true" />
            <span>
              <span className="sr-only">{`${T.tomMotivo[motivo.tom]}: `}</span>
              {tituloDoSinal(motivo, nivel)}
            </span>
          </span>
        )}
      </button>
    </li>
  );
}

/** Um ponto das regras: a linha (tipo e título) abre e fecha a explicação completa logo abaixo. */
function Motivo({ sinal, nivel }) {
  const { aberto, alternar, id } = useDetalhes();
  const Icone = ICONE_DO_TOM[sinal.tom];
  const frase = nivel === 'tecnico' && sinal.tecnico ? sinal.tecnico : sinal.simples;
  return (
    <li className="top5-motivo" data-tom={sinal.tom}>
      <button type="button" className="top5-motivo-botao" aria-expanded={aberto} aria-controls={id} onClick={alternar}>
        <span className="top5-motivo-tipo">
          <Icone size={14} aria-hidden="true" />
          {T.tomMotivo[sinal.tom]}
        </span>{' '}
        <span className="top5-motivo-titulo">{tituloDoSinal(sinal, nivel)}</span>
        <svg className="top5-motivo-seta" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <PainelDetalhes id={id} aberto={aberto}>
        <p>{frase}</p>
      </PainelDetalhes>
    </li>
  );
}

/** Aba "Por que está aqui": a frase-resumo em palavras e um ponto por linha, cada um com a sua explicação. */
function AbaPorQue({ item, nivel }) {
  const motivos = motivosDoItem(item);
  const mostrados = motivos.slice(0, MAX_MOTIVOS);
  const fora = motivos.length - mostrados.length;
  const resumo = resumoDosMotivos(item.contagem);
  return (
    <div className="top5-aba-corpo">
      {item.chance && <p className="top5-chance">{T.chance(porcento(item.chance.valor), porcento(item.chance.referencia))}</p>}
      {mostrados.length === 0 ? (
        <p className="top5-vazio">{T.semMotivos}</p>
      ) : (
        <>
          {resumo && (
            <div className="top5-resumo-linha">
              <Mascote humor={humorDoResumo(item.contagem)} acao="vivo" className="top5-mascote" />
              <p className="top5-resumo">{resumo}</p>
            </div>
          )}
          <ul className="top5-motivos">
            {mostrados.map((s) => (
              <Motivo key={`${s.tom}-${s.id}`} sinal={s} nivel={nivel} />
            ))}
          </ul>
        </>
      )}
      {fora > 0 && <p className="top5-mais">{T.maisNaFicha(fora)}</p>}
    </div>
  );
}

/** Conteúdo da aba "Entenda com um objeto": perguntas e o objeto 3D (só existe com a aba aberta). */
function AbaObjeto({ item, resumo }) {
  const [objeto, setObjeto] = useState(OBJETOS[0]);
  const botoes = useRef({});
  const idBase = useId();
  const dados = dadosDosModelos(resumo)[objeto];

  // a troca de objeto dá o crossfade curto do painel (movimento.css, seção 21)
  const trocarObjeto = (tipo) => trocarComTransicao(() => setObjeto(tipo), 'suave');
  const escolher = (tipo) => {
    trocarObjeto(tipo);
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
            onClick={() => trocarObjeto(tipo)}
            onKeyDown={(e) => aoTecla(e, indice)}
          >
            {T.abas[tipo]}
          </button>
        ))}
      </div>
      <div className="top5-objeto" role="tabpanel" id={`${idBase}-painel`} aria-labelledby={`${idBase}-${objeto}`}>
        <Modelo3D tipo={objeto} ticker={item.ticker} dados={dados} proximidade={1.12} />
      </div>
    </div>
  );
}

/**
 * Palco da ação escolhida: cabeçalho, preço em 6 meses, duas abas e o botão da ficha.
 * Remonta a cada ação (key no pai): a aba volta à primeira e os motivos voltam fechados.
 * `data-entrada`: 'acao' logo depois de montar (entrada em escada, movimento.css); 'aba' depois de trocar de aba
 * (só o conteúdo da aba esmaece). A pílula da aba ativa é um indicador só, que desliza (useIndicador).
 */
function Painel({ item, nivel }) {
  const [aba, setAba] = useState(ABAS_PAINEL[0]);
  const [entrada, setEntrada] = useState('acao');
  const botoesAba = useRef({});
  const indicadorAbas = useIndicador(aba);
  const rotuloAba = { porque: T.porQue, objeto: T.entenda };
  const idAba = (chave) => `top5-aba-${chave}`;
  const { alta6m } = numerosChave(item.resumo);

  // tocar na aba já ativa não muda nada (nem repete a animação do conteúdo)
  const trocarAba = (chave) => {
    if (chave === aba) return;
    setAba(chave);
    setEntrada('aba');
  };
  const escolherAba = (chave) => {
    trocarAba(chave);
    botoesAba.current[chave]?.focus();
  };
  const aoTeclaAba = (e, indice) => {
    const destino = destinoDaTecla(e.key, indice, ABAS_PAINEL.length);
    if (destino === null) return;
    e.preventDefault();
    escolherAba(ABAS_PAINEL[destino]);
  };

  return (
    <div className="top5-painel" role="region" aria-label={T.painelRotulo} data-entrada={entrada}>
      <header className="top5-painel-topo">
        <div className="top5-painel-cabeca">
          <span className="sr-only">{T.posicao(item.posicao)}</span>
          <p className="top5-painel-ticker">{item.ticker}</p>
          {(item.empresa || item.setor) && (
            <p className="top5-painel-meta">
              {item.empresa && <span>{item.empresa}</span>}
              {item.empresa && item.setor && <span aria-hidden="true">·</span>}
              {item.setor && (
                <span className="top5-setor">
                  <IconeSetor setor={item.setor} tamanho={14} />
                  {item.setor}
                </span>
              )}
            </p>
          )}
        </div>
        {(item.preco != null || item.variacao != null) && (
          <p className="top5-painel-preco">
            {item.preco != null && <span className="top5-painel-valor">{brl(item.preco)}</span>}
            <Variacao valor={item.variacao} />
          </p>
        )}
      </header>

      <Top5SeisMeses ticker={item.ticker} alta6m={alta6m} />

      <div className="top5-abas-painel" role="tablist" aria-label={T.abasPainelRotulo} ref={indicadorAbas.trilhoRef}>
        <span className="top5-aba-indicador" ref={indicadorAbas.indicadorRef} aria-hidden="true" />
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
            data-indicador-alvo={aba === chave ? 'true' : undefined}
            tabIndex={aba === chave ? 0 : -1}
            onClick={() => trocarAba(chave)}
            onKeyDown={(e) => aoTeclaAba(e, indice)}
          >
            {rotuloAba[chave]}
          </button>
        ))}
      </div>

      <div className="top5-painel-corpo" id="top5-conteudo" role="tabpanel" aria-labelledby={idAba(aba)}>
        {aba === 'porque' && <AbaPorQue item={item} nivel={nivel} />}
        {aba === 'objeto' && <AbaObjeto item={item} resumo={item.resumo} />}
      </div>

      <Link className="botao botao--principal top5-ficha" to={`/acao/${item.ticker}?pergunta=regras`}>
        {T.abrirFicha}
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}

/**
 * Top 5 para estudar hoje: lista (faixa de pílulas no celular) e o palco da ação escolhida.
 * Vem só das regras (o Top 5 do modelo ainda não é publicado). "Como escolhemos" explica a origem.
 * Conteúdo educativo: não é indicação de compra.
 */
export default function Top5Destaque() {
  const { data, isPending, isError } = useAnaliseDoDia();
  const recarregar = useRecarregarAnalise();
  const { nivel } = usePreferencias();
  const comoEscolhemos = useDetalhes();
  const [escolhido, setEscolhido] = useState(null);

  const carregando = isPending;
  const top = data ? top5ParaEstudar({ sugestoes: data.sugestoes }) : null;
  const itens = top?.itens ?? [];
  const atual = itens.find((i) => i.ticker === escolhido) ?? itens[0] ?? null;
  const comLista = !isError && !carregando && itens.length > 0;
  // a chave só existe com a lista na tela: assim o indicador mede de novo quando o carregamento termina
  const indicadorLista = useIndicador(comLista ? atual.ticker : null);

  let corpo;
  if (isError) {
    corpo = <BlocoErro titulo={T.erroTitulo} mensagem={T.erro} onTentarNovamente={recarregar} mascote />;
  } else if (carregando) {
    corpo = (
      <>
        <div className="top5-carregando">
          <Carregador rotulo={T.carregando} />
        </div>
        <Linhas quantidade={5} larguras={['100%', '92%', '100%', '88%', '96%']} />
      </>
    );
  } else if (itens.length === 0) {
    corpo = <p className="top5-vazio">{T.vazio}</p>;
  } else {
    corpo = (
      <>
        <div className="top5-grade">
          <ol className="top5-lista" aria-label={T.listaRotulo} ref={indicadorLista.trilhoRef}>
            <li className="top5-indicador" ref={indicadorLista.indicadorRef} aria-hidden="true" />
            {itens.map((item) => (
              <ItemDaLista
                key={item.ticker}
                item={item}
                selecionado={item.ticker === atual.ticker}
                aoEscolher={setEscolhido}
                nivel={nivel}
              />
            ))}
          </ol>
          <Painel key={atual.ticker} item={atual} nivel={nivel} />
        </div>
        <p className="sr-only" aria-live="polite">
          {T.escolhido(atual.ticker)}
        </p>
      </>
    );
  }

  return (
    <section id="top5" className="cartao top5" data-brilho="acento" aria-labelledby="top5-titulo">
      <div className="top5-topo">
        <div className="top5-topo-texto">
          <h2 id="top5-titulo" className="top5-titulo">
            <span className="top5-realce">{T.tituloInicio}</span> {T.tituloFim}
          </h2>
          {comLista && top.origem === 'modelo' && <span className="chip top5-selo">{T.seloModelo}</span>}
          <p className="top5-apoio">{top?.origem === 'modelo' ? T.apoioModelo : T.apoio}</p>
        </div>
        {comLista && (
          <BotaoDetalhes
            texto={T.comoEscolhemos}
            aberto={comoEscolhemos.aberto}
            controla={comoEscolhemos.id}
            onClick={comoEscolhemos.alternar}
          />
        )}
      </div>
      {comLista && (
        <PainelDetalhes id={comoEscolhemos.id} aberto={comoEscolhemos.aberto}>
          <p>
            {top.origem === 'modelo' ? porNivel(T.origemModelo, nivel) : porNivel(T.origemRegras, nivel)(REGRAS.length)}
          </p>
          {top.origem === 'modelo' && top.avisos.length > 0 && (
            <ul className="top5-avisos" aria-label={T.avisosModelo}>
              {top.avisos.map((aviso) => (
                <li key={aviso}>{aviso}</li>
              ))}
            </ul>
          )}
        </PainelDetalhes>
      )}
      {corpo}
    </section>
  );
}
