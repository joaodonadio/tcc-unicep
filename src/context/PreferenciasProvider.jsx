import { useCallback, useEffect, useMemo, useState } from 'react';
import { PreferenciasContext } from './contextos.js';

/**
 * RF-5.1 (nível de explicação) · RF-5.2 (Modo Calmo) · RF-5.3 (zoom).
 *
 * As três preferências persistem em localStorage e são aplicadas na raiz do
 * documento: o Modo Calmo é uma classe (troca só as variáveis de perda) e o
 * zoom é uma custom property lida pelo `font-size` do <html>. Nenhum
 * componente precisa saber que existem.
 */

const CHAVE = 'investia:preferencias';
const ZOOM_MIN = 0.9;
const ZOOM_MAX = 1.3;
const ZOOM_PASSO = 0.1;

const PADRAO = { nivel: 'simples', calmo: false, zoom: 1 };

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    if (!salvo) return PADRAO;
    return {
      nivel: salvo.nivel === 'tecnico' ? 'tecnico' : 'simples',
      calmo: Boolean(salvo.calmo),
      zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(salvo.zoom) || 1)),
    };
  } catch {
    return PADRAO;
  }
}

export function PreferenciasProvider({ children }) {
  const [prefs, setPrefs] = useState(carregar);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(prefs));
    } catch {
      /* modo privado do navegador: seguir sem persistir */
    }
    const raiz = document.documentElement;
    raiz.classList.toggle('modo-calmo', prefs.calmo);
    raiz.style.setProperty('--ui-zoom', String(prefs.zoom));
  }, [prefs]);

  const definirNivel = useCallback(
    (nivel) => setPrefs((p) => ({ ...p, nivel: nivel === 'tecnico' ? 'tecnico' : 'simples' })),
    [],
  );
  const alternarCalmo = useCallback(() => setPrefs((p) => ({ ...p, calmo: !p.calmo })), []);
  const aumentarZoom = useCallback(
    () => setPrefs((p) => ({ ...p, zoom: Number(Math.min(ZOOM_MAX, p.zoom + ZOOM_PASSO).toFixed(2)) })),
    [],
  );
  const diminuirZoom = useCallback(
    () => setPrefs((p) => ({ ...p, zoom: Number(Math.max(ZOOM_MIN, p.zoom - ZOOM_PASSO).toFixed(2)) })),
    [],
  );

  const valor = useMemo(
    () => ({
      ...prefs,
      definirNivel,
      alternarCalmo,
      aumentarZoom,
      diminuirZoom,
      zoomNoMaximo: prefs.zoom >= ZOOM_MAX,
      zoomNoMinimo: prefs.zoom <= ZOOM_MIN,
    }),
    [prefs, definirNivel, alternarCalmo, aumentarZoom, diminuirZoom],
  );

  return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>;
}
