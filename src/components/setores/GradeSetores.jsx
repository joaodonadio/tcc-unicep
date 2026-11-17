import { useEffect, useState } from 'react';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { distribuirFileiras } from '../../lib/setores.js';
import { CartaoDestaque, CartaoSetor } from './CartaoSetor.jsx';

const CELULAR = '(max-width: 640px)';
const TABLET_PEQUENO = '(max-width: 900px)';
const TABLET = '(max-width: 1180px)';

/** Faixa da tela: celular até 640px, tablet pequeno até 900px, tablet até 1180px, o resto é computador. */
function faixaAtual() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'computador';
  if (window.matchMedia(CELULAR).matches) return 'celular';
  if (window.matchMedia(TABLET_PEQUENO).matches) return 'tabletPequeno';
  if (window.matchMedia(TABLET).matches) return 'tablet';
  return 'computador';
}

function useFaixaDaTela() {
  const [faixa, setFaixa] = useState(faixaAtual);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const consultas = [CELULAR, TABLET_PEQUENO, TABLET].map((q) => window.matchMedia(q));
    const atualizar = () => setFaixa(faixaAtual());
    consultas.forEach((c) => c.addEventListener('change', atualizar));
    return () => consultas.forEach((c) => c.removeEventListener('change', atualizar));
  }, []);
  return faixa;
}

/** Cartões por fileira em cada faixa. */
const MAXIMO_POR_FAIXA = { computador: 4, tablet: 3, tabletPequeno: 2, celular: 1 };

/**
 * Canto e frase técnica do destaque pela posição e pelo sinal real, sempre juntos: num dia só de alta,
 * o último destaque é "Subiu menos" com "Menor alta média", nunca "Maior alta".
 */
function rotulosDoDestaque(s, i) {
  const T = TEXTOS.setores;
  const subiu = s.media >= 0;
  if (i === 0) return subiu ? [T.subiuMais, T.maiorAltaMedia] : [T.caiuMenos, T.menorQuedaMedia];
  return subiu ? [T.subiuMenos, T.menorAltaMedia] : [T.caiuMais, T.maiorQuedaMedia];
}

/**
 * Mosaico da seção: os dois destaques (o que mais subiu e o que mais caiu) numa fileira e os demais
 * setores em fileiras completas, sem buraco. Na ordem recebida (do que mais subiu ao que mais caiu).
 */
export function GradeSetores({ setores, tecnico, tomPorSetor = [] }) {
  const tomDe = new Map(tomPorSetor.map((t) => [t.setor, t]));
  const faixa = useFaixaDaTela();
  const nivel = tecnico ? 'tecnico' : 'simples';

  // Destaque: primeiro e último com média. Se só houver um com média, ele ocupa a fileira inteira.
  const comMedia = setores.filter((s) => s.media != null);
  const destaques = comMedia.length > 1 ? [comMedia[0], comMedia.at(-1)] : comMedia;
  const demais = setores.filter((s) => !destaques.includes(s));

  const tamanhos = distribuirFileiras(demais.length, MAXIMO_POR_FAIXA[faixa]);
  const fileiras = [];
  let inicio = 0;
  for (const tamanho of tamanhos) {
    fileiras.push(demais.slice(inicio, inicio + tamanho));
    inicio += tamanho;
  }

  return (
    <section className="setores-cartoes" aria-labelledby="setores-cartoes-titulo">
      <h2 id="setores-cartoes-titulo" className="setores-titulo">
        {TEXTOS.setores.cartoesTitulo}
      </h2>
      <p className="setores-como-ler">{porNivel(TEXTOS.setores.cartoesTexto, nivel)}</p>

      <ul className="setores-mosaico" aria-label={TEXTOS.setores.listaTitulo}>
        {destaques.length > 0 && (
          <li>
            <ul className="setores-fileira entra-rolagem" style={{ '--colunas': faixa === 'celular' ? 1 : destaques.length }}>
              {destaques.map((s, i) => {
                const [canto, linhaTecnica] = rotulosDoDestaque(s, i);
                return (
                  <li key={s.setor}>
                    <CartaoDestaque setor={s} canto={canto} linhaTecnica={linhaTecnica} tecnico={tecnico} tom={tomDe.get(s.setor)} />
                  </li>
                );
              })}
            </ul>
          </li>
        )}
        {fileiras.map((fileira, i) => (
          <li key={i}>
            <ul className="setores-fileira entra-rolagem" style={{ '--colunas': fileira.length }}>
              {fileira.map((s) => (
                <li key={s.setor}>
                  <CartaoSetor setor={s} tecnico={tecnico} tom={tomDe.get(s.setor)} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
