import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { PreferenciasContext } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/**
 * Selo "Calculado no site": marca o número que o próprio site calcula com os dados da API.
 * Mostra como é feita a conta (segue o nível de leitura) e leva à seção da página Dados.
 * `curto` esconde a explicação, para lugares apertados.
 */
export function SeloCalculo({ conta, curto = false }) {
  const nivel = useContext(PreferenciasContext)?.nivel ?? 'simples';
  const item = TEXTOS.contas.itens[conta];
  if (!item) return null;
  return (
    <p className="selo-calculo">
      <span className="selo-calculo-rotulo">
        <svg className="selo-calculo-icone" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <rect x="1.5" y="1" width="9" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="4" cy="4" r="0.7" fill="currentColor" />
          <circle cx="8" cy="4" r="0.7" fill="currentColor" />
          <circle cx="4" cy="7.5" r="0.7" fill="currentColor" />
          <circle cx="8" cy="7.5" r="0.7" fill="currentColor" />
        </svg>{' '}
        {item.selo ?? TEXTOS.contas.selo}
      </span>
      {!curto && <span className="selo-calculo-texto">{porNivel(item.como, nivel)}</span>}
      <Link to={`/dados#conta-${conta}`} className="selo-calculo-link">
        {TEXTOS.contas.comoFeito}
      </Link>
    </p>
  );
}
