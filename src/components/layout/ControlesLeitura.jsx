import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { usePreferencias } from '../../context/contextos.js';
import { useIndicador } from '../../hooks/useIndicador.js';
import { usePresenca } from '../../hooks/usePresenca.js';
import { trocarComTransicao } from '../../lib/movimento.js';
import { TEXTOS } from '../../lib/textos.js';

/**
 * Botão Leitura do cabeçalho: abre um painel suspenso com três blocos (explicações,
 * animações e tamanho do texto) e o link para o como usar. O painel segue o padrão de
 * disclosure: aria-expanded no botão, Esc e clique fora fecham, e o foco volta ao botão
 * quando a tecla Esc fecha o painel.
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
    restaurarZoom,
    zoomNoMaximo,
    zoomNoMinimo,
  } = usePreferencias();
  const [aberto, setAberto] = useState(false);
  const refArea = useRef(null);
  const refBotao = useRef(null);
  const idPainel = useId();
  // o painel fica montado até a saída terminar; cada grupo tem o seu marcador que desliza
  const presente = usePresenca(aberto);
  const indicadorNivel = useIndicador(nivel);
  const indicadorMovimento = useIndicador(movimento);

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

      <div
        className="leitura__painel"
        id={idPainel}
        role="region"
        aria-label={TEXTOS.leitura.rotulo}
        data-estado={aberto ? 'entrando' : 'saindo'}
        inert={aberto ? undefined : ''}
        hidden={!presente}
      >
        <div className="leitura__bloco">
          <p className="leitura__frase">{TEXTOS.leitura.explicacoes}</p>
          <div ref={indicadorNivel.trilhoRef} className="segmentado" role="group" aria-label={TEXTOS.leitura.explicacoes}>
            <span ref={indicadorNivel.indicadorRef} className="segmentado-marcador" aria-hidden="true" />
            <button
              type="button"
              className="botao"
              aria-pressed={nivel === 'simples'}
              data-indicador-alvo={nivel === 'simples' ? 'true' : undefined}
              onClick={() => trocarComTransicao(() => definirNivel('simples'), 'suave')}
            >
              {TEXTOS.leitura.simples}
            </button>
            <button
              type="button"
              className="botao"
              aria-pressed={nivel === 'tecnico'}
              data-indicador-alvo={nivel === 'tecnico' ? 'true' : undefined}
              onClick={() => trocarComTransicao(() => definirNivel('tecnico'), 'suave')}
            >
              {TEXTOS.leitura.tecnica}
            </button>
          </div>
          <p className="leitura__dica">
            {nivel === 'tecnico' ? TEXTOS.leitura.dicaTecnica : TEXTOS.leitura.dicaSimples}
          </p>
        </div>

        <div className="leitura__bloco">
          <p className="leitura__frase">{TEXTOS.leitura.animacoes}</p>
          <div ref={indicadorMovimento.trilhoRef} className="segmentado" role="group" aria-label={TEXTOS.leitura.animacoes}>
            <span ref={indicadorMovimento.indicadorRef} className="segmentado-marcador" aria-hidden="true" />
            <button
              type="button"
              className="botao"
              aria-pressed={movimento === 'ligadas'}
              data-indicador-alvo={movimento === 'ligadas' ? 'true' : undefined}
              onClick={() => definirMovimento('ligadas')}
            >
              {TEXTOS.leitura.movLigadas}
            </button>
            <button
              type="button"
              className="botao"
              aria-pressed={movimento === 'desligadas'}
              data-indicador-alvo={movimento === 'desligadas' ? 'true' : undefined}
              onClick={() => definirMovimento('desligadas')}
            >
              {TEXTOS.leitura.movDesligadas}
            </button>
          </div>
        </div>

        <div className="leitura__bloco">
          <p className="leitura__frase">{TEXTOS.leitura.texto}</p>
          <div className="leitura__tamanho" role="group" aria-label={TEXTOS.leitura.texto}>
            <button
              type="button"
              className="botao leitura__ajustar"
              aria-label={TEXTOS.leitura.diminuir}
              disabled={zoomNoMinimo}
              onClick={diminuirZoom}
            >
              {TEXTOS.leitura.menor}
            </button>
            <span className="leitura__percentual" aria-live="polite">
              {TEXTOS.leitura.zoomAtual(pct)}
            </span>
            <button
              type="button"
              className="botao leitura__ajustar"
              aria-label={TEXTOS.leitura.aumentar}
              disabled={zoomNoMaximo}
              onClick={aumentarZoom}
            >
              {TEXTOS.leitura.maior}
            </button>
            {pct !== 100 && (
              <button type="button" className="leitura__voltar" onClick={restaurarZoom}>
                {TEXTOS.leitura.voltarNormal}
              </button>
            )}
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
