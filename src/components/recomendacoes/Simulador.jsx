import { useId, useState } from 'react';
import { brl, brlInteiro, paraNumero } from '../../lib/formato.js';

/**
 * RF-2.5 — "SIMULE ANTES DE DECIDIR".
 *
 * Concretiza a abstração: transforma a variação em % num valor em reais que o
 * usuário reconhece (M5, M12). O aviso de rentabilidade passada é parte do
 * componente, nunca opcional.
 */
export function Simulador({ variacao30d }) {
  const [valor, setValor] = useState(1000);
  const id = useId();

  const percentual = paraNumero(variacao30d);
  const resultado = valor * (1 + percentual / 100);
  const delta = resultado - valor;
  const positivo = delta >= 0;

  return (
    <div className="sim-box">
      <div className="sim-row">
        <label htmlFor={id}>Se você tivesse investido</label>
        <span className="sim-valor">{brlInteiro(valor)}</span>
      </div>
      <input
        id={id}
        className="sim-range"
        type="range"
        min="100"
        max="10000"
        step="100"
        value={valor}
        onChange={(e) => setValor(Number(e.target.value))}
        aria-valuetext={`${brlInteiro(valor)}, resultado simulado de ${brl(resultado)}`}
      />
      <div className="sim-row" style={{ marginTop: '0.75rem' }}>
        <span>há 30 dias, teria hoje</span>
        <span className="sim-result">{brl(resultado)}</span>
      </div>
      <div className="sim-delta-row">
        <span
          className="sim-delta"
          style={{ color: positivo ? 'var(--success)' : 'var(--danger)' }}
        >
          {positivo ? '↗ +' : '↘ −'}
          {brl(delta)}
        </span>
      </div>
      <p className="sim-aviso">
        Simulação didática baseada na variação de 30 dias ({String(variacao30d).replace('.', ',')}%).
        Rentabilidade passada não garante resultados futuros.
      </p>
    </div>
  );
}
