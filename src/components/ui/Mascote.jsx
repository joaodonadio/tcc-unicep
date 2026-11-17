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
  animado: (
    <path d="M-5.5 1 Q0 -10.5 5.5 1" fill="none" stroke="var(--cor-mascote-olho)" strokeWidth="3.6" strokeLinecap="round" />
  ),
  preocupado: (
    <>
      <ellipse cy="1" rx="3.8" ry="6.2" fill="var(--cor-mascote-olho)" />
      <circle cx="1.2" cy="-2" r="1.3" fill="var(--cor-mascote-brilho)" />
    </>
  ),
  surpreso: (
    <>
      <ellipse rx="5.2" ry="7.6" fill="var(--cor-mascote-olho)" />
      <circle cx="1.8" cy="-3.6" r="1.7" fill="var(--cor-mascote-brilho)" />
    </>
  ),
  curioso: (
    <>
      <rect x="-4" y="-8" width="8" height="16" rx="4" fill="var(--cor-mascote-olho)" />
      <circle cx="1.4" cy="-4.6" r="1.5" fill="var(--cor-mascote-brilho)" />
    </>
  ),
};

/* Boca e sobrancelhas, em coordenadas do corpo: dão a diferença entre humores de olhar parecido */
const TRACO = { fill: 'none', stroke: 'var(--cor-mascote-olho)', strokeWidth: 2.6, strokeLinecap: 'round' };
const BOCAS = {
  surpreso: <ellipse cx="50" cy="63" rx="2.6" ry="3.2" fill="var(--cor-mascote-olho)" />,
  // sorriso aberto: separa o animado do contente
  animado: <path d="M44 59 Q50 69 56 59 Z" fill="var(--cor-mascote-olho)" strokeLinejoin="round" />,
  // sobrancelhas erguidas no meio e boca ondulada
  preocupado: (
    <>
      <path d="M37 38 L45.5 34.5" {...TRACO} />
      <path d="M54.5 34.5 L63 38" {...TRACO} />
      <path d="M45 63.5 Q47.5 61 50 63.5 Q52.5 66 55 63.5" {...TRACO} />
    </>
  ),
  // uma sobrancelha erguida sobre o olho maior
  curioso: <path d="M37 33.5 Q42 30 48 33" {...TRACO} />,
};

const OLHOS_POS = [
  [43, 47],
  [57, 47],
];

/**
 * Mascote Cotinha. Decorativo por padrão (aria-hidden); com `rotulo`, vira uma imagem nomeada.
 * Humor e ação são independentes: valor inválido cai no neutro (humor) ou é ignorado (ação).
 */
export default function Mascote({ humor = 'neutro', acao = null, rotulo = null, className = '' }) {
  const h = HUMORES.includes(humor) ? humor : 'neutro';
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
      <g className="mascote-corpo">
        <line
          className="mascote-pavio-baixo"
          x1="50"
          y1="76"
          x2="50"
          y2="91"
          stroke="var(--cor-mascote)"
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
        <path d="M36 31 V39" stroke="var(--cor-mascote-brilho)" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
        <g className="mascote-olhar">
          <g className="mascote-olhos">
            {OLHOS_POS.map(([x, y], i) => (
              // curioso: o primeiro olho fica levemente maior
              <g key={`${x}-${y}`} transform={`translate(${x} ${y})${h === 'curioso' && i === 0 ? ' scale(1.18)' : ''}`}>
                {OLHOS[h]}
              </g>
            ))}
          </g>
          {BOCAS[h]}
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
      {acao === 'moeda' && (
        <>
          {/* Moeda ao lado do corpo: a animação a sobe e a leva para fora do quadro */}
          <g transform="translate(85 60)">
            <g className="mascote-moeda">
              <circle r="12" fill="var(--cor-atencao)" />
              <circle r="7.5" fill="none" stroke="var(--cor-mascote-olho)" strokeOpacity="0.3" strokeWidth="1.6" />
            </g>
          </g>
          {/* Brilhinho de 4 pontas, acima da moeda */}
          <path
            className="mascote-brilho"
            d="M85 22 Q86.8 34.2 99 36 Q86.8 37.8 85 50 Q83.2 37.8 71 36 Q83.2 34.2 85 22 Z"
            fill="var(--cor-mascote-brilho)"
          />
        </>
      )}
    </svg>
  );
}
