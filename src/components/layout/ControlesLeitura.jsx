import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS } from '../../lib/textos.js';

/**
 * Botão Leitura do cabeçalho: abre um painel suspenso com o modo de explicação
 * (RF-5.1), o tamanho do texto (RF-5.3) e o link para o como usar. O painel segue o
 * padrão de disclosure: aria-expanded no botão, Esc e clique fora fecham, e o foco
 * volta ao botão quando a tecla Esc fecha o painel.
 */
export default function ControlesLeitura() {
  const {
    nivel,
    zoom,
    movimento,
    definirNivel,
    definirMovimento,
    aumentarZoom,
    diminuirZoom,
    zoomNoMaximo,
    zoomNoMinimo,
  } = usePreferencias();
  const [aberto, setAberto] = useState(false);
  const refArea = useRef(null);
  const refBotao = useRef(null);
  const idPainel = useId();

  const pct = Math.round(zoom * 100);

  // o painel fecha com Esc (devolvendo o foco ao botão) e ao tocar fora dele
  useEffect(() => {
    if (!aberto) return undefined;
    const aoTeclar = (e) => {
      if (e.key !== 'Escape') return;
      setAberto(false);
      refBotao.current?.focus();
    };
    const aoTocar = (e) => {
      if (refArea.current && !refArea.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('pointerdown', aoTocar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('pointerdown', aoTocar);
    };
  }, [aberto]);

  return (
    <div className="leitura" ref={refArea}>
      <button
        ref={refBotao}
        type="button"
        className="leitura__gatilho"
        aria-expanded={aberto}
        aria-controls={idPainel}
        onClick={() => setAberto((v) => !v)}
      >
        <SlidersHorizontal size={16} aria-hidden="true" focusable="false" />
        {TEXTOS.leitura.botao}
      </button>

      <div className="leitura__painel" id={idPainel} role="region" aria-label={TEXTOS.leitura.rotulo} hidden={!aberto}>
        <div className="leitura__bloco">
          <p className="leitura__frase">{TEXTOS.leitura.fraseModo}</p>
          <div className="segmentado" role="group" aria-label={TEXTOS.leitura.explicacoes}>
            <button
              type="button"
              className="botao"
              aria-pressed={nivel === 'simples'}
              onClick={() => definirNivel('simples')}
            >
              {TEXTOS.leitura.simples}
            </button>
            <button
              type="button"
              className="botao"
              aria-pressed={nivel === 'tecnico'}
              onClick={() => definirNivel('tecnico')}
            >
              {TEXTOS.leitura.tecnica}
            </button>
          </div>
          <ul className="leitura__modos">
            <li>
              <strong>{TEXTOS.leitura.simples}</strong> <span>{TEXTOS.leitura.dicaSimples}</span>
            </li>
            <li>
              <strong>{TEXTOS.leitura.tecnica}</strong> <span>{TEXTOS.leitura.dicaTecnica}</span>
            </li>
          </ul>
        </div>

        <div className="leitura__bloco">
          <p className="leitura__frase">{TEXTOS.leitura.animacoes}</p>
          <div className="segmentado" role="group" aria-label={TEXTOS.leitura.animacoes}>
            <button
              type="button"
              className="botao"
              aria-pressed={movimento === 'sistema'}
              onClick={() => definirMovimento('sistema')}
            >
              {TEXTOS.leitura.movSistema}
            </button>
            <button
              type="button"
              className="botao"
              aria-pressed={movimento === 'ligadas'}
              onClick={() => definirMovimento('ligadas')}
            >
              {TEXTOS.leitura.movLigadas}
            </button>
            <button
              type="button"
              className="botao"
              aria-pressed={movimento === 'desligadas'}
              onClick={() => definirMovimento('desligadas')}
            >
              {TEXTOS.leitura.movDesligadas}
            </button>
          </div>
          <p className="leitura__modos">{TEXTOS.leitura.fraseAnimacoes}</p>
        </div>

        <div className="leitura__bloco">
          <p className="leitura__frase">{TEXTOS.leitura.fraseTamanho}</p>
          <div className="leitura__tamanho">
            <div className="segmentado" role="group" aria-label={TEXTOS.leitura.texto}>
              <button
                type="button"
                className="botao botao--icone"
                aria-label={TEXTOS.leitura.diminuir}
                disabled={zoomNoMinimo}
                onClick={diminuirZoom}
              >
                {TEXTOS.leitura.menor}
              </button>
              <button
                type="button"
                className="botao botao--icone"
                aria-label={TEXTOS.leitura.aumentar}
                disabled={zoomNoMaximo}
                onClick={aumentarZoom}
              >
                {TEXTOS.leitura.maior}
              </button>
            </div>
            <span className="leitura__percentual" aria-live="polite">
              {TEXTOS.leitura.zoomAtual(pct)}
            </span>
          </div>
        </div>

        <Link
          className="leitura__ajuda"
          to={{ pathname: '/', hash: '#como-usar' }}
          onClick={() => setAberto(false)}
        >
          {TEXTOS.cabecalho.comoUsar}
        </Link>
      </div>
    </div>
  );
}
