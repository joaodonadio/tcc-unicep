import { Link } from 'react-router-dom';
import { ChevronRight, Info, Sparkles, ThumbsUp, TriangleAlert } from 'lucide-react';
import { BotaoGuardar } from '../ui/BotaoGuardar.jsx';
import { IconeSetor } from '../ui/IconeSetor.jsx';
import { brl, numero, pct } from '../../lib/formato.js';
import { direcaoDe } from '../../lib/mapaPregao.js';
import { motivoDoDestaque } from '../../lib/listaAcoes.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { exibir } from '../../lib/valor.js';

/** Classe de cor da variação; sem direção (ausente) não recebe cor. */
const CLASSE_VARIACAO = { up: 'valor--alta', down: 'valor--queda', flat: 'valor--estavel' };

/** Cor e ícone de cada tipo de sinal; o texto de cada selo vem de TEXTOS. */
const SINAIS = {
  forte: { tom: 'alta', Icone: ThumbsUp },
  atencao: { tom: 'queda', Icone: TriangleAlert },
  contexto: { tom: 'neutro', Icone: Info },
};

/** Selo de um tipo de sinal: ícone e texto na cor do tipo. */
export function SeloSinal({ tipo, children }) {
  const { tom, Icone } = SINAIS[tipo];
  return (
    <span className="selo-sinal" data-tom={tom}>
      <Icone size={16} strokeWidth={2} aria-hidden="true" />
      {children}
    </span>
  );
}

/** Selos de sinais de uma ação, com contagem por extenso; sem sinal, o texto "Nenhuma regra". */
function selosDeSinais(contagem = {}) {
  const partes = [];
  if (Number(contagem.forte) > 0) partes.push({ tipo: 'forte', texto: TEXTOS.acoes.pontosAFavor(contagem.forte) });
  if (Number(contagem.atencao) > 0) {
    partes.push({ tipo: 'atencao', texto: TEXTOS.acoes.pontosDeAtencao(contagem.atencao) });
  }
  if (Number(contagem.contexto) > 0) {
    partes.push({ tipo: 'contexto', texto: TEXTOS.acoes.fatosDeContexto(contagem.contexto) });
  }
  if (!partes.length) return TEXTOS.acoes.semSinal;
  return partes.map((p) => (
    <SeloSinal key={p.tipo} tipo={p.tipo}>
      {p.texto}
    </SeloSinal>
  ));
}

/**
 * Cartão grande do destaque de um setor: setor com o ícone, ticker, empresa, preço e variação,
 * selos de sinais e o porquê (texto simples do primeiro sinal a favor). Link para a ficha.
 */
export function CartaoDestaque({ acao, nivel, nivelTitulo = 3 }) {
  const { ticker, nome, setor_nome: setor, fechamento, variacao_dia: variacao } = acao;
  const direcao = direcaoDe(variacao);
  const motivo = motivoDoDestaque(acao.sugestao);
  const Sub = `h${nivelTitulo}`;

  return (
    <li className="cartao destaque">
      <p className="destaque__setor">
        <IconeSetor setor={setor} />
        <span>{setor}</span>
      </p>
      <Sub>
        <Link
          className="destaque__ticker"
          to={'/acao/' + ticker}
          aria-label={TEXTOS.acoes.destaqueVerFicha(ticker)}
        >
          {ticker}
        </Link>
      </Sub>
      <p className="destaque__empresa">{nome ?? '—'}</p>
      <p className="destaque__preco">
        <span className="valor">{brl(fechamento) || '—'}</span>
        <span
          className="pilula"
          data-tom={direcao === 'up' ? 'alta' : direcao === 'down' ? 'queda' : 'neutro'}
        >
          {pct(variacao) || '—'}
        </span>
      </p>
      <p className="destaque__sinais">{selosDeSinais(acao.contagem)}</p>
      <div className="destaque__porque">
        <p className="destaque__porque-rotulo">
          <Sparkles size={16} strokeWidth={2} aria-hidden="true" />
          {porNivel(TEXTOS.acoes.destaquePorque, nivel)}
        </p>
        <p className="destaque__porque-texto">{motivo ?? porNivel(TEXTOS.acoes.destaqueSemMotivo, nivel)}</p>
      </div>
      {/* Dica visual: o cartão inteiro já é o link da ficha (ver .destaque__ticker::after). */}
      <span className="destaque__ficha" aria-hidden="true">
        {TEXTOS.acoes.destaqueFicha}
        <ChevronRight size={16} strokeWidth={2} />
      </span>
    </li>
  );
}

/** Indicador da lista no nível Técnica (P/L ou DY): rótulo visível só no celular, valor com "—" se ausente. */
function Indicador({ classe, rotulo, campo, formatar }) {
  const celula = exibir(campo, formatar);
  return (
    <span className={'lista-indicador ' + classe}>
      <span className="lista-indicador__rotulo">{rotulo}</span>
      {celula.texto}
      {celula.motivo && <span className="sr-only"> {celula.motivo}</span>}
    </span>
  );
}

/**
 * Uma ação na lista "Todas as ações": ticker, empresa, setor, fechamento, variação do dia,
 * selos de sinais e o botão Guardar. No nível Técnica, `linha` (de linhasDaTabela) traz P/L e DY.
 * Ausência vira "—".
 */
export default function LinhaAcao({ acao, linha }) {
  const { ticker, nome, setor_nome: setor, fechamento, variacao_dia: variacao } = acao;
  const direcao = direcaoDe(variacao);

  return (
    <li className="lista-linha">
      <Link className="lista-ticker" to={'/acao/' + ticker}>
        {ticker}
      </Link>
      <span className="lista-empresa">{nome ?? '—'}</span>
      <span className="lista-setor">{setor ?? '—'}</span>
      <span className="lista-preco valor">{brl(fechamento) || '—'}</span>
      <span className={'lista-variacao valor' + (direcao ? ' ' + CLASSE_VARIACAO[direcao] : '')}>
        {pct(variacao) || '—'}
      </span>
      {linha && (
        <>
          <Indicador classe="lista-pl" rotulo={TEXTOS.acoes.colunas.pl} campo={linha.pl} formatar={(v) => numero(v, { casas: 1 })} />
          <Indicador
            classe="lista-dy"
            rotulo={TEXTOS.acoes.colunas.dy}
            campo={linha.dy}
            formatar={(v) => pct(v, { sinal: false })}
          />
        </>
      )}
      <span className="lista-sinais">{selosDeSinais(acao.contagem)}</span>
      <BotaoGuardar ticker={ticker} compacto />
    </li>
  );
}
