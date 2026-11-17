import { TEXTOS } from '../../lib/textos.js';
import Mascote from './Mascote.jsx';

/**
 * Logo CotAI: o Cotinha antes do nome, com "AI" na cor do mascote e o brilho de quatro pontas
 * (o mesmo de quando ele segura a moeda). O nome é texto de verdade, lido como uma palavra só.
 */
export default function Logo({ className = '' }) {
  const { inicio, destaque } = TEXTOS.marca;
  return (
    <span className={['logo', className].filter(Boolean).join(' ')}>
      <Mascote humor="neutro" acao="ocioso" className="logo__pavio" />
      <span className="logo__nome">
        {inicio}
        <span className="logo__destaque">
          {destaque}
          <svg className="logo__brilho" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
            <path d="M14 0 Q15.8 12.2 28 14 Q15.8 15.8 14 28 Q12.2 15.8 0 14 Q12.2 12.2 14 0 Z" />
          </svg>
        </span>
      </span>
    </span>
  );
}
