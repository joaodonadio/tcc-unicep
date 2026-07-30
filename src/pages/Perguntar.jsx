import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { OrbeIA } from '../components/canvas/OrbeIA.jsx';
import { useChat } from '../hooks/useChat.js';
import { SUGESTOES } from '../mocks/respostasFallback.js';

/**
 * TELA PERGUNTAR — RF-4.1 a RF-4.5.
 * Rota `/perguntar`. Especificação completa do agente em AGENTE-CHAT-IA.md;
 * aqui fica só a interface: bolhas, sugestões, indicador "digitando" e envio.
 */
export default function Perguntar() {
  const location = useLocation();
  const contextoUi = {
    tela: 'chat',
    recomendacao_id: location.state?.recomendacaoId ?? null,
  };
  const { mensagens, digitando, enviar } = useChat({ contextoUi });
  const listaRef = useRef(null);
  const perguntaJaEnviada = useRef(false);

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { mensagem: '' },
  });
  const rascunho = watch('mensagem');

  // RF-2.7 — chegada com pergunta pré-formada vinda de um card
  useEffect(() => {
    const pergunta = location.state?.perguntaInicial;
    if (!pergunta || perguntaJaEnviada.current) return;
    perguntaJaEnviada.current = true;
    const timer = setTimeout(() => enviar(pergunta), 250);
    return () => clearTimeout(timer);
    // `enviar` muda a cada mensagem; disparar só na chegada é intencional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.perguntaInicial]);

  // RF-4.2 — auto-scroll
  useEffect(() => {
    const lista = listaRef.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
  }, [mensagens, digitando]);

  const aoEnviar = handleSubmit(({ mensagem }) => {
    enviar(mensagem);
    reset({ mensagem: '' });
  });

  return (
    <main className="screen screen-narrow">
      <div className="fade-up-fast">
        <div className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          <span>PERGUNTAR AO SISTEMA</span>
        </div>
        <div className="chat-title-row">
          <h2 className="h2" style={{ flex: 1 }}>
            Converse com a <span className="hl">inteligência</span>.
          </h2>
          {/* RF-4.1 — orbe como identidade visual da IA */}
          <OrbeIA />
        </div>
        <p className="lead" style={{ maxWidth: '37.5rem', fontSize: '1rem' }}>
          Tire dúvidas sobre as análises de hoje em linguagem simples. O sistema explica cada
          recomendação e os dados por trás dela.
        </p>
      </div>

      <div className="chat-panel">
        <div className="chat-list" ref={listaRef} role="log" aria-live="polite" aria-label="Conversa">
          {mensagens.map((mensagem, i) => {
            const minha = mensagem.papel === 'usuario';
            return (
              <div className={`msg-row is-${minha ? 'mine' : 'system'}`} key={i}>
                <div className="msg-bubble">
                  <div className="msg-who">{minha ? 'VOCÊ' : 'SISTEMA'}</div>
                  <div className="msg-text">{mensagem.texto}</div>
                  {/* RA-9 — o modo degradado é declarado, nunca disfarçado */}
                  {mensagem.modo === 'fallback' && (
                    <div className="msg-modo">MODO OFFLINE · RESPOSTAS RESUMIDAS</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* RF-4.3 */}
          {digitando && (
            <div className="msg-row is-system">
              <div className="typing" role="status" aria-label="O sistema está escrevendo">
                <i />
                <i />
                <i />
              </div>
            </div>
          )}
        </div>

        <div className="chat-composer">
          {/* RF-4.4 */}
          <div className="chat-suggestions">
            {SUGESTOES.map((sugestao) => (
              <button
                key={sugestao}
                type="button"
                className="chat-suggestion"
                disabled={digitando}
                onClick={() => enviar(sugestao)}
              >
                {sugestao}
              </button>
            ))}
          </div>

          {/* RF-4.5 */}
          <form className="chat-form" onSubmit={aoEnviar}>
            <label className="sr-only" htmlFor="campo-pergunta">
              Escreva sua pergunta
            </label>
            <input
              id="campo-pergunta"
              className="chat-input"
              placeholder="Ex.: Por que PETR4 é uma oportunidade?"
              autoComplete="off"
              maxLength={500}
              {...register('mensagem')}
            />
            <button
              type="submit"
              className="chat-send"
              disabled={digitando || !rascunho?.trim()}
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
