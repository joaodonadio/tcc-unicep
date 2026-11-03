/**
 * Valores simulados da fonte "simulado" (só para trabalhar o design): funções puras, sem rede,
 * com semente fixa. A mesma entrada dá sempre a mesma saída.
 */

export const SEMENTE = 'acoes-b3-design';

/** Hash FNV-1a de 32 bits do texto. */
function hash(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Gerador mulberry32: sorteia números em [0, 1), sempre na mesma sequência para a mesma chave. */
export function sorteador(chave) {
  let a = hash(`${SEMENTE}:${chave}`);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Campo no formato do pacote ({valor, status}) ou valor puro: troca o valor mantendo o formato. */
function comValor(original, valor) {
  return original !== null && typeof original === 'object' ? { ...original, valor, status: 'ok' } : valor;
}

/** As `k` chaves de menor sorteio: escolha estável, que não depende da ordem da lista. */
export function escolherPorSemente(chaves, k) {
  return new Set(
    [...new Set(chaves)]
      .map((c) => [c, sorteador(c)()])
      .sort((a, b) => a[1] - b[1])
      .slice(0, k)
      .map(([c]) => c),
  );
}

/** Ação escolhida fica estável no dia (variação 0): o design mostra alta, queda e estável. */
export function variarResumo(registro, estavel) {
  if (!estavel || !registro?.cotacao) return registro;
  return { ...registro, cotacao: { ...registro.cotacao, variacao_dia: comValor(registro.cotacao.variacao_dia, 0) } };
}

/** Pesos de base do tom (positivas, neutras, negativas): desiguais de propósito, com variação por ação. */
const PESOS_TOM = [0.5, 0.32, 0.18];

/** Tom das notícias de uma ação com contagens desiguais; a quantidade total fica a mesma. */
export function variarNoticia(registro) {
  const resumo = registro?.resumo;
  const q = resumo?.quantidade;
  const quantidade = q !== null && typeof q === 'object' ? q.valor : q;
  if (!Number.isInteger(quantidade) || quantidade <= 0) return registro;
  const sortear = sorteador(`noticias:${registro.ticker}`);
  const pesos = PESOS_TOM.map((p) => p * (0.6 + sortear() * 0.8));
  const soma = pesos.reduce((s, p) => s + p, 0);
  const positivas = Math.round((quantidade * pesos[0]) / soma);
  const negativas = Math.min(quantidade - positivas, Math.round((quantidade * pesos[2]) / soma));
  const neutras = quantidade - positivas - negativas;
  return {
    ...registro,
    resumo: {
      ...resumo,
      positivas: comValor(resumo.positivas, positivas),
      neutras: comValor(resumo.neutras, neutras),
      negativas: comValor(resumo.negativas, negativas),
    },
  };
}

/** Soma n dias a "AAAA-MM-DD". */
function somarDias(iso, n) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Dias até o pagamento, a partir de hoje, dos proventos trazidos para perto. */
export const DIAS_PAGAMENTO = [0, 1, 2, 3, 5, 7, 9, 12, 16, 21];

const chaveProvento = (p) => [p.ticker, p.tipo, p.data_com, JSON.stringify(p.valor_por_acao)].join('|');

/**
 * Leva alguns proventos (escolha por semente) para os próximos dias: pagamento em hoje + DIAS_PAGAMENTO[i]
 * e data-com 10 dias antes. Os demais ficam como vieram. `hoje` inválido devolve a lista intacta.
 */
export function aproximarProventos(registros, hoje) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(hoje ?? ''))) return registros;
  const escolhidos = [...escolherPorSemente(registros.map(chaveProvento), DIAS_PAGAMENTO.length)];
  const diasDe = new Map(escolhidos.map((c, i) => [c, DIAS_PAGAMENTO[i]]));
  return registros.map((p) => {
    const dias = diasDe.get(chaveProvento(p));
    if (dias === undefined) return p;
    const pagamento = somarDias(hoje, dias);
    return { ...p, data_com: somarDias(pagamento, -10), data_pagamento: comValor(p.data_pagamento, pagamento) };
  });
}

/** Desvio diário típico do dólar simulado (0,6%). */
const DESVIO_DOLAR = 0.006;

/**
 * Fechamentos do dólar nas `datas` dadas, terminando no fechamento real; o penúltimo respeita a variação
 * do dia. Anda de trás para frente com semente fixa, então uma janela menor é o fim da maior.
 * Sem 2 datas ou sem fechamento positivo: null.
 */
export function serieDolarSimulada({ datas, fechamento, variacao }) {
  const n = Array.isArray(datas) ? datas.length : 0;
  if (n < 2 || !Number.isFinite(fechamento) || fechamento <= 0) return null;
  const sortear = sorteador('USDBRL');
  const valores = new Array(n);
  valores[n - 1] = fechamento;
  for (let i = n - 2; i >= 0; i -= 1) {
    // soma de três sorteios: passo em forma de sino, média zero (sorteia sempre, para alinhar as janelas)
    const passo = (sortear() + sortear() + sortear() - 1.5) * DESVIO_DOLAR * 2;
    const r = i === n - 2 && Number.isFinite(variacao) && variacao > -1 ? variacao : passo;
    valores[i] = valores[i + 1] / (1 + r);
  }
  return valores.map((v) => Number(v.toFixed(4)));
}
