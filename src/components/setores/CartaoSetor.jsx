import { Link } from 'react-router-dom';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { IconeSetor } from '../ui/IconeSetor.jsx';
import { SeloRevisao } from '../ui/SeloRevisao.jsx';
import { pct } from '../../lib/formato.js';
import { ancoraDoSetor, descricaoDoSetor, sinalDaVariacao } from '../../lib/setores.js';
import { tomDoSaldo } from '../../lib/mercadoTela.js';
import { EXPLICACOES } from '../../lib/explicacoes.js';
import { TEXTOS } from '../../lib/textos.js';

const texto = (v) => (v == null ? TEXTOS.setores.semDado : pct(v));

/** Brilho do cartão pela direção da média (alta, queda ou aço quando estável ou sem dado). */
const BRILHO = { alta: 'alta', queda: 'queda', estavel: 'aco' };

/** Seta de cada ação com nome (o sinal também vai na forma, não só na cor). */
const SETA = { alta: '↑', queda: '↓' };

/** Estado da ação: alta, queda, estável, sem dado ou em revisão. */
function estadoDaAcao(a) {
  if (a.revisao) return 'revisao';
  if (a.variacao == null) return 'sem';
  return sinalDaVariacao(a.variacao);
}

/** Texto da ação para leitor de tela e para o title ("PETR4, Petrobras, +1,2% no período"). */
function rotuloDaAcao(a) {
  const situacao = a.revisao
    ? TEXTOS.setores.emRevisaoAcao
    : a.variacao == null
      ? TEXTOS.setores.semDado
      : TEXTOS.setores.variacaoNoPeriodo(pct(a.variacao));
  return TEXTOS.setores.pontoAcao(a.ticker, a.empresa, situacao);
}

/** Nome do setor que leva às ações dele, na tela Ações (a âncora cai na linha do setor no mapa). */
function NomeDoSetor({ nome }) {
  return (
    <Link className="setor-nome-link" to={`/acoes#${ancoraDoSetor(nome)}`}>
      {nome}
    </Link>
  );
}

/**
 * Uma pílula ou um ponto por ação do setor, colorido pelo tom da própria variação. Na pílula, cada uma leva
 * à ação; no ponto, não há link (o nome do setor é que leva às ações), e a lista traz um resumo para leitor de tela.
 */
function PontosAcoes({ setor, acoes, comTicker = false }) {
  if (acoes.length === 0) return null;
  const subiram = acoes.filter((a) => estadoDaAcao(a) === 'alta').length;
  const cairam = acoes.filter((a) => estadoDaAcao(a) === 'queda').length;
  return (
    <ul
      className={comTicker ? 'setor-pontos setor-pontos--pilulas' : 'setor-pontos'}
      aria-label={
        comTicker
          ? TEXTOS.setores.pilulasDoSetor(setor)
          : TEXTOS.setores.resumoPontos(acoes.length, subiram, cairam)
      }
    >
      {acoes.map((a, i) => {
        const estado = estadoDaAcao(a);
        const rotulo = rotuloDaAcao(a);
        return (
          <li key={a.ticker}>
            {comTicker ? (
              <Link className="setor-ponto" data-estado={estado} to={`/acao/${a.ticker}`} title={rotulo} aria-label={rotulo} style={{ '--i': i }}>
                <span className="setor-ponto-ticker">{a.ticker}</span>
                {SETA[estado] && <span className="setor-ponto-seta" aria-hidden="true">{SETA[estado]}</span>}
              </Link>
            ) : (
              <span className="setor-ponto" data-estado={estado} title={rotulo} style={{ '--i': i }} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Contagem curta "4↑ 3↓" (números em Mono); a frase de leitura de tela segue a concordância da lista. */
function Contagem({ setor }) {
  if (setor.n === 0) return <p className="setor-contagem setor-contagem--vazia">{TEXTOS.setores.semDado}</p>;
  return (
    <p className="setor-contagem">
      <span data-sinal="alta" aria-hidden="true">{`${setor.subiram}↑`}</span>{' '}
      <span data-sinal="queda" aria-hidden="true">{`${setor.cairam}↓`}</span>
      <span className="sr-only">{TEXTOS.setores.subiramAcoes(setor.subiram, setor.n)}</span>
    </p>
  );
}

/** Fatias do tom do setor, na ordem da barra; o ícone diz o sinal, não só a cor. */
const FATIAS_TOM = [
  { chave: 'positivas', icone: <TrendingUp size={14} aria-hidden="true" focusable="false" /> },
  { chave: 'neutras', icone: <Minus size={14} aria-hidden="true" focusable="false" /> },
  { chave: 'negativas', icone: <TrendingDown size={14} aria-hidden="true" focusable="false" /> },
];

/**
 * Tom das notícias do dia do setor, separado do resto do cartão por uma faixa. Barra e legenda
 * com as três contagens. Sem contagem (tom nulo ou total zero), o bloco não aparece.
 */
function Tom({ tom }) {
  const total = tom?.total ?? 0;
  if (!total) return null;
  const chaveTom = tomDoSaldo(tom.saldo);
  return (
    <div className="setor-tom">
      <p className="setor-tom-cabeca">
        <BotaoTermo chave="tom_setor">
          <span className="setor-rotulo" title={EXPLICACOES.tom_setor.simples}>{TEXTOS.setores.tomNoticias}</span>
        </BotaoTermo>
      </p>
      <p className="setor-tom-resumo">{chaveTom ? TEXTOS.setores.tom[chaveTom] : TEXTOS.setores.semDado}</p>
      <div className="setor-tom-barra" aria-hidden="true">
        {FATIAS_TOM.map(({ chave }) => (
          <span key={chave} data-contagem={chave} style={{ flexGrow: tom[chave] ?? 0 }} />
        ))}
      </div>
      <ul className="setor-tom-legenda">
        {FATIAS_TOM.map(({ chave, icone }) => (
          <li key={chave} data-contagem={chave}>
            {icone}
            <span className="num">{tom[chave] ?? '—'}</span>
            <span>{TEXTOS.setores.tomFatias[chave]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Cartão de destaque: o setor que mais subiu ou mais caiu no período. Traz o que o setor faz (simples)
 * ou o rótulo técnico, a média grande e todas as ações como pílulas com o ticker.
 */
export function CartaoDestaque({ setor, canto, linhaTecnica, tecnico, tom }) {
  const sinal = sinalDaVariacao(setor.media);
  const descricao = descricaoDoSetor(setor.setor, TEXTOS.setores.descricoes);
  // A primeira frase da descrição (antes dos dois pontos) é o que o setor faz, em uma linha.
  const oQueFaz = descricao ? descricao.split(':')[0] : null;
  // A frase técnica vem da grade, junto com o canto, para os dois nunca se contradizerem.
  const linha = tecnico ? linhaTecnica : oQueFaz;

  return (
    <article
      id={ancoraDoSetor(setor.setor)}
      className="cartao setor-cartao setor-cartao--destaque"
      style={{ viewTransitionName: ancoraDoSetor(setor.setor) }}
      data-brilho={BRILHO[sinal]}
    >
      <span className="setor-canto">{canto}</span>
      <header className="setor-cabeca">
        <span className="setor-selo-grande">
          <IconeSetor setor={setor.setor} tamanho={26} />
        </span>
        <h3 className="setor-nome" title={descricao ?? undefined}><NomeDoSetor nome={setor.setor} /></h3>
      </header>

      {linha && <p className="setor-linha-faz">{linha}</p>}

      <p className="setor-valor setor-valor--grande" data-sinal={sinal}>
        {texto(setor.media)}
      </p>

      <Contagem setor={setor} />
      <PontosAcoes setor={setor.setor} acoes={setor.acoes} comTicker />
      {setor.emRevisao.length > 0 && <SeloRevisao compacto />}
      {tecnico && <Tom tom={tom} />}
    </article>
  );
}

/**
 * Cartão compacto de um setor: ícone e nome, a média em destaque (com sinal e cor), a contagem curta
 * e as ações como pontos coloridos. A descrição fica no title do nome. Ação em revisão não entra na média.
 */
export function CartaoSetor({ setor, tecnico, tom }) {
  const sinal = sinalDaVariacao(setor.media);
  const descricao = descricaoDoSetor(setor.setor, TEXTOS.setores.descricoes);

  return (
    <article
      id={ancoraDoSetor(setor.setor)}
      className="cartao setor-cartao setor-cartao--compacto"
      style={{ viewTransitionName: ancoraDoSetor(setor.setor) }}
      data-brilho={BRILHO[sinal]}
    >
      <header className="setor-cabeca">
        <span className="setor-selo-grande">
          <IconeSetor setor={setor.setor} tamanho={20} />
        </span>
        <h3 className="setor-nome" title={descricao ?? undefined}><NomeDoSetor nome={setor.setor} /></h3>
        <Contagem setor={setor} />
      </header>

      <p className="setor-valor" data-sinal={sinal}>
        {texto(setor.media)}
      </p>

      <PontosAcoes setor={setor.setor} acoes={setor.acoes} />
      {setor.emRevisao.length > 0 && <SeloRevisao compacto />}
      {tecnico && <Tom tom={tom} />}
    </article>
  );
}
