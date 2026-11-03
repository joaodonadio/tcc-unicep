import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import Mascote from '../ui/Mascote.jsx';

/** Chave do localStorage que guarda o bloco fechado pelo X. */
const CHAVE_FECHADO = 'painel-b3:como-usar-fechado';
/** Hash que o botão "Como usar" do cabeçalho aponta. */
const HASH_COMO_USAR = '#como-usar';

/**
 * Destino de cada passo, na mesma ordem de TEXTOS.comoUsar.passos.
 * "#top5" é a lista logo abaixo desta faixa; os demais são as páginas, na ordem sugerida.
 */
const DESTINOS = ['#top5', '/mercado', '/setores', '/acoes', '/proventos'];

function lerFechado() {
  try {
    return localStorage.getItem(CHAVE_FECHADO) === '1';
  } catch {
    return false;
  }
}

function gravarFechado(fechado) {
  try {
    if (fechado) localStorage.setItem(CHAVE_FECHADO, '1');
    else localStorage.removeItem(CHAVE_FECHADO);
  } catch {
    // sem armazenamento disponível: o bloco volta aberto na próxima visita
  }
}

/** Ilustrações decorativas (aria-hidden), sem texto nem número. Cada uma mostra o próprio passo. */
function IlustraBarras() {
  return (
    <span className="como-usar__ilustra como-usar__ilustra--barras" aria-hidden="true">
      <span className="como-usar__barra" />
      <span className="como-usar__barra" />
      <span className="como-usar__barra" />
      <span className="como-usar__barra" />
      <span className="como-usar__barra" />
    </span>
  );
}

function IlustraCartao() {
  return (
    <span className="como-usar__ilustra como-usar__ilustra--cartao" aria-hidden="true">
      <span className="como-usar__cartao">
        <span className="como-usar__face como-usar__face--frente">
          <span className="como-usar__linha-falsa" />
          <span className="como-usar__linha-falsa como-usar__linha-falsa--curta" />
        </span>
        <span className="como-usar__face como-usar__face--verso">
          <svg viewBox="0 0 60 30" focusable="false">
            <polyline pathLength="1" points="2,26 14,18 24,21 36,10 46,14 58,4" />
          </svg>
        </span>
      </span>
    </span>
  );
}

function IlustraLinha() {
  return (
    <span className="como-usar__ilustra como-usar__ilustra--linha" aria-hidden="true">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" focusable="false">
        <polyline pathLength="1" points="2,30 16,24 28,27 42,16 56,20 70,10 84,14 98,6" />
      </svg>
    </span>
  );
}

function IlustraBlocos() {
  const tons = ['alta', 'alta', 'neutro', 'queda', 'alta', 'queda', 'neutro', 'queda'];
  return (
    <span className="como-usar__ilustra como-usar__ilustra--blocos" aria-hidden="true">
      {tons.map((tom, i) => (
        <span key={i} className="como-usar__bloco" data-tom={tom} />
      ))}
    </span>
  );
}

function IlustraMoedas() {
  return (
    <span className="como-usar__ilustra como-usar__ilustra--moedas" aria-hidden="true">
      <span className="como-usar__pilha">
        <span className="como-usar__moeda" />
        <span className="como-usar__moeda" />
        <span className="como-usar__moeda" />
      </span>
      <span className="como-usar__pilha">
        <span className="como-usar__moeda" />
        <span className="como-usar__moeda" />
        <span className="como-usar__moeda" />
        <span className="como-usar__moeda" />
      </span>
    </span>
  );
}

/**
 * Uma ilustração por passo, na mesma ordem de DESTINOS: Top 5 com o ranking em barras,
 * Mercado com a linha do índice, Setores com os blocos do mapa, Ações com o cartão que vira
 * e Proventos com as pilhas de moedas.
 */
const ILUSTRACOES = [IlustraBarras, IlustraLinha, IlustraBlocos, IlustraCartao, IlustraMoedas];

/**
 * Para quem é o painel e como usar, no topo da página inicial. Os passos são cartões
 * que levam às páginas na ordem sugerida. Some ao ser fechado pelo X (lembrado no
 * localStorage) e reabre quando o hash #como-usar é pedido pelo cabeçalho.
 */
export default function ComoUsar() {
  const { nivel } = usePreferencias();
  const { hash, key } = useLocation();
  const pedido = hash === HASH_COMO_USAR;
  const [aberto, setAberto] = useState(() => !lerFechado());
  const ref = useRef(null);
  // sem IntersectionObserver (jsdom, navegador antigo) os passos já aparecem
  const [visivel, setVisivel] = useState(() => typeof IntersectionObserver === 'undefined');
  // os loops das ilustrações só rodam enquanto a lista está na tela (data-em-vista)
  const [emVista, setEmVista] = useState(true);
  const passosRef = useRef(null);

  // os passos entram com escalonamento na primeira vez que a lista chega na tela;
  // depois disso o observador segue acompanhando, para pausar os loops ao sair da tela
  useEffect(() => {
    const el = passosRef.current;
    if (!aberto || !el || typeof IntersectionObserver === 'undefined') return undefined;
    const observador = new IntersectionObserver(
      (entradas) => {
        const dentro = entradas.some((e) => e.isIntersecting);
        setEmVista(dentro);
        if (dentro) setVisivel(true);
      },
      { threshold: 0.2 },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, [aberto]);

  // o cabeçalho pediu o bloco: reabre e lembra que ficou aberto
  useEffect(() => {
    if (!pedido) return;
    setAberto(true);
    gravarFechado(false);
  }, [pedido, key]);

  // rola até o bloco depois que ele entra na tela; jsdom não implementa scrollIntoView
  useEffect(() => {
    const el = ref.current;
    if (!aberto || !pedido || !el || typeof el.scrollIntoView !== 'function') return;
    el.scrollIntoView({ block: 'start' });
  }, [aberto, pedido, key]);

  if (!aberto) return null;
  const palavras = porNivel(TEXTOS.comoUsar.palavras, nivel);

  function fechar() {
    setAberto(false);
    gravarFechado(true);
  }

  return (
    <section
      id="como-usar"
      ref={ref}
      className="como-usar"
      data-brilho="acento"
      aria-labelledby="como-usar-titulo"
    >
      <div className="como-usar__topo">
        <Mascote humor="contente" acao="acenando" className="como-usar__mascote" />
        <div className="como-usar__resumo">
          <h2 id="como-usar-titulo" className="como-usar__titulo">
            {porNivel(TEXTOS.comoUsar.titulo, nivel)}
          </h2>
          <p className="como-usar__publico">{porNivel(TEXTOS.comoUsar.publico, nivel)}</p>
        </div>

        <ol
          className="como-usar__passos"
          ref={passosRef}
          data-visivel={visivel ? 'true' : 'false'}
          data-em-vista={emVista ? 'true' : 'false'}
        >
          {porNivel(TEXTOS.comoUsar.passos, nivel).map((passo, i) => {
            const Ilustra = ILUSTRACOES[i];
            return (
              <li key={DESTINOS[i]} className="como-usar__passo" style={{ '--atraso': `${i * 80}ms` }}>
                <Link className="como-usar__link" to={DESTINOS[i]}>
                  <span className="como-usar__anel" aria-hidden="true">
                    <svg viewBox="0 0 40 40" focusable="false">
                      <circle cx="20" cy="20" r="17" pathLength="100" />
                    </svg>
                    <span className="como-usar__numero">{i + 1}</span>
                  </span>
                  <Ilustra />
                  <span className="como-usar__texto">
                    <strong className="como-usar__passo-titulo">{passo.titulo}</strong>
                    <span className="como-usar__passo-detalhe">{passo.detalhe}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          className="como-usar__fechar"
          onClick={fechar}
          aria-label={TEXTOS.comoUsar.fechar}
          title={TEXTOS.comoUsar.fechar}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="square"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>

      <div className="como-usar__notas">
        <p className="como-usar__finalidade">{porNivel(TEXTOS.comoUsar.finalidade, nivel)}</p>
        <p className="como-usar__termos">{porNivel(TEXTOS.comoUsar.termos, nivel)}</p>
        <p className="como-usar__termos">
          {palavras.antes}
          <BotaoTermo chave="pregao">{palavras.pregao}</BotaoTermo>
          {palavras.meio1}
          <BotaoTermo chave="b3">{palavras.b3}</BotaoTermo>
          {palavras.meio2}
          <BotaoTermo chave="acao">{palavras.acoes}</BotaoTermo>
          {palavras.depois}
        </p>
      </div>
    </section>
  );
}
