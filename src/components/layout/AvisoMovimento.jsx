import { useState } from 'react';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS } from '../../lib/textos.js';

/**
 * Aviso discreto, não modal, para quem tem as animações desligadas no sistema
 * operacional. Com a preferência em "Seguir o sistema", o site fica parado sem que a
 * pessoa saiba que pode ligar as animações aqui. O aviso aparece até a pessoa
 * responder; a resposta fica guardada e ele não volta. Não rouba o foco.
 */
const CHAVE_AVISO = 'painel-b3:aviso-movimento';

function jaRespondeu() {
  try {
    return localStorage.getItem(CHAVE_AVISO) === '1';
  } catch {
    return false;
  }
}

function registrarResposta() {
  try {
    localStorage.setItem(CHAVE_AVISO, '1');
  } catch {
    /* modo privado do navegador: o aviso pode voltar na próxima visita */
  }
}

export default function AvisoMovimento() {
  const { movimento, movimentoReduzido, definirMovimento } = usePreferencias();
  const [respondido, setRespondido] = useState(jaRespondeu);

  // com "Seguir o sistema", movimentoReduzido é a preferência do sistema operacional
  if (respondido || movimento !== 'sistema' || !movimentoReduzido) return null;

  const responder = (escolha) => {
    definirMovimento(escolha);
    registrarResposta();
    setRespondido(true);
  };

  return (
    <div className="aviso-movimento" role="region" aria-label={TEXTOS.leitura.avisoTitulo}>
      <p className="aviso-movimento__titulo">{TEXTOS.leitura.avisoTitulo}</p>
      <p className="aviso-movimento__frase">{TEXTOS.leitura.avisoFrase}</p>
      <div className="aviso-movimento__acoes">
        <button
          type="button"
          className="botao aviso-movimento__principal"
          onClick={() => responder('ligadas')}
        >
          {TEXTOS.leitura.avisoLigar}
        </button>
        <button type="button" className="botao" onClick={() => responder('desligadas')}>
          {TEXTOS.leitura.avisoManter}
        </button>
      </div>
    </div>
  );
}
