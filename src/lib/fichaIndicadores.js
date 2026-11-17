/**
 * Indicadores das perguntas da ficha: valor, mediana do setor, barrinha
 * de comparação e textos. Valor ausente vira "—" com o motivo, nunca 0.
 */

import { brlCompacto, numero, numeroCompacto, pct, pp, quantidade, vezes } from './formato.js';
import { TEXTOS } from './textos.js';
import { exibir, valorOuNulo } from './valor.js';
import { variacaoDiaSuspeita } from './crivel.js';

const fracao = (v) => pct(v, { casas: 1, sinal: false });
const casas = (n) => (v) => numero(v, { casas: n });
const vezesDuas = (v) => `${numero(v, { casas: 2 })}×`;

/** "141,3 milhões de ações negociadas" com o volume do dia; sem volume, null. */
const acoesNegociadas = (R) =>
  valorOuNulo(R.volume?.total) == null ? null : `${quantidade(R.volume.total.valor)} de ações negociadas`;

/** "dívida líquida de R$ 80,0 bi"; sem o valor em reais, null. */
const dividaLiquidaReais = (R) =>
  valorOuNulo(R.endividamento?.divida_liquida) == null
    ? null
    : `dívida líquida de ${brlCompacto(R.endividamento.divida_liquida.valor)}`;

/** Larguras (0 a 100) das barrinhas ação × setor; sem os dois números, null. */
export function largurasComparacao(valor, setor) {
  if (!Number.isFinite(valor) || !Number.isFinite(setor)) return null;
  const maior = Math.max(Math.abs(valor), Math.abs(setor));
  if (maior === 0) return null;
  return { acao: (Math.abs(valor) / maior) * 100, setor: (Math.abs(setor) / maior) * 100 };
}

// campo: o número exibido; comparado e setor: os dois números da barrinha (padrão: campo e setor)
const DEFINICOES = [
  { chave: 'pl', tipo: 'razao', rotulo: 'P/L', explicacao: 'pl', campo: (R) => R.pl, setor: (R) => R.pl?.setor, formatar: casas(1) },
  { chave: 'pvp', tipo: 'razao', rotulo: 'P/VP', explicacao: 'pvp', campo: (R) => R.pvp, setor: (R) => R.pvp?.setor, formatar: casas(2) },
  { chave: 'roe', tipo: 'pontos', rotulo: 'ROE', explicacao: 'roe', campo: (R) => R.roe, setor: (R) => R.roe?.setor, formatar: fracao },
  { chave: 'dividend_yield', tipo: 'pontos', rotulo: 'Dividend yield', explicacao: 'dividend_yield', campo: (R) => R.dividend_yield, setor: (R) => R.dividend_yield?.setor, formatar: fracao },
  { chave: 'payout', tipo: 'pontos', rotulo: 'Payout', explicacao: 'payout', campo: (R) => R.payout, setor: (R) => R.payout?.setor, formatar: fracao },
  { chave: 'margem_bruta', tipo: 'pontos', rotulo: 'Margem bruta', explicacao: 'margem_bruta', campo: (R) => R.margem_bruta, setor: (R) => R.margem_bruta?.setor, formatar: fracao },
  { chave: 'margem_liquida', tipo: 'pontos', rotulo: 'Margem líquida', explicacao: 'margem_liquida', campo: (R) => R.margem_liquida, setor: (R) => R.margem_liquida?.setor, formatar: fracao },
  {
    chave: 'ebitda', tipo: 'pontos', rotulo: 'EBITDA 12 meses', explicacao: 'ebitda',
    campo: (R) => R.ebitda?.valor_12m, formatar: brlCompacto,
    comparado: (R) => R.ebitda?.margem, setor: (R) => R.ebitda?.setor_margem, formatarSetor: fracao,
    complemento: (R) => {
      // O rótulo do cálculo vem no próprio dado (ex.: "EBITDA (cálculo padrão CVM)"); sem ele, só a margem.
      const rotulo = typeof R.ebitda?.rotulo === 'string' && R.ebitda.rotulo.trim() ? R.ebitda.rotulo.trim() : null;
      const margem = valorOuNulo(R.ebitda?.margem) == null ? null : `margem de ${fracao(R.ebitda.margem.valor)}`;
      const partes = [rotulo, margem].filter(Boolean);
      return partes.length ? partes.join(' · ') : null;
    },
    prefixoSetor: 'margem de ',
  },
  { chave: 'dl_ebitda', tipo: 'razao', rotulo: 'Dívida líquida / EBITDA', explicacao: 'dl_ebitda', campo: (R) => R.endividamento?.dl_ebitda, setor: (R) => R.endividamento?.setor_dl_ebitda, formatar: vezesDuas, divida: true, complemento: dividaLiquidaReais },
  { chave: 'dl_pl', tipo: 'razao', rotulo: 'Dívida líquida / patrimônio', explicacao: 'dl_pl', campo: (R) => R.endividamento?.dl_pl, setor: (R) => R.endividamento?.setor_dl_pl, formatar: vezesDuas, divida: true },
  { chave: 'beta', rotulo: 'Beta', explicacao: 'beta', campo: (R) => R.beta, formatar: casas(2) },
  { chave: 'volatilidade', rotulo: 'Volatilidade em 20 dias', explicacao: 'volatilidade', campo: (R) => R.volatilidade_20d, formatar: (v) => pct(v, { casas: 2, sinal: false }) },
  { chave: 'volume_relativo', rotulo: 'Volume relativo', explicacao: 'volume_relativo', campo: (R) => R.volume?.relativo, formatar: vezes, complemento: acoesNegociadas },
];

/** Diferença relativa abaixo da qual ação e setor estão "em linha". */
const LIMITE_EM_LINHA = 0.05;

/**
 * Compara a ação com a mediana do setor. tipo 'pontos': indicadores que já são porcentagem
 * (diferença em p.p.); 'razao': múltiplos (diferença em %). Sem os dois números, null.
 * { situacao: 'abaixo'|'acima'|'emLinha', diferenca_texto }
 */
export function compararComSetor(valor, setor, tipo) {
  if (!Number.isFinite(valor) || !Number.isFinite(setor)) return null;
  const relativa = setor === 0 ? (valor === 0 ? 0 : Math.sign(valor) * Infinity) : (valor - setor) / Math.abs(setor);
  const situacao = Math.abs(relativa) < LIMITE_EM_LINHA ? 'emLinha' : valor < setor ? 'abaixo' : 'acima';
  let diferenca_texto = '—';
  if (tipo === 'pontos') diferenca_texto = pp(valor - setor);
  else if (Number.isFinite(relativa)) diferenca_texto = pct(relativa);
  return { situacao, diferenca_texto };
}

/**
 * Os 13 indicadores da ficha, prontos para a tela:
 * { chave, rotulo, explicacao, texto, motivo, complemento, setor_texto, setor_valor_texto, barras, texto_api, nota, comparacao }.
 */
export function montarIndicadoresFicha(R) {
  if (!R) return [];
  return DEFINICOES.map((d) => {
    const campo = d.campo(R);
    const { texto, motivo } = exibir(campo, d.formatar);
    const setorCampo = d.setor ? d.setor(R) : null;
    const setor = setorCampo ? exibir(setorCampo, d.formatarSetor ?? d.formatar) : null;
    const comparado = d.comparado ? d.comparado(R) : campo;
    const caixaLiquido = d.divida && R.endividamento?.caixa_liquido?.valor === true;
    return {
      chave: d.chave,
      rotulo: d.rotulo,
      explicacao: d.explicacao,
      texto,
      motivo,
      complemento: caixaLiquido
        ? 'A empresa tem mais caixa do que dívida (caixa líquido).'
        : (d.complemento?.(R) ?? null),
      setor_texto: setor && setor.texto !== '—' ? `Setor (mediana): ${d.prefixoSetor ?? ''}${setor.texto}` : null,
      setor_valor_texto: setor && setor.texto !== '—' ? `${d.prefixoSetor ?? ''}${setor.texto}` : null,
      barras: largurasComparacao(valorOuNulo(comparado), valorOuNulo(setorCampo)),
      comparacao: d.tipo ? compararComSetor(valorOuNulo(comparado), valorOuNulo(setorCampo), d.tipo) : null,
      texto_api: campo?.texto ?? null,
      nota: d.divida ? (R.endividamento?.aviso ?? null) : null,
    };
  });
}

const PERIODOS_RETORNO = [
  { chave: 'd1', rotulo: TEXTOS.ficha.retornosTabela.periodos.d1 },
  { chave: 's1', rotulo: TEXTOS.ficha.retornosTabela.periodos.s1 },
  { chave: 'm1', rotulo: TEXTOS.ficha.retornosTabela.periodos.m1 },
  { chave: 'm6', rotulo: TEXTOS.ficha.retornosTabela.periodos.m6 },
  { chave: 'a1', rotulo: TEXTOS.ficha.retornosTabela.periodos.a1 },
];

/**
 * Tabela d1/s1/m1/m6/a1: preço, ação com proventos, Ibovespa e setor (sem a empresa).
 * A coluna s1 só aparece quando o resumo traz variacao_preco.s1 ou rentabilidade.s1; sem eles, a tabela
 * fica com as 4 colunas de sempre. `saltos` ({s1, m1, m6, a1}, true quando a janela da série da ação tem
 * salto de escala) zera a célula do preço nesse período. Variação do dia impossível (grupamento) vira célula "mudou de escala".
 */
export function montarTabelaRetornos(R, saltos = {}) {
  const temSemana = R?.variacao_preco?.s1 !== undefined || R?.rentabilidade?.s1 !== undefined;
  const colunas = temSemana ? PERIODOS_RETORNO : PERIODOS_RETORNO.filter((p) => p.chave !== 's1');
  const linha = (rotulo, grupo, ehAcao = false) => ({
    rotulo,
    celulas: colunas.map(({ chave }) => {
      const campo = grupo?.[chave];
      const v = valorOuNulo(campo);
      if (ehAcao && chave === 'd1' && variacaoDiaSuspeita(v)) {
        return { texto: '—', motivo: TEXTOS.revisao.explicacao.tecnico, sinal: null, emRevisao: true };
      }
      if (ehAcao && saltos[chave]) {
        return { texto: '—', motivo: TEXTOS.revisao.periodo, sinal: null, emRevisao: true };
      }
      return { ...exibir(campo, (x) => pct(x)), sinal: v == null ? null : v > 0 ? 'up' : v < 0 ? 'down' : 'flat' };
    }),
  });
  return {
    colunas,
    linhas: [
      linha(TEXTOS.ficha.retornosTabela.linhas.precoAcao, R?.variacao_preco, true),
      linha(TEXTOS.ficha.retornosTabela.linhas.comProventos, R?.rentabilidade, true),
      linha(TEXTOS.ficha.retornosTabela.linhas.ibovespa, R?.rentabilidade?.ibov),
      linha(TEXTOS.ficha.retornosTabela.linhas.setor, R?.rentabilidade?.setor),
    ],
  };
}

/** Tipo da ação para o cabeçalho: ON, PN ou o código cru (ex. UNIT); sem tipo, null. */
export function textoTipoAcao(tipo) {
  if (typeof tipo !== 'string' || tipo.trim() === '') return null;
  const codigo = tipo.trim().toUpperCase();
  return Object.hasOwn(TEXTOS.ficha.tipoAcao, codigo) ? TEXTOS.ficha.tipoAcao[codigo] : tipo.trim();
}

/** Faixa de oscilação pela posição (fração 0..1 entre as ações): baixa, moderada ou alta; sem posição, null. */
export function faixaOscilacao(posicao) {
  if (!Number.isFinite(posicao)) return null;
  if (posicao < 0.34) return 'baixa';
  if (posicao < 0.67) return 'moderada';
  return 'alta';
}

const E = TEXTOS.ficha.indicadores.extras;
const posicaoTexto = (campo) => exibir(campo, (v) => E.volatilidadePosicaoValor(numero(Math.round(v * 100), { casas: 0 })));

/**
 * Linhas da tabela do nível técnico: todos os indicadores das `chaves` mais os extras de cada um
 * (margem EBITDA, dívida líquida em R$, caixa líquido, percentil da volatilidade, mediana de volume).
 * { id, rotulo, explicacao, acao, motivo, setor, diferenca, situacao } ; ausência vira "—", nunca 0.
 */
export function montarLinhasTecnicas(R, chaves = []) {
  const indicadores = montarIndicadoresFicha(R);
  const linhas = [];
  const linha = (id, rotulo, explicacao, acao, setor = null, comparacao = null) =>
    linhas.push({
      id,
      rotulo,
      explicacao,
      acao: acao.texto,
      motivo: acao.motivo,
      setor: setor ?? '—',
      diferenca: comparacao?.diferenca_texto ?? '—',
      situacao: comparacao?.situacao ?? null,
    });

  for (const chave of chaves) {
    const i = indicadores.find((x) => x.chave === chave);
    if (!i) continue;
    if (chave === 'ebitda') {
      const margem = R?.ebitda?.margem;
      const setorMargem = R?.ebitda?.setor_margem;
      linha('ebitda', E.ebitda12m, i.explicacao, { texto: i.texto, motivo: i.motivo });
      linha(
        'margem_ebitda',
        E.margemEbitda,
        i.explicacao,
        exibir(margem, fracao),
        valorOuNulo(setorMargem) == null ? null : fracao(setorMargem.valor),
        compararComSetor(valorOuNulo(margem), valorOuNulo(setorMargem), 'pontos'),
      );
      continue;
    }
    const setorTexto = i.setor_valor_texto;
    linha(i.chave, i.rotulo, i.explicacao, { texto: i.texto, motivo: i.motivo }, setorTexto, i.comparacao);
    if (chave === 'dl_ebitda') {
      linha('divida_liquida', E.dividaLiquida, 'divida_liquida', exibir(R?.endividamento?.divida_liquida, brlCompacto));
      linha(
        'caixa_liquido',
        E.caixaLiquido,
        'caixa_liquido',
        exibir(R?.endividamento?.caixa_liquido, (v) => (v === true ? E.sim : E.nao)),
      );
    }
    if (chave === 'volatilidade') {
      linha('volatilidade_posicao', E.volatilidadePosicao, 'volatilidade', posicaoTexto(R?.volatilidade_20d?.posicao_pct));
    }
    if (chave === 'volume_relativo') {
      linha('volume_mediana', E.volumeMediana, 'volume', exibir(R?.volume?.mediana_20, numeroCompacto));
    }
  }
  return linhas;
}

/** Variação do primeiro ao último valor numérico da série (fração); com menos de 2 valores ou base 0, null. */
export function variacaoDaSerie(valores = []) {
  const validos = (valores ?? []).filter((v) => Number.isFinite(v));
  if (validos.length < 2 || validos[0] === 0) return null;
  return validos[validos.length - 1] / validos[0] - 1;
}

/** Texto do movimento ("subiu 12,3%", "caiu 7,0%", "ficou estável") a partir de uma fração; sem número, null. */
export function textoMovimento(frac) {
  const F = TEXTOS.ficha.frases;
  if (!Number.isFinite(frac)) return null;
  const p = pct(Math.abs(frac), { sinal: false });
  if (Math.round(Math.abs(frac) * 1000) === 0) return F.estavel;
  return frac > 0 ? F.subiu(p) : F.caiu(p);
}
