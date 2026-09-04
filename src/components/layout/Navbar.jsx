import { NavLink } from 'react-router-dom';
import { usePreferencias } from '../../context/contextos.js';
import { useAnaliseDoDia } from '../../hooks/useAnalise.js';
import { ESTADO_MERCADO_ROTULO } from '../../lib/formato.js';

/**
 * RF-0.1 — navbar flutuante fixa com logo pulsante e 4 itens.
 * RF-0.2 — badge de status vivo conforme o estado do sistema.
 * RF-0.3 — badge "MODO CALMO" quando ativo.
 */

const ITENS = [
  { para: '/', rotulo: 'Análise de hoje', fim: true },
  { para: '/recomendacoes', rotulo: 'Recomendações' },
  { para: '/mercado', rotulo: 'Mercado' },
];

export function Navbar() {
  const { calmo } = usePreferencias();
  const { data, isPending, isError } = useAnaliseDoDia();

  const estado = isPending || isError ? 'analisando' : data?.estado_mercado || 'estavel';
  const rotulo = ESTADO_MERCADO_ROTULO[estado] ?? ESTADO_MERCADO_ROTULO.estavel;
  const classeEstado =
    estado === 'volatil' ? 'is-volatil' : estado === 'analisando' ? 'is-analisando' : '';

  return (
    <nav className="nav" aria-label="Navegação principal">
      <NavLink to="/" className="nav-brand">
        <span className="nav-brand-dot" aria-hidden="true" />
        <span className="nav-brand-name">
          <strong>
            Invest<span style={{ color: 'var(--accent)' }}>IA</span>
          </strong>
          <span>ANÁLISE INTELIGENTE</span>
        </span>
      </NavLink>

      {ITENS.map((item) => (
        <NavLink
          key={item.para}
          to={item.para}
          end={item.fim}
          className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
        >
          {item.rotulo}
        </NavLink>
      ))}

      <div className={`nav-status ${classeEstado}`} role="status" aria-live="polite">
        <span className="nav-status-dot" aria-hidden="true" />
        <span className="nav-status-text">{rotulo}</span>
      </div>

      {calmo && (
        <div className="nav-calmo">
          <span aria-hidden="true">🌙</span>
          <span>MODO CALMO</span>
        </div>
      )}
    </nav>
  );
}
