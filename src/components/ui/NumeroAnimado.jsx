import { movimentoReduzido } from '../../lib/movimento.js';
import Contador from './Contador.jsx';

function semMovimento() {
  try {
    return (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      movimentoReduzido()
    );
  } catch {
    return true;
  }
}

// o Contador põe fonte, peso e cor em linha; zerar aqui deixa o className e o pai decidirem
const SEM_ESTILO_PROPRIO = { fontSize: undefined, fontWeight: undefined, color: undefined, fontVariantNumeric: undefined };

/**
 * Número que rola dígito a dígito (Contador, do React Bits). `formatar` transforma o número em texto.
 * Valor nulo mostra `ausente` (nunca vira 0). Sem movimento (preferência, sem matchMedia nos testes),
 * mostra o texto final direto.
 */
export default function NumeroAnimado({ valor, formatar, ausente, className }) {
  const ausenteValor = valor === null || valor === undefined || Number.isNaN(valor);

  if (ausenteValor) return <span className={className}>{ausente}</span>;
  if (semMovimento()) return <span className={className}>{formatar(valor)}</span>;
  return <Contador value={valor} decimals={0} className={className} style={SEM_ESTILO_PROPRIO} />;
}
