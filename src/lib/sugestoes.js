/**
 * Sugestões por ação: regras declarativas sobre os dados do pregão.
 *
 * Cada regra tem um tipo: 'forte' (ponto forte nos dados), 'atencao' (ponto
 * de atenção) ou 'contexto'. Regra só dispara com número utilizável: status
 * diferente de 'ok' não conta, e null nunca vira 0. O texto descreve o que
 * os dados mostram; não é indicação de decisão.
 */

import { ok, valorOuNulo, textoStatus } from './valor.js';
import { brl, brlCompacto, numero, pct, pp, quantidade, vezes } from './formato.js';
import { dataBR } from './datas.js';
import { AVISO_FIXO, NAO_PREVE } from './textos.js';

const LIMITE_BASE = `${NAO_PREVE} ${AVISO_FIXO}`;

export const SEM_CONTRA = 'Nada nos dados de hoje pesa contra este ponto.';

/** true só se o campo tem valor ok e ele satisfaz a condição. */
const cmp = (campo, condicao) => {
  const x = valorOuNulo(campo);
  return x != null && condicao(x);
};

/** Formata o valor, ou devolve null se ele não existir. */
const fmtOuNulo = (x, formatar) => (x == null ? null : formatar(x));

const linha = (rotulo, valor, comparado = null) => ({ rotulo, valor, comparado });

/** Linha de dados só existe se o campo estiver ok. */
const linhaSe = (rotulo, campo, formatar) => {
  const x = valorOuNulo(campo);
  return x == null ? null : linha(rotulo, formatar(x));
};

const absPct = (x) => pct(Math.abs(x), { sinal: false });
const pctSemSinal = (x, casas = 1) => pct(x, { casas, sinal: false });

/** Lista de limites: base, balanço, comparabilidade do setor e notícias. */
const limitesDe = (R, { balanco = false, setor = false, noticias = false } = {}) => {
  const limites = [LIMITE_BASE];
  const fim = R.balanco_referencia?.data_fim_periodo;
  if (balanco && fim) {
    limites.push(`Usa o balanço até ${dataBR(fim)}, entregue em ${dataBR(R.balanco_referencia.data_entrega)}.`);
  }
  if (setor && R.setor_comparacao_fraca) {
    limites.push('O setor tem poucas empresas comparáveis; a comparação é fraca.');
  }
  if (noticias) {
    limites.push('O classificador de notícias erra às vezes, e o tom não mede o efeito no preço.');
  }
  return limites;
};

/** Ignora o ano mais recente (parcial) e devolve os dois anos fechados seguintes, do mais novo ao mais antigo. */
const doisUltimosAnosFechados = (R) => {
  const anos = [...(R.proventos_por_ano ?? [])].sort((a, b) => b.ano - a.ano);
  return [anos[1], anos[2]];
};

/**
 * Regras. Cada uma: id, nome, tipo, pacotes, condicaoTexto, aplica(R, N),
 * montar(R, N) e, opcionalmente, contra(R, N) com os argumentos específicos
 * de "O que pesa contra" (os pontos de atenção do cartão são somados depois).
 */
export const REGRAS = [
  {
    id: 'volume_incomum',
    nome: 'Volume incomum',
    tipo: 'contexto',
    pacotes: ['resumo_acao'],
    condicaoTexto: 'Volume do dia de pelo menos 1,5× a mediana dos 20 pregões anteriores.',
    aplica: (R) => cmp(R.volume?.relativo, (x) => x >= 1.5),
    montar: (R) => {
      const rel = R.volume.relativo;
      const x = rel.valor;
      return {
        titulo: 'Volume acima do normal',
        simples: `Foi negociada ${rel.texto ?? `${vezes(x)} o normal`}: bem mais que o normal.`,
        tecnico: `Volume relativo = volume do dia ÷ mediana dos 20 pregões anteriores = ${vezes(x)} (limite: 1,5×).`,
        dados: [
          linha('Volume relativo', vezes(x)),
          linhaSe('Volume do dia', R.volume.total, quantidade),
          linhaSe('Mediana de 20 pregões', R.volume.mediana_20, quantidade),
        ].filter(Boolean),
        limites: limitesDe(R),
      };
    },
  },
  {
    id: 'queda_forte_dia',
    nome: 'Queda forte no dia',
    tipo: 'atencao',
    pacotes: ['resumo_acao'],
    condicaoTexto: 'Variação do dia de −3% ou menos.',
    aplica: (R) => cmp(R.cotacao?.variacao_dia, (x) => x <= -0.03),
    montar: (R) => {
      const x = valorOuNulo(R.cotacao.variacao_dia);
      return {
        titulo: 'Queda forte no dia',
        simples: `A ação caiu ${absPct(x)} no dia.`,
        tecnico: `Variação = fechamento de hoje ÷ fechamento anterior − 1 = ${pct(x)}. Limite de atenção: queda de 3% ou mais.`,
        dados: [
          linha('Variação da ação no dia', pct(x)),
          linhaSe('Ibovespa no dia', R.rentabilidade?.ibov?.d1, pct),
          linhaSe('Média do setor no dia', R.rentabilidade?.setor?.d1, pct),
        ].filter(Boolean),
        limites: limitesDe(R),
      };
    },
    contra: (R) => {
      const mercado = cmp(R.rentabilidade?.ibov?.d1, (x) => x <= -0.01);
      const setor = cmp(R.rentabilidade?.setor?.d1, (x) => x <= -0.01);
      if (mercado && setor) return ['o mercado e o setor também caíram no dia'];
      if (mercado) return ['o mercado também caiu no dia'];
      if (setor) return ['o setor também caiu no dia'];
      return [];
    },
  },
  {
    id: 'alta_forte_dia',
    nome: 'Alta forte no dia',
    tipo: 'contexto',
    pacotes: ['resumo_acao'],
    condicaoTexto: 'Variação do dia de +3% ou mais.',
    aplica: (R) => cmp(R.cotacao?.variacao_dia, (x) => x >= 0.03),
    montar: (R) => {
      const x = valorOuNulo(R.cotacao.variacao_dia);
      return {
        titulo: 'Alta forte no dia',
        simples: `A ação subiu ${absPct(x)} no dia.`,
        tecnico: `Variação = fechamento de hoje ÷ fechamento anterior − 1 = ${pct(x)}. Limite de contexto: alta de 3% ou mais.`,
        dados: [
          linha('Variação da ação no dia', pct(x)),
          linhaSe('Ibovespa no dia', R.rentabilidade?.ibov?.d1, pct),
          linhaSe('Média do setor no dia', R.rentabilidade?.setor?.d1, pct),
        ].filter(Boolean),
        limites: limitesDe(R),
      };
    },
  },
  {
    id: 'desempenho_6m',
    nome: 'Desempenho acima do Ibovespa e do setor em 6 meses',
    tipo: 'forte',
    pacotes: ['resumo_acao'],
    condicaoTexto:
      'Rentabilidade de 6 meses superior à do Ibovespa e à média do setor em mais de 5 pontos percentuais.',
    aplica: (R) => {
      const m6 = valorOuNulo(R.rentabilidade?.m6);
      const ibov = valorOuNulo(R.rentabilidade?.ibov?.m6);
      const setor = valorOuNulo(R.rentabilidade?.setor?.m6);
      return m6 != null && ibov != null && setor != null && m6 - ibov > 0.05 && m6 - setor > 0.05;
    },
    montar: (R) => {
      const m6 = valorOuNulo(R.rentabilidade.m6);
      const ibov = valorOuNulo(R.rentabilidade.ibov.m6);
      const setor = valorOuNulo(R.rentabilidade.setor.m6);
      return {
        titulo: 'Desempenho acima do Ibovespa e do setor em 6 meses',
        simples: `Em 6 meses, a ação rendeu ${pct(m6)}, contra ${pct(ibov)} do Ibovespa e ${pct(setor)} da média do setor.`,
        tecnico: `Rentabilidade de 6 meses (127 pregões), com proventos reinvestidos. Diferença: ${pp(m6 - ibov)} do Ibovespa e ${pp(m6 - setor)} da média do setor, ambas acima de 5 p.p. A média do setor não inclui a própria ação.`,
        dados: [
          linha('Ação, 6 meses', pct(m6)),
          linha('Ibovespa, 6 meses', pct(ibov)),
          linha('Média do setor, 6 meses', pct(setor)),
        ],
        limites: limitesDe(R, { setor: true }),
      };
    },
    contra: (R) => {
      const vol = cmp(R.volatilidade_20d?.posicao_pct, (x) => x >= 0.75);
      return vol
        ? [`volatilidade entre as mais altas: maior que ${pctSemSinal(valorOuNulo(R.volatilidade_20d.posicao_pct), 0)} das ações`]
        : [];
    },
  },
  {
    id: 'pl_baixo_roe_ok',
    nome: 'P/L baixo com ROE em linha ou acima do setor',
    tipo: 'forte',
    pacotes: ['resumo_acao'],
    condicaoTexto:
      'P/L positivo abaixo de 70% da mediana do setor, com ROE igual ou maior que a mediana do setor.',
    aplica: (R) => {
      const pl = valorOuNulo(R.pl);
      const plSetor = valorOuNulo(R.pl?.setor);
      const roe = valorOuNulo(R.roe);
      const roeSetor = valorOuNulo(R.roe?.setor);
      return (
        pl != null &&
        pl > 0 &&
        plSetor != null &&
        pl < 0.7 * plSetor &&
        roe != null &&
        roeSetor != null &&
        roe >= roeSetor
      );
    },
    montar: (R) => {
      const pl = valorOuNulo(R.pl);
      const plSetor = valorOuNulo(R.pl.setor);
      const roe = valorOuNulo(R.roe);
      const roeSetor = valorOuNulo(R.roe.setor);
      return {
        titulo: 'P/L baixo com ROE em linha ou acima do setor',
        simples: `A ação custa ${vezes(pl)} o lucro de 12 meses, abaixo da mediana do setor (${vezes(plSetor)}), e dá um retorno sobre o patrimônio de ${pctSemSinal(roe, 0)}, em linha ou acima do setor.`,
        tecnico: `P/L = valor de mercado ÷ lucro líquido de 12 meses; P/L abaixo de 70% da mediana do setor e ROE (lucro 12m ÷ patrimônio) no mínimo igual à mediana do setor. Aqui: P/L ${vezes(pl)} contra ${vezes(plSetor)} do setor (limite: ${vezes(0.7 * plSetor)}); ROE ${pctSemSinal(roe)} contra ${pctSemSinal(roeSetor)} do setor.`,
        dados: [
          linha('P/L', vezes(pl), vezes(plSetor)),
          linha('ROE', pctSemSinal(roe), pctSemSinal(roeSetor)),
        ],
        limites: limitesDe(R, { balanco: true, setor: true }),
      };
    },
    contra: (R) => {
      const m = valorOuNulo(R.margem_liquida);
      const ms = valorOuNulo(R.margem_liquida?.setor);
      return m != null && ms != null && m < ms
        ? [`margem líquida de ${pctSemSinal(m)} abaixo da mediana do setor (${pctSemSinal(ms)})`]
        : [];
    },
  },
  {
    id: 'dy_alto',
    nome: 'Dividend yield alto',
    tipo: 'forte',
    pacotes: ['resumo_acao'],
    condicaoTexto: 'Dividend yield de 6% ou mais e pelo menos 1,2 vez a mediana do setor.',
    aplica: (R) => {
      const dy = valorOuNulo(R.dividend_yield);
      const dySetor = valorOuNulo(R.dividend_yield?.setor);
      return dy != null && dy >= 0.06 && dySetor != null && dy >= 1.2 * dySetor;
    },
    montar: (R) => {
      const dy = valorOuNulo(R.dividend_yield);
      const dySetor = valorOuNulo(R.dividend_yield.setor);
      return {
        titulo: 'Dividend yield alto para o setor',
        simples: `Nos últimos 12 meses, os proventos pagos somaram ${pctSemSinal(dy)} do preço, bem acima da mediana do setor (${pctSemSinal(dySetor)}).`,
        tecnico: `DY = soma dos proventos com data-com em 12 meses ÷ preço. Aqui: ${pctSemSinal(dy)} contra ${pctSemSinal(dySetor)} da mediana do setor. Limite: 6% e 1,2× a mediana do setor.`,
        dados: [linha('Dividend yield (12 meses)', pctSemSinal(dy), pctSemSinal(dySetor))],
        limites: limitesDe(R, { balanco: true, setor: true }),
      };
    },
    contra: (R) => {
      const [ultimo, anterior] = doisUltimosAnosFechados(R);
      if (!ok(ultimo) || !ok(anterior)) return [];
      return ultimo.valor < 0.5 * anterior.valor
        ? [`os proventos de ${ultimo.ano} somaram ${brl(ultimo.valor)} por ação, menos da metade de ${anterior.ano} (${brl(anterior.valor)})`]
        : [];
    },
  },
  {
    id: 'divida_alta',
    nome: 'Dívida alta',
    tipo: 'atencao',
    pacotes: ['resumo_acao'],
    condicaoTexto:
      'Sem caixa líquido, e dívida líquida acima de 3× o EBITDA; ou acima de 2× a mediana do setor e de 1,5×.',
    aplica: (R) => {
      const e = R.endividamento;
      if (e?.caixa_liquido?.valor === true) return false;
      const dl = valorOuNulo(e?.dl_ebitda);
      if (dl == null) return false;
      const setor = valorOuNulo(e?.setor_dl_ebitda);
      return dl > 3 || (setor != null && setor > 0 && dl > 2 * setor && dl > 1.5);
    },
    montar: (R) => {
      const dl = valorOuNulo(R.endividamento.dl_ebitda);
      const setor = valorOuNulo(R.endividamento.setor_dl_ebitda);
      const comparacao = setor != null ? `; a mediana do setor é ${vezes(setor)}` : '';
      return {
        titulo: 'Dívida alta em relação ao lucro operacional',
        simples: `A dívida líquida equivale a ${vezes(dl)} o EBITDA de 12 meses${comparacao}.`,
        tecnico: `DL = empréstimos de curto e longo prazo − caixa − aplicações (sem arrendamentos). DL ÷ EBITDA (12m) = ${vezes(dl)}. Limite de atenção: acima de 3×, ou acima de 2× a mediana do setor e de 1,5×.`,
        dados: [
          linha('Dívida líquida ÷ EBITDA', vezes(dl), fmtOuNulo(setor, vezes)),
          linhaSe('Dívida líquida ÷ patrimônio', R.endividamento.dl_pl, vezes),
        ].filter(Boolean),
        limites: limitesDe(R, { balanco: true, setor: true }),
      };
    },
    contra: (R) => {
      const dlpl = valorOuNulo(R.endividamento?.dl_pl);
      const setor = valorOuNulo(R.endividamento?.setor_dl_pl);
      return dlpl != null && setor != null && dlpl < setor
        ? ['em relação ao patrimônio, a dívida é menor que a do setor']
        : [];
    },
  },
  {
    id: 'prejuizo_12m',
    nome: 'Prejuízo nos últimos 12 meses',
    tipo: 'atencao',
    pacotes: ['resumo_acao'],
    condicaoTexto: 'Lucro líquido dos últimos 12 meses negativo.',
    aplica: (R) => R.pl?.status === 'lucro_negativo',
    montar: (R) => {
      const extra = R.pl?.texto ? ` ${R.pl.texto}` : '';
      return {
        titulo: 'Prejuízo nos últimos 12 meses',
        simples: 'A empresa teve prejuízo nos últimos 12 meses, então o P/L não se aplica.',
        tecnico: `Lucro líquido de 12 meses negativo, por isso o P/L não é calculado.${extra}`,
        dados: [linha('P/L', textoStatus(R.pl))],
        limites: limitesDe(R),
      };
    },
  },
  {
    id: 'queda_forte_mes',
    nome: 'Queda forte no mês',
    tipo: 'atencao',
    pacotes: ['resumo_acao'],
    condicaoTexto: 'Rentabilidade de 1 mês (22 pregões) de −15% ou menos.',
    aplica: (R) => cmp(R.rentabilidade?.m1, (x) => x <= -0.15),
    montar: (R) => {
      const m1 = valorOuNulo(R.rentabilidade.m1);
      return {
        titulo: 'Queda forte no mês',
        simples: `A ação caiu ${absPct(m1)} nos últimos 22 pregões, cerca de um mês.`,
        tecnico: `Rentabilidade de 1 mês (22 pregões), com proventos reinvestidos: ${pct(m1)}. Limite de atenção: queda de 15% ou mais.`,
        dados: [
          linha('Ação, 1 mês', pct(m1)),
          linhaSe('Ibovespa, 1 mês', R.rentabilidade?.ibov?.m1, pct),
        ].filter(Boolean),
        limites: limitesDe(R),
      };
    },
    contra: (R) => {
      const m6 = valorOuNulo(R.rentabilidade?.m6);
      const ibov6 = valorOuNulo(R.rentabilidade?.ibov?.m6);
      return m6 != null && ibov6 != null && m6 > ibov6
        ? ['em 6 meses ainda está acima do Ibovespa']
        : [];
    },
  },
  {
    id: 'oscila_pouco',
    nome: 'Oscila pouco',
    tipo: 'contexto',
    pacotes: ['resumo_acao'],
    condicaoTexto: 'Volatilidade na faixa mais baixa (até o 25º percentil das ações) e beta abaixo de 0,7.',
    aplica: (R) => cmp(R.volatilidade_20d?.posicao_pct, (x) => x <= 0.25) && cmp(R.beta, (x) => x < 0.7),
    montar: (R) => {
      const detalhes = [R.volatilidade_20d.texto, R.beta.texto].filter(Boolean);
      const simples = detalhes.length
        ? `Oscila pouco: ${detalhes.join('; ')}.`
        : 'Oscila pouco em relação às outras ações e ao Ibovespa.';
      return {
        titulo: 'Oscila pouco',
        simples,
        tecnico: `Volatilidade = desvio-padrão dos 20 últimos retornos diários ajustados = ${pctSemSinal(valorOuNulo(R.volatilidade_20d), 2)}. Beta = inclinação da regressão dos retornos diários da ação sobre os do IBOV em 252 pregões = ${numero(valorOuNulo(R.beta))}. Limites: volatilidade entre as 25% mais baixas e beta abaixo de 0,7.`,
        dados: [
          linha('Volatilidade (20 pregões)', pctSemSinal(valorOuNulo(R.volatilidade_20d), 2)),
          linha('Beta', numero(valorOuNulo(R.beta))),
        ],
        limites: limitesDe(R),
      };
    },
  },
  {
    id: 'noticias_positivas',
    nome: 'Notícias com tom positivo',
    tipo: 'forte',
    pacotes: ['noticias_dia'],
    condicaoTexto: 'Pelo menos 5 notícias no dia e tom médio de +0,25 ou mais.',
    aplica: (_R, N) =>
      cmp(N?.resumo?.quantidade, (q) => q >= 5) && cmp(N?.resumo?.tom_medio, (t) => t >= 0.25),
    montar: (R, N) => {
      const q = valorOuNulo(N.resumo.quantidade);
      const tom = valorOuNulo(N.resumo.tom_medio);
      return {
        titulo: 'Notícias com tom positivo',
        simples: `Das ${quantidade(q)} notícias do dia, o tom médio foi positivo (${numero(tom, { casas: 2 })}, numa escala de −1 a +1).`,
        tecnico: `Tom médio = média de (prob. positiva − prob. negativa) do FinBERT-PT-BR = ${numero(tom, { casas: 2 })}, com ${quantidade(q)} notícias. Limites: tom de 0,25 ou mais e 5 notícias ou mais.`,
        dados: [
          linha('Notícias no dia', quantidade(q)),
          linha('Tom médio', numero(tom, { casas: 2 })),
        ],
        limites: limitesDe(R, { noticias: true }),
      };
    },
    contra: (R, N) => {
      const q = valorOuNulo(N?.resumo?.quantidade);
      return q != null && q < 10 ? [`poucas notícias (${numero(q, { casas: 0 })} no período)`] : [];
    },
  },
  {
    id: 'noticias_negativas',
    nome: 'Notícias com tom negativo',
    tipo: 'atencao',
    pacotes: ['noticias_dia'],
    condicaoTexto: 'Pelo menos 5 notícias no dia e tom médio de −0,25 ou menos.',
    aplica: (_R, N) =>
      cmp(N?.resumo?.quantidade, (q) => q >= 5) && cmp(N?.resumo?.tom_medio, (t) => t <= -0.25),
    montar: (R, N) => {
      const q = valorOuNulo(N.resumo.quantidade);
      const tom = valorOuNulo(N.resumo.tom_medio);
      return {
        titulo: 'Notícias com tom negativo',
        simples: `Das ${quantidade(q)} notícias do dia, o tom médio foi negativo (${numero(tom, { casas: 2 })}, numa escala de −1 a +1).`,
        tecnico: `Tom médio = média de (prob. positiva − prob. negativa) do FinBERT-PT-BR = ${numero(tom, { casas: 2 })}, com ${quantidade(q)} notícias. Limites: tom de −0,25 ou menos e 5 notícias ou mais.`,
        dados: [
          linha('Notícias no dia', quantidade(q)),
          linha('Tom médio', numero(tom, { casas: 2 })),
        ],
        limites: limitesDe(R, { noticias: true }),
      };
    },
  },
  {
    id: 'caixa_liquido',
    nome: 'Caixa líquido',
    tipo: 'forte',
    pacotes: ['resumo_acao'],
    condicaoTexto: 'Dívida líquida negativa: a empresa tem mais caixa e aplicações do que dívida.',
    aplica: (R) => R.endividamento?.caixa_liquido?.valor === true,
    montar: (R) => {
      const dl = valorOuNulo(R.endividamento.divida_liquida);
      const caixa = fmtOuNulo(dl, (x) => brlCompacto(-x));
      return {
        titulo: 'Caixa líquido',
        simples: caixa
          ? `A empresa tem mais caixa do que dívida: caixa líquido de ${caixa}.`
          : 'A empresa tem mais caixa do que dívida.',
        tecnico: `Dívida líquida = empréstimos de curto e longo prazo − caixa − aplicações (sem arrendamentos) = ${brlCompacto(dl)}. Valor negativo significa caixa líquido.`,
        dados: [linha('Dívida líquida', brlCompacto(dl))],
        limites: limitesDe(R, { balanco: true }),
      };
    },
    contra: (R) => {
      const roe = valorOuNulo(R.roe);
      const roeSetor = valorOuNulo(R.roe?.setor);
      return roe != null && roeSetor != null && roe < roeSetor
        ? [`ROE de ${pctSemSinal(roe)} abaixo da mediana do setor (${pctSemSinal(roeSetor)})`]
        : [];
    },
  },
  {
    id: 'payout_acima_lucro',
    nome: 'Proventos acima do lucro',
    tipo: 'atencao',
    pacotes: ['resumo_acao'],
    condicaoTexto: 'Payout acima de 100%: proventos pagos nos últimos 12 meses maiores que o lucro.',
    aplica: (R) => cmp(R.payout, (x) => x > 1),
    montar: (R) => {
      const p = valorOuNulo(R.payout);
      return {
        titulo: 'Proventos acima do lucro',
        simples: `A empresa pagou em proventos mais do que lucrou nos últimos 12 meses (payout de ${pctSemSinal(p, 0)}). Isso acontece, mas pode não se repetir.`,
        tecnico: `Payout = proventos pagos em 12 meses ÷ lucro de 12 meses = ${pctSemSinal(p, 0)}. Limite de atenção: acima de 100%.`,
        dados: [linha('Payout (12 meses)', pctSemSinal(p, 0), fmtOuNulo(valorOuNulo(R.payout?.setor), (x) => pctSemSinal(x, 0)))],
        limites: limitesDe(R, { balanco: true }),
      };
    },
  },
];

/** Texto de "O que pesa contra" para um sinal: específicos da regra e, nos fortes, os pontos de atenção do cartão. */
const contraDoSinal = (regra, R, N, doCartao) => {
  const especificos = regra.contra?.(R, N) ?? [];
  const atencoes = regra.tipo === 'forte' ? doCartao.filter((s) => s.tipo === 'atencao').map((s) => s.simples) : [];
  const todos = [...new Set([...especificos, ...atencoes])];
  return todos.length ? todos : [SEM_CONTRA];
};

/** Sinais disparados para uma ação, com "O que pesa contra" já calculado. */
const sinaisDoCartao = (R, N) => {
  const disparados = REGRAS.filter((regra) => regra.aplica(R, N)).map((regra) => ({
    regra,
    montado: regra.montar(R, N),
  }));
  const doCartao = disparados.map(({ regra, montado }) => ({ id: regra.id, tipo: regra.tipo, simples: montado.simples }));
  return disparados.map(({ regra, montado }) => ({
    id: regra.id,
    nome: regra.nome,
    tipo: regra.tipo,
    titulo: montado.titulo,
    simples: montado.simples,
    tecnico: montado.tecnico,
    dados: montado.dados,
    contra: contraDoSinal(regra, R, N, doCartao),
    limites: montado.limites,
    pacotes: regra.pacotes,
  }));
};

const porTicker = (lista) => new Map((lista ?? []).map((item) => [item.ticker, item]));

const contarPorTipo = (sinais) => {
  const contagem = { forte: 0, atencao: 0, contexto: 0, total: sinais.length };
  for (const s of sinais) contagem[s.tipo] += 1;
  return contagem;
};

/**
 * Cartões de sugestão: uma entrada por ticker com pelo menos um sinal.
 * Ordenados por total de sinais (maior primeiro) e, em empate, por ticker.
 */
export function gerarSugestoes({ resumos = [], noticias = [], acoes = [] } = {}) {
  const noticiasPorTicker = porTicker(noticias);
  const acoesPorTicker = porTicker(acoes);

  const cartoes = [];
  for (const R of resumos) {
    const N = noticiasPorTicker.get(R.ticker) ?? null;
    const A = acoesPorTicker.get(R.ticker) ?? {};
    const sinais = sinaisDoCartao(R, N);
    if (sinais.length === 0) continue;
    cartoes.push({
      ticker: R.ticker,
      empresa: A.empresa ?? null,
      setor: A.setor ?? null,
      ativoNoUniverso: A.ativo_no_universo ?? null,
      dataReferencia: R.data_referencia,
      sinais,
      contagem: contarPorTipo(sinais),
    });
  }

  return cartoes.sort((a, b) => b.contagem.total - a.contagem.total || (a.ticker < b.ticker ? -1 : a.ticker > b.ticker ? 1 : 0));
}

/** "2 pontos fortes nos dados e 1 ponto de atenção". */
export function resumirCartao(s) {
  const c = s.contagem ?? {};
  const partes = [];
  if (c.forte) partes.push(`${c.forte} ${c.forte === 1 ? 'ponto forte nos dados' : 'pontos fortes nos dados'}`);
  if (c.atencao) partes.push(`${c.atencao} ${c.atencao === 1 ? 'ponto de atenção' : 'pontos de atenção'}`);
  if (c.contexto) partes.push(`${c.contexto} ${c.contexto === 1 ? 'contexto' : 'contextos'}`);
  if (partes.length === 0) return 'Nenhum sinal hoje';
  if (partes.length === 1) return partes[0];
  return `${partes.slice(0, -1).join(', ')} e ${partes.at(-1)}`;
}
