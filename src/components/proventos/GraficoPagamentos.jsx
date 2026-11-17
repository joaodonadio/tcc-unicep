import { GraficoInterativo } from '../graficos/GraficoInterativo.jsx';
import { EsqueletoGrafico } from '../ui/Estados.jsx';
import { mesAno } from '../../lib/datas.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/** "2026-11-01" -> "nov/2026" */
const rotuloDoMes = (iso) => mesAno(iso.slice(0, 7));

/**
 * Pagamentos de proventos por mês, em barras. Cada barra é uma contagem de
 * eventos; mês sem pagamento aparece como 0.
 */
export function GraficoPagamentos({ datas, valores, carregando = false, erro = false }) {
  const { nivel } = usePreferencias();
  if (erro) return <p className="proventos-status">{TEXTOS.dia.proventosErro}</p>;
  if (carregando) return <EsqueletoGrafico altura="12rem" rotulo={TEXTOS.dia.proventosCarregando} />;

  const semPagamentos = valores.every((v) => v === 0);

  return (
    <div className="proventos-grafico">
      <GraficoInterativo
        modo="barras"
        altura={192}
        series={[{ id: 'pagamentos', rotulo: TEXTOS.proventos.graficoRotulo, valores, cor: 'var(--cor-serie-1)' }]}
        datas={datas}
        formatar={(v) => String(v)}
        formatarData={rotuloDoMes}
        descricao={TEXTOS.proventos.graficoDescricao}
        rotulosX
      />
      {semPagamentos && <p className="proventos-vazio">{porNivel(TEXTOS.proventos.graficoVazio, nivel)}</p>}
    </div>
  );
}
