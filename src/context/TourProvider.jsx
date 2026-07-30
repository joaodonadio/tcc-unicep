import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TourContext } from './contextos.js';
import { PASSOS_TOUR } from '../lib/passosTour.js';

/**
 * RF-5.5 — tour guiado em 5 passos.
 *
 * Cada passo NAVEGA de verdade para a tela correspondente (aprendizado
 * situado, M6/M10): o usuário vê a tela real enquanto lê a explicação, em vez
 * de um manual estático.
 */
export function TourProvider({ children }) {
  const [passo, setPasso] = useState(null);
  const navigate = useNavigate();

  const irPara = useCallback(
    (indice) => {
      setPasso(indice);
      navigate(PASSOS_TOUR[indice].rota);
    },
    [navigate],
  );

  const iniciar = useCallback(() => irPara(0), [irPara]);
  const fechar = useCallback(() => setPasso(null), []);
  const proximo = useCallback(() => {
    setPasso((atual) => {
      const seguinte = atual + 1;
      if (seguinte >= PASSOS_TOUR.length) return null;
      navigate(PASSOS_TOUR[seguinte].rota);
      return seguinte;
    });
  }, [navigate]);
  const anterior = useCallback(() => {
    setPasso((atual) => {
      const previo = Math.max(0, atual - 1);
      navigate(PASSOS_TOUR[previo].rota);
      return previo;
    });
  }, [navigate]);

  const valor = useMemo(
    () => ({
      passo,
      ativo: passo !== null,
      passos: PASSOS_TOUR,
      total: PASSOS_TOUR.length,
      iniciar,
      fechar,
      proximo,
      anterior,
    }),
    [passo, iniciar, fechar, proximo, anterior],
  );

  return <TourContext.Provider value={valor}>{children}</TourContext.Provider>;
}
