/**
 * Agrupamento das ações com sugestão por setor, para o "Mapa do pregão".
 *
 * Valores de variação chegam como fração (0.0125 = 1,25%) ou null. Ausência
 * nunca vira 0: null fica por último na ordenação e não entra na média.
 */

import { variacaoDiaConfiavel, variacaoDiaSuspeita } from './crivel.js';

export const SEM_SETOR = 'Sem setor informado';

/** Abaixo deste módulo (fração) a variação é tratada como estável. */
const LIMITE_ESTAVEL = 0.0005;

const comoNumero = (v) => (Number.isFinite(v) ? v : null);

/** Variação do dia de uma ação como número crível; suspeita (grupamento não ajustado) vira null, fora das contas. */
const variacaoDe = (a) => variacaoDiaConfiavel(comoNumero(a?.variacao_dia));

export function direcaoDe(v) {
  if (v == null || !Number.isFinite(v)) return null;
  if (Math.abs(v) < LIMITE_ESTAVEL) return 'flat';
  return v > 0 ? 'up' : 'down';
}

/** Variação decrescente, null por último, ticker crescente no empate. */
function compararAcoes(a, b) {
  const va = variacaoDe(a);
  const vb = variacaoDe(b);
  if (va == null && vb != null) return 1;
  if (va != null && vb == null) return -1;
  if (va != null && vb != null && va !== vb) return vb - va;
  return String(a.ticker ?? '').localeCompare(String(b.ticker ?? ''), 'pt-BR');
}

/** SEM_SETOR no fim; depois variação média decrescente, null por último; nome no empate. */
function compararGrupos(a, b) {
  if (a.setor === SEM_SETOR && b.setor !== SEM_SETOR) return 1;
  if (b.setor === SEM_SETOR && a.setor !== SEM_SETOR) return -1;
  const ma = a.variacao_media;
  const mb = b.variacao_media;
  if (ma == null && mb != null) return 1;
  if (ma != null && mb == null) return -1;
  if (ma != null && mb != null && ma !== mb) return mb - ma;
  return a.setor.localeCompare(b.setor, 'pt-BR');
}

/** Agrupa as ações (já filtradas) por setor; o cabeçalho traz a média e a contagem do grupo. */
export function agruparPorSetor(acoes = []) {
  const porSetor = new Map();
  for (const acao of acoes) {
    const nome = acao.setor_nome ?? acao.setor ?? SEM_SETOR;
    if (!porSetor.has(nome)) porSetor.set(nome, []);
    porSetor.get(nome).push(acao);
  }

  const grupos = [...porSetor].map(([setor, membros]) => {
    const acoesOrdenadas = [...membros].sort(compararAcoes);

    // "x de total subiram": total só conta ações com variação crível; as suspeitas ficam de fora.
    const variacoes = membros.map(variacaoDe).filter((v) => v != null);
    const media = variacoes.length
      ? variacoes.reduce((soma, v) => soma + v, 0) / variacoes.length
      : null;
    return {
      setor,
      variacao_media: media,
      total: variacoes.length,
      subiram: variacoes.filter((v) => direcaoDe(v) === 'up').length,
      cairam: variacoes.filter((v) => direcaoDe(v) === 'down').length,
      emRevisao: membros.filter((m) => variacaoDiaSuspeita(Number.isFinite(m.variacao_dia) ? m.variacao_dia : null)).length,
      acoes: acoesOrdenadas,
    };
  });

  return grupos.sort(compararGrupos);
}

/** Intensidade (0 a 1) da cor do chip: |variação| ÷ teto, limitada a 1. Sem número: 0. */
export function intensidadeDe(v, teto = 0.04) {
  if (v == null || !Number.isFinite(v) || teto <= 0) return 0;
  return Math.min(1, Math.abs(v) / teto);
}

/** Mistura mínima e máxima com a superfície (em %). A partir do teto, o tom não cresce mais. */
const TOM_MINIMO = 8;
const TOM_MAXIMO = 45;

/**
 * Porcentagem da cor do tom: 8 para variação zero, 45 a partir de 4% (em módulo).
 * Sem número, null. Usada pelo mapa de calor do pregão.
 */
export function percentualDoTom(variacao) {
  if (variacao == null || !Number.isFinite(variacao)) return null;
  return TOM_MINIMO + (TOM_MAXIMO - TOM_MINIMO) * intensidadeDe(variacao);
}
