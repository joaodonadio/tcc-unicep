/**
 * Agrupamento das ações com sugestão por setor, para o "Mapa do pregão".
 *
 * Valores de variação chegam como fração (0.0125 = 1,25%) ou null. Ausência
 * nunca vira 0: null fica por último na ordenação e não entra na média.
 */

export const SEM_SETOR = 'Sem setor informado';

/** Abaixo deste módulo (fração) a variação é tratada como estável. */
const LIMITE_ESTAVEL = 0.0005;

const comoNumero = (v) => (Number.isFinite(v) ? v : null);

export function direcaoDe(v) {
  if (v == null || !Number.isFinite(v)) return null;
  if (Math.abs(v) < LIMITE_ESTAVEL) return 'flat';
  return v > 0 ? 'up' : 'down';
}

/** Variação decrescente, null por último, ticker crescente no empate. */
function compararAcoes(a, b) {
  const va = comoNumero(a.variacao_dia);
  const vb = comoNumero(b.variacao_dia);
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

/** Agrupa as ações (já filtradas) por setor; cabeçalho com dados do setor no dia quando houver. */
export function agruparPorSetor(acoes = [], setoresDoDia = []) {
  const porSetor = new Map();
  for (const acao of acoes) {
    const nome = acao.setor_nome ?? acao.setor ?? SEM_SETOR;
    if (!porSetor.has(nome)) porSetor.set(nome, []);
    porSetor.get(nome).push(acao);
  }

  const grupos = [...porSetor].map(([setor, membros]) => {
    const acoesOrdenadas = [...membros].sort(compararAcoes);
    const doDia = setoresDoDia.find((s) => s.setor === setor);

    if (doDia) {
      const variacao = comoNumero(doDia.variacao);
      return {
        setor,
        variacao_media: variacao == null ? null : variacao / 100,
        subiram: doDia.subiram,
        cairam: doDia['caíram'],
        acoes: acoesOrdenadas,
      };
    }

    const variacoes = membros.map((m) => comoNumero(m.variacao_dia)).filter((v) => v != null);
    const media = variacoes.length
      ? variacoes.reduce((soma, v) => soma + v, 0) / variacoes.length
      : null;
    return {
      setor,
      variacao_media: media,
      subiram: membros.filter((m) => direcaoDe(comoNumero(m.variacao_dia)) === 'up').length,
      cairam: membros.filter((m) => direcaoDe(comoNumero(m.variacao_dia)) === 'down').length,
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
