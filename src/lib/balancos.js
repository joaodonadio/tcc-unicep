/**
 * Balanços trimestrais para a tabela da ficha: trimestres como colunas, do
 * mais recente para o mais antigo. Valor ausente vira "—" com o motivo.
 */

import { dataBR, rotuloTrimestre } from './datas.js';
import { brlCompacto, numero, pct } from './formato.js';
import { exibir, valorOuNulo } from './valor.js';

const fracao = (v) => pct(v, { casas: 1, sinal: false });
const vezesDuas = (v) => `${numero(v, { casas: 2 })}×`;

/** Linhas da tabela, na ordem de exibição. */
export const LINHAS_BALANCO = [
  { id: 'receita_trimestre', rotulo: 'Receita no trimestre', formatar: brlCompacto },
  { id: 'receita_12m', rotulo: 'Receita em 12 meses', formatar: brlCompacto },
  { id: 'lucro_liquido_trimestre', rotulo: 'Lucro líquido no trimestre', formatar: brlCompacto },
  { id: 'lucro_liquido_12m', rotulo: 'Lucro líquido em 12 meses', formatar: brlCompacto },
  { id: 'margem_bruta', rotulo: 'Margem bruta', formatar: fracao },
  { id: 'margem_liquida', rotulo: 'Margem líquida', formatar: fracao },
  { id: 'roe', rotulo: 'ROE', formatar: fracao },
  { id: 'ebitda_trimestre', rotulo: 'EBITDA no trimestre', formatar: brlCompacto },
  { id: 'ebitda_12m', rotulo: 'EBITDA em 12 meses', formatar: brlCompacto },
  { id: 'margem_ebitda', rotulo: 'Margem EBITDA', formatar: fracao },
  { id: 'divida_liquida', rotulo: 'Dívida líquida', formatar: brlCompacto },
  { id: 'dl_ebitda', rotulo: 'Dívida líquida / EBITDA', formatar: vezesDuas },
  { id: 'dl_pl', rotulo: 'Dívida líquida / patrimônio', formatar: vezesDuas },
  { id: 'payout_12m', rotulo: 'Payout em 12 meses', formatar: fracao },
];

/** { colunas: [{data, rotulo: '2T26', entrega: '06/08/2026'}], linhas: [{id, rotulo, celulas: [{texto, motivo}]}] } */
export function montarBalancos(fundamentos = [], { max = 8 } = {}) {
  const trimestres = [...(fundamentos ?? [])]
    .filter((f) => f?.data_fim_periodo)
    .sort((a, b) => b.data_fim_periodo.localeCompare(a.data_fim_periodo))
    .slice(0, max);
  return {
    colunas: trimestres.map((f) => ({
      data: f.data_fim_periodo,
      rotulo: rotuloTrimestre(f.data_fim_periodo),
      entrega: dataBR(f.data_entrega),
    })),
    linhas: LINHAS_BALANCO.map((l) => ({
      id: l.id,
      rotulo: l.rotulo,
      celulas: trimestres.map((f) => exibir(f[l.id], l.formatar)),
    })),
  };
}

/**
 * Séries dos gráficos de balanço: trimestres em ordem crescente de data.
 * Valor ausente vira null (nunca 0) e continua na mesma posição do trimestre.
 */
export function seriesDoBalanco(lista = []) {
  const ordenada = (lista ?? [])
    .filter((f) => f?.data_fim_periodo)
    .sort((a, b) => a.data_fim_periodo.localeCompare(b.data_fim_periodo));
  return {
    datas: ordenada.map((f) => f.data_fim_periodo),
    receita12m: ordenada.map((f) => valorOuNulo(f.receita_12m)),
    lucro12m: ordenada.map((f) => valorOuNulo(f.lucro_liquido_12m)),
    dlEbitda: ordenada.map((f) => valorOuNulo(f.dl_ebitda)),
  };
}
