import { useCallback, useEffect, useMemo, useState } from 'react';
import { PreferenciasContext } from './contextos.js';

/**
 * RF-5.1 (nível de explicação) · RF-5.3 (zoom) · animações.
 *
 * As preferências persistem em localStorage e são aplicadas na raiz do
 * documento: o zoom é uma custom property lida pelo `font-size` do <html>, e
 * `data-movimento` (reduzido | livre) é lido pelo CSS e pelo JS. Nenhum componente
 * precisa saber que existem.
 */

const CHAVE = 'painel-b3:preferencias';
const ZOOM_MIN = 0.9;
const ZOOM_MAX = 1.3;
const ZOOM_PASSO = 0.1;
const CONSULTA_MOVIMENTO = '(prefers-reduced-motion: reduce)';
const MOVIMENTOS = ['ligadas', 'desligadas'];

// movimento null = a pessoa nunca escolheu (ou tinha o antigo 'sistema'): vale a preferência do sistema
const PADRAO = { nivel: 'simples', zoom: 1, movimento: null };

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    if (!salvo) return PADRAO;
    return {
      nivel: salvo.nivel === 'tecnico' ? 'tecnico' : 'simples',
      zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(salvo.zoom) || 1)),
      movimento: MOVIMENTOS.includes(salvo.movimento) ? salvo.movimento : null,
    };
  } catch {
    return PADRAO;
  }
}

function sistemaPedeMenosMovimento() {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia(CONSULTA_MOVIMENTO).matches;
  } catch {
    return false;
  }
}

export function PreferenciasProvider({ children }) {
  const [prefs, setPrefs] = useState(carregar);
  const [sistemaReduz, setSistemaReduz] = useState(sistemaPedeMenosMovimento);

  // o sistema operacional pode mudar a preferência de animações com o site aberto
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(CONSULTA_MOVIMENTO);
    const aoMudar = (e) => setSistemaReduz(e.matches);
    mq.addEventListener?.('change', aoMudar);
    return () => mq.removeEventListener?.('change', aoMudar);
  }, []);

  // sem escolha, o inicial é a preferência do sistema (e acompanha o sistema enquanto não houver escolha)
  const movimentoEscolhido = prefs.movimento !== null;
  const movimento = prefs.movimento ?? (sistemaReduz ? 'desligadas' : 'ligadas');
  const movimentoReduzido = movimento === 'desligadas';

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(prefs));
    } catch {
      /* modo privado do navegador: seguir sem persistir */
    }
    const raiz = document.documentElement;
    raiz.style.setProperty('--ui-zoom', String(prefs.zoom));
  }, [prefs]);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset.movimento = movimentoReduzido ? 'reduzido' : 'livre';
    return () => {
      delete raiz.dataset.movimento;
    };
  }, [movimentoReduzido]);

  const definirNivel = useCallback(
    (nivel) => setPrefs((p) => ({ ...p, nivel: nivel === 'tecnico' ? 'tecnico' : 'simples' })),
    [],
  );
  const definirMovimento = useCallback(
    (escolha) =>
      setPrefs((p) => ({ ...p, movimento: MOVIMENTOS.includes(escolha) ? escolha : null })),
    [],
  );
  const aumentarZoom = useCallback(
    () => setPrefs((p) => ({ ...p, zoom: Number(Math.min(ZOOM_MAX, p.zoom + ZOOM_PASSO).toFixed(2)) })),
    [],
  );
  const diminuirZoom = useCallback(
    () => setPrefs((p) => ({ ...p, zoom: Number(Math.max(ZOOM_MIN, p.zoom - ZOOM_PASSO).toFixed(2)) })),
    [],
  );
  const restaurarZoom = useCallback(() => setPrefs((p) => ({ ...p, zoom: 1 })), []);

  const valor = useMemo(
    () => ({
      ...prefs,
      movimento,
      movimentoEscolhido,
      definirNivel,
      definirMovimento,
      movimentoReduzido,
      aumentarZoom,
      diminuirZoom,
      restaurarZoom,
      zoomNoMaximo: prefs.zoom >= ZOOM_MAX,
      zoomNoMinimo: prefs.zoom <= ZOOM_MIN,
    }),
    [
      prefs,
      movimento,
      movimentoEscolhido,
      movimentoReduzido,
      definirNivel,
      definirMovimento,
      aumentarZoom,
      diminuirZoom,
      restaurarZoom,
    ],
  );

  return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>;
}
