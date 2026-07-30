import { useCallback, useEffect, useMemo, useState } from 'react';
import { DecisoesContext } from './contextos.js';
import { useRegistrarDecisao, useRegistrarFeedback } from '../hooks/useAnalise.js';

/**
 * RF-2.6 → RF-1.8 — registro de decisão e diário.
 *
 * O snapshot (confiança e risco no momento da decisão) é gravado junto: é ele
 * que combate o viés retrospectivo ("eu sabia") citado na §5 do documento.
 * A escrita é otimista — aparece na hora — e a mutation só persiste no back.
 */

const CHAVE_DECISOES = 'investia:decisoes';
const CHAVE_FEEDBACK = 'investia:feedback';

function carregar(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave) || '{}') || {};
  } catch {
    return {};
  }
}

function salvar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* sem persistência em modo privado */
  }
}

export function DecisoesProvider({ children }) {
  const [decisoes, setDecisoes] = useState(() => carregar(CHAVE_DECISOES));
  const [feedback, setFeedback] = useState(() => carregar(CHAVE_FEEDBACK));
  const mutationDecisao = useRegistrarDecisao();
  const mutationFeedback = useRegistrarFeedback();

  useEffect(() => salvar(CHAVE_DECISOES, decisoes), [decisoes]);
  useEffect(() => salvar(CHAVE_FEEDBACK, feedback), [feedback]);

  const decidir = useCallback(
    (recomendacao, acao) => {
      const registro = {
        acao,
        ticker: recomendacao.ticker,
        nome: recomendacao.nome,
        snapshot: { confianca: recomendacao.confianca, risco: recomendacao.risco },
        quando: new Date().toISOString(),
      };
      setDecisoes((d) => ({ ...d, [recomendacao.id]: registro }));
      mutationDecisao.mutate({
        recomendacao_id: recomendacao.id,
        acao,
        snapshot: registro.snapshot,
      });
    },
    [mutationDecisao],
  );

  const desfazer = useCallback((id) => {
    setDecisoes((d) => {
      const copia = { ...d };
      delete copia[id];
      return copia;
    });
  }, []);

  const avaliar = useCallback(
    (id, util) => {
      setFeedback((f) => ({ ...f, [id]: util ? 'sim' : 'nao' }));
      mutationFeedback.mutate({ recomendacao_id: id, util });
    },
    [mutationFeedback],
  );

  const valor = useMemo(
    () => ({
      decisoes,
      feedback,
      decidir,
      desfazer,
      avaliar,
      temDecisoes: Object.keys(decisoes).length > 0,
    }),
    [decisoes, feedback, decidir, desfazer, avaliar],
  );

  return <DecisoesContext.Provider value={valor}>{children}</DecisoesContext.Provider>;
}
