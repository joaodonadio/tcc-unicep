import { useCallback, useEffect, useMemo, useState } from 'react';
import { ListaContext } from './contextos.js';

/**
 * Minha lista: ações que o usuário guardou para acompanhar.
 *
 * Fica em localStorage como array JSON de tickers em MAIÚSCULAS, sem repetição.
 * Storage bloqueado ou JSON inválido vira lista vazia. Outras abas são
 * sincronizadas pelo evento `storage`.
 */

const CHAVE = 'painel-b3:lista';

const normalizar = (ticker) => String(ticker ?? '').trim().toUpperCase();

function limpar(lista) {
  const vistos = new Set();
  for (const item of lista) {
    const ticker = typeof item === 'string' ? normalizar(item) : '';
    if (ticker) vistos.add(ticker);
  }
  return [...vistos];
}

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    return Array.isArray(salvo) ? limpar(salvo) : [];
  } catch {
    return [];
  }
}

export function ListaProvider({ children }) {
  const [tickers, setTickers] = useState(carregar);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(tickers));
    } catch {
      /* modo privado do navegador: seguir sem persistir */
    }
  }, [tickers]);

  useEffect(() => {
    const aoMudarStorage = (evento) => {
      if (evento.key === CHAVE || evento.key === null) setTickers(carregar());
    };
    window.addEventListener('storage', aoMudarStorage);
    return () => window.removeEventListener('storage', aoMudarStorage);
  }, []);

  const tem = useCallback((ticker) => tickers.includes(normalizar(ticker)), [tickers]);

  const alternar = useCallback((ticker) => {
    const alvo = normalizar(ticker);
    if (!alvo) return;
    setTickers((atual) =>
      atual.includes(alvo) ? atual.filter((t) => t !== alvo) : [...atual, alvo],
    );
  }, []);

  const valor = useMemo(
    () => ({ tickers, total: tickers.length, tem, alternar }),
    [tickers, tem, alternar],
  );

  return <ListaContext.Provider value={valor}>{children}</ListaContext.Provider>;
}
