import { useContext } from 'react';
import { PreferenciasContext } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/**
 * Selo "mudou de escala": marca a variação que a interface descartou (grupamento ou desdobramento
 * não ajustado na origem). Chip de atenção com losango e palavra; a explicação vai para leitores
 * de tela e segue o nível de leitura (sem provedor, cai no simples).
 */
export function SeloRevisao({ compacto = false }) {
  const nivel = useContext(PreferenciasContext)?.nivel ?? 'simples';
  const explicacao = porNivel(TEXTOS.revisao.explicacao, nivel);
  return (
    <span className={`chip chip--atencao selo-revisao${compacto ? ' selo-revisao--compacto' : ''}`}>
      {TEXTOS.revisao.rotulo}
      <span className="sr-only">. {explicacao}</span>
    </span>
  );
}
