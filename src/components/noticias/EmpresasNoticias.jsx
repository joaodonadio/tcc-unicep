import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import Mascote from '../ui/Mascote.jsx';
import { quantidadeCheia } from '../../lib/formato.js';
import { agruparEmpresasPorNumeros } from '../../lib/empresasNoticias.js';
import { nomeCurto } from '../../lib/nomeEmpresa.js';
import { tomPredominante } from '../../lib/termometroNoticias.js';
import { useAcoes } from '../../hooks/useDados.js';
import { usePreferencias } from '../../context/contextos.js';
import { ROTULO_STATUS, TEXTOS, porNivel } from '../../lib/textos.js';

const INDISPONIVEL = ROTULO_STATUS.indisponivel;

/** Segmento só mostra o número se couber: 2rem com a fonte-base de 16px. */
const MIN_SEGMENTO_PX = 32;

/** Ordem dos segmentos da barra e da legenda; o ícone e a palavra dizem o tom, não só a cor. */
const TONS = [
  { chave: 'positivas', rotulo: TEXTOS.dia.manchetesPositivas, icone: <TrendingUp aria-hidden="true" className="noticias-empresa-icone" /> },
  { chave: 'neutras', rotulo: TEXTOS.dia.manchetesNeutras, icone: <Minus aria-hidden="true" className="noticias-empresa-icone" /> },
  { chave: 'negativas', rotulo: TEXTOS.dia.manchetesNegativas, icone: <TrendingDown aria-hidden="true" className="noticias-empresa-icone" /> },
];

const ICONE_PREDOMINIO = { positivas: TrendingUp, neutras: Minus, negativas: TrendingDown, empate: Minus };

/** Tickers com "e" antes do último: "PETR3 e PETR4". */
function listaComE(tickers) {
  if (tickers.length < 2) return tickers.join('');
  return `${tickers.slice(0, -1).join(', ')} e ${tickers[tickers.length - 1]}`;
}

/** Largura da barra preenchida em pixels; null até medir (sem ResizeObserver, como nos testes). */
function useLarguraBarra() {
  const ref = useRef(null);
  const [largura, setLargura] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return [ref, largura];
}

/** Uma empresa (ou grupo de tickers): rótulo à esquerda, barra no meio, total e predomínio à direita. */
function LinhaEmpresa({ grupo, maximo }) {
  const { tickers, nome, quantidade, positivas, neutras, negativas } = grupo;
  const [refBarra, larguraBarra] = useLarguraBarra();
  const valores = { positivas, neutras, negativas };
  const completo = [positivas, neutras, negativas].every((v) => v != null);
  const soma = completo ? positivas + neutras + negativas : 0;
  // a barra só existe com as três contagens e com total; ausência não vira segmento
  const temBarra = completo && quantidade != null && quantidade > 0 && soma > 0;
  const proporcao = temBarra ? quantidade / maximo : 0;
  const predomina = tomPredominante(grupo);
  const IconePredomina = predomina ? ICONE_PREDOMINIO[predomina] : null;
  const nomes = listaComE(tickers);
  const textoSr = completo && quantidade != null
    ? TEXTOS.dia.empresaResumoSr(nomes, quantidade, positivas, neutras, negativas)
    : `${nomes}: ${INDISPONIVEL}`;
  const rotuloNome = nomeCurto(nome);

  return (
    <li className="noticias-barra-linha">
      <div className="noticias-barra-rotulo">
        <p className="noticias-barra-tickers">
          {tickers.map((ticker, i) => (
            <span key={ticker}>
              {i > 0 && ' · '}
              <Link className="noticias-ticker" to={`/acao/${ticker}?pergunta=noticias`}>
                {ticker}
              </Link>
            </span>
          ))}
        </p>
        {rotuloNome && <p className="noticias-barra-nome">{rotuloNome}</p>}
      </div>

      <div className="noticias-barra-trilha" aria-hidden="true">
        {temBarra && (
          <div ref={refBarra} className="noticias-barra-preenchida" style={{ inlineSize: `${proporcao * 100}%` }}>
            {TONS.map(({ chave }) => {
              const valor = valores[chave];
              const cabe = larguraBarra != null && (valor / soma) * larguraBarra >= MIN_SEGMENTO_PX;
              return (
                <span key={chave} data-contagem={chave} style={{ flexGrow: valor }}>
                  {cabe && <span className="num">{quantidadeCheia(valor)}</span>}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="noticias-barra-total" aria-hidden="true">
        <p className="noticias-barra-quantidade">
          <span className="num">{quantidade == null ? '—' : quantidadeCheia(quantidade)}</span>
        </p>
        {predomina && (
          <p className="noticias-barra-predomina">
            <IconePredomina aria-hidden="true" className="noticias-empresa-icone" />
            <span>{TEXTOS.dia.predominio[predomina]}</span>
          </p>
        )}
      </div>

      <span className="sr-only">{textoSr}</span>
    </li>
  );
}

/**
 * Empresas com mais manchetes no pregão, em barras horizontais empilhadas (positivas, neutras, negativas).
 * Tickers da mesma empresa com os mesmos números ficam numa linha só.
 * @param {object} props
 * @param {object[]} [props.empresas] saída de empresasComManchetes
 */
export function EmpresasNoticias({ empresas }) {
  const { nivel } = usePreferencias();
  const { data: acoes } = useAcoes();

  if (!empresas?.length) return null;

  const nomePorTicker = new Map((acoes ?? []).map((acao) => [acao.ticker, acao.empresa]));
  const grupos = agruparEmpresasPorNumeros(empresas, nomePorTicker)
    .sort((a, b) => (b.quantidade ?? 0) - (a.quantidade ?? 0));
  // a barra de cada empresa é proporcional ao maior total da lista
  const maximo = Math.max(...grupos.map((g) => g.quantidade ?? 0));

  return (
    <section className="noticias-bloco" aria-labelledby="noticias-empresas-titulo">
      <h2 id="noticias-empresas-titulo" className="noticias-bloco-titulo">
        {porNivel(TEXTOS.dia.empresasTitulo, nivel)}
      </h2>
      <div className="noticias-bloco-nota-linha">
        <Mascote humor="curioso" className="noticias-pavio-nota" />
        <p className="noticias-bloco-nota">{porNivel(TEXTOS.dia.empresasNota, nivel)}</p>
      </div>
      <div className="cartao noticias-barras" data-brilho="dado">
        <ul className="noticias-barras-legenda">
          {TONS.map(({ chave, rotulo, icone }) => (
            <li key={chave} data-contagem={chave}>
              {icone}
              <span>{rotulo}</span>
            </li>
          ))}
        </ul>
        <ol className="noticias-barras-lista entra-lista">
          {grupos.map((grupo) => (
            <LinhaEmpresa key={grupo.tickers.join('|')} grupo={grupo} maximo={maximo} />
          ))}
        </ol>
      </div>
    </section>
  );
}
