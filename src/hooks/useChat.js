import { useCallback, useState } from 'react';
import { perguntarAoSistema } from '../services/api.js';
import { MENSAGEM_INICIAL } from '../mocks/respostasFallback.js';
import { usePreferencias } from '../context/contextos.js';

/**
 * Estado do chat — AGENTE-CHAT-IA.md §8.
 *
 * O serviço é *stateless*: o histórico vive aqui, no cliente, e é reenviado a
 * cada chamada numa janela deslizante das últimas 10 trocas. Assim o usuário
 * pode limpar a conversa apagando estado local, e o back escala sem sessão.
 */

const JANELA_HISTORICO = 20; // 10 trocas (pergunta + resposta)

export function useChat({ contextoUi = null } = {}) {
  const { nivel } = usePreferencias();
  const [mensagens, setMensagens] = useState([MENSAGEM_INICIAL]);
  const [digitando, setDigitando] = useState(false);

  const enviar = useCallback(
    async (texto) => {
      const pergunta = String(texto ?? '').trim();
      if (!pergunta || digitando) return;

      const historico = mensagens.slice(-JANELA_HISTORICO);
      setMensagens((atuais) => [...atuais, { papel: 'usuario', texto: pergunta }]);
      setDigitando(true);

      try {
        const resposta = await perguntarAoSistema({
          mensagem: pergunta,
          nivel,
          historico,
          contextoUi,
        });
        setMensagens((atuais) => [
          ...atuais,
          {
            papel: 'sistema',
            texto: resposta.resposta,
            modo: resposta.modo,
            fontes: resposta.fontes,
          },
        ]);
      } catch {
        setMensagens((atuais) => [
          ...atuais,
          {
            papel: 'sistema',
            texto:
              'Não consegui responder agora. Tente novamente em instantes — as análises de hoje continuam disponíveis nas outras telas.',
            modo: 'erro',
          },
        ]);
      } finally {
        setDigitando(false);
      }
    },
    [mensagens, digitando, nivel, contextoUi],
  );

  const limpar = useCallback(() => setMensagens([MENSAGEM_INICIAL]), []);

  return { mensagens, digitando, enviar, limpar };
}
