import { useId } from 'react';
import { ACOES, HUMORES } from '../../lib/mascote';

/* Olhos desenhados na origem; cada par fica em OLHOS_POS. Cores pelos tokens --cor-mascote-*. */
const OLHOS = {
  neutro: (
    <>
      <rect x="-4" y="-8" width="8" height="16" rx="4" transform="rotate(-8)" fill="var(--cor-mascote-olho)" />
      <circle cx="1.4" cy="-4.6" r="1.5" fill="var(--cor-mascote-brilho)" />
    </>
  ),
  contente: (
    <path d="M-5.5 0.5 Q0 -8.5 5.5 0.5" fill="none" stroke="var(--cor-mascote-olho)" strokeWidth="4" strokeLinecap="round" />
  ),
  atento: (
    <>
      <ellipse rx="5" ry="8.6" fill="var(--cor-mascote-olho)" />
      <circle cx="1.6" cy="-4" r="1.9" fill="var(--cor-mascote-brilho)" />
    </>
  ),
  pensativo: (
    <g transform="translate(-2 -3.5)">
      <rect x="-3.6" y="-7" width="7.2" height="14" rx="3.6" fill="var(--cor-mascote-olho)" />
      <circle cx="0.8" cy="-4.4" r="1.4" fill="var(--cor-mascote-brilho)" />
    </g>
  ),
  dormindo: (
    <path d="M-5 -2 Q0 2.5 5 -2" fill="none" stroke="var(--cor-mascote-olho)" strokeWidth="3.6" strokeLinecap="round" />
  ),
};

const OLHOS_POS = [
  [43, 47],
  [57, 47],
];

/**
 * Mascote Pavio. Decorativo por padrão (aria-hidden); com `rotulo`, vira uma imagem nomeada.
 * Humor e ação são independentes: valor inválido cai no neutro (humor) ou é ignorado (ação).
 */
export default function Mascote({ humor = 'neutro', acao = null, rotulo = null, className = '' }) {
  const h = HUMORES.includes(humor) ? humor : 'neutro';
  // o id do useId tem dois-pontos; tiro para o url(#...) de clip-path ficar simples
  const idClip = `mascote-clip-${useId().replace(/:/g, '')}`;

  const classes = [
    'mascote',
    `mascote--${h}`,
    ACOES.includes(acao) ? `mascote--${acao}` : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const acessivel = rotulo ? { role: 'img', 'aria-label': rotulo } : { 'aria-hidden': 'true', focusable: 'false' };

  return (
    <svg className={classes} viewBox="0 0 100 100" {...acessivel}>
      <defs>
        <clipPath id={idClip}>
          <rect x="29" y="22" width="42" height="56" rx="15" />
        </clipPath>
      </defs>
      <g className="mascote-corpo">
        <line
          className="mascote-pavio-baixo"
          x1="50"
          y1="76"
          x2="50"
          y2="91"
          stroke="var(--cor-mascote-sombra)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <line
          className="mascote-pavio"
          x1="50"
          y1="9"
          x2="50"
          y2="24"
          stroke="var(--cor-mascote)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <rect x="29" y="22" width="42" height="56" rx="15" fill="var(--cor-mascote)" />
        <rect
          x="62"
          y="22"
          width="9"
          height="56"
          fill="var(--cor-mascote-sombra)"
          clipPath={`url(#${idClip})`}
        />
        <path d="M36 31 V39" stroke="var(--cor-mascote-brilho)" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
        <g className="mascote-olhar">
          <g className="mascote-olhos">
            {OLHOS_POS.map(([x, y]) => (
              <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                {OLHOS[h]}
              </g>
            ))}
          </g>
        </g>
      </g>
      <g className="mascote-ideia" fill="var(--cor-mascote)">
        <circle cx="74" cy="20" r="2" />
        <circle cx="80" cy="13" r="2.6" />
        <circle cx="87.5" cy="5.5" r="3.2" />
      </g>
      <path
        className="mascote-zz"
        d="M73 18 h6 l-6 7 h6"
        fill="none"
        stroke="var(--cor-mascote)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
