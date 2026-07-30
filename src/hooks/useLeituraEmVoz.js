import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * RF-1.7 — "Ouvir o resumo" via Web Speech API (`SpeechSynthesis`).
 *
 * pt-BR, rate 0.95 (como no protótipo). `disponivel` é false quando o
 * navegador não expõe a API — nesse caso o botão simplesmente não é
 * renderizado, em vez de aparecer quebrado (fallback silencioso, §4.4).
 */
export function useLeituraEmVoz(texto) {
  const [falando, setFalando] = useState(false);
  const [disponivel] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
  );
  const enunciadoRef = useRef(null);

  const parar = useCallback(() => {
    if (!disponivel) return;
    window.speechSynthesis.cancel();
    setFalando(false);
  }, [disponivel]);

  const alternar = useCallback(() => {
    if (!disponivel || !texto) return;
    if (falando) {
      parar();
      return;
    }
    const enunciado = new SpeechSynthesisUtterance(texto);
    enunciado.lang = 'pt-BR';
    enunciado.rate = 0.95;
    enunciado.onend = () => setFalando(false);
    enunciado.onerror = () => setFalando(false);
    enunciadoRef.current = enunciado;
    window.speechSynthesis.speak(enunciado);
    setFalando(true);
  }, [disponivel, texto, falando, parar]);

  // sair da tela não deixa a voz falando sozinha
  useEffect(() => () => {
    if (disponivel) window.speechSynthesis.cancel();
  }, [disponivel]);

  return { falando, disponivel, alternar, parar };
}
