/**
 * Modo regra — RA-9 do AGENTE-CHAT-IA.md.
 *
 * Este é o dicionário de respostas fixas do protótipo, promovido a fallback:
 * entra em cena quando o serviço `agente-chat` não responde (timeout, erro,
 * teto de orçamento) ou quando VITE_USE_MOCKS=true. Mantê-lo permite o
 * comparativo "modo regra × modo LLM grounded" previsto na §9 do documento.
 */

const REGRAS = [
  {
    match: /petr/i,
    texto: `A análise de PETR4 tem 91% de confiança e se apoia em 4 sinais:

↗ volume 38% acima da média — mais gente negociando o papel;
↗ alta de 6,2% no mês, de forma consistente;
↗ 78% das 24 notícias analisadas com tom positivo;
↗ indicadores técnicos em zona favorável.

O risco é moderado: o setor de petróleo depende do preço internacional do barril, que pode oscilar. Em resumo: sinais positivos convergindo, mas sem garantia — por isso a confiança não é 100%.`,
    tickers: ['PETR4'],
  },
  {
    match: /mglu|magazine/i,
    texto: `MGLU3 está marcada como ponto de atenção (risco alto). O papel caiu 9,4% no mês com oscilações diárias acima de 4%, e 61% do noticiário recente é negativo.

Se você já possui o ativo, vale revisar o tamanho da posição. Se não possui, o sistema sugere aguardar sinais de estabilização antes de considerar entrada.`,
    tickers: ['MGLU3'],
  },
  {
    match: /vale/i,
    texto: `VALE3 sinaliza um possível ponto de entrada: o preço está próximo de um suporte respeitado há 6 meses (nível onde historicamente aparecem compradores) e o minério de ferro se recupera há 3 semanas.

Ponto de cautela: o volume ainda está 12% abaixo da média, então o sistema recomenda acompanhar a confirmação antes de decidir.`,
    tickers: ['VALE3'],
  },
  {
    match: /risco/i,
    texto: `Hoje o sistema identificou 2 riscos importantes:

⚠ MGLU3 — volatilidade elevada: queda de 9,4% com oscilações bruscas e noticiário negativo.
⚠ HAPV3 — pressão do noticiário: custos do setor de saúde pressionam o papel, sem sinal de reversão.

O nível de risco considera volatilidade, tom das notícias e comportamento do volume — nunca apenas um fator isolado.`,
    tickers: ['MGLU3', 'HAPV3'],
  },
  {
    match: /confian/i,
    texto: `A confiança mede o quanto os sinais analisados apontam na mesma direção. Quando volume, tendência, notícias e indicadores técnicos convergem, a confiança sobe; quando se contradizem, ela cai.

Importante: 91% de confiança não significa 91% de chance de lucro — significa que os dados disponíveis são fortemente consistentes entre si.`,
    tickers: [],
  },
  {
    match: /oportunidad/i,
    texto: `As 4 oportunidades de hoje:

↗ PETR4 (91%) — volume, tendência e notícias convergindo;
↗ WEGE3 (88%) — crescimento consistente com baixa oscilação;
↗ VALE3 (84%) — preço próximo de suporte histórico;
↗ ITUB4 (79%) — dividendos acima da média com estabilidade.

Abra a Central de Recomendações para ver as evidências completas de cada uma.`,
    tickers: ['PETR4', 'WEGE3', 'VALE3', 'ITUB4'],
  },
  {
    match: /funciona|como|sistema/i,
    texto: `O sistema trabalha em 5 etapas contínuas:

1. DADOS — coleta preços, volumes e notícias da B3;
2. PROCESSAMENTO — limpa e organiza esses dados;
3. INTELIGÊNCIA — cruza sinais e identifica padrões;
4. RECOMENDAÇÃO — traduz os padrões em análises explicadas;
5. DECISÃO — você decide, com os dados a seu favor.

Cada recomendação mostra as evidências e o nível de confiança para você nunca depender de uma "caixa-preta".`,
    tickers: [],
  },
];

const PADRAO = `Posso explicar qualquer análise de hoje. Experimente perguntar:

· "Por que PETR4 é uma oportunidade?"
· "Quais os riscos de hoje?"
· "O que significa confiança de 91%?"
· "Como o sistema funciona?"`;

export const MENSAGEM_INICIAL = {
  papel: 'sistema',
  texto:
    'Olá! Sou a inteligência do InvestIA. Analisei 8 ativos hoje e encontrei 4 oportunidades e 2 pontos de atenção. Pergunte em linguagem simples — eu explico os dados por trás de cada análise.',
};

export const SUGESTOES = [
  'Por que PETR4 é uma oportunidade?',
  'Quais os riscos de hoje?',
  'O que significa confiança de 91%?',
  'Como o sistema funciona?',
];

/** Resposta em modo regra, no mesmo formato do contrato POST /chat (§7). */
export function responderPorRegra(mensagem) {
  const regra = REGRAS.find((r) => r.match.test(mensagem || ''));
  return {
    resposta: regra ? regra.texto : PADRAO,
    tickers_citados: regra ? regra.tickers : [],
    fontes: [],
    modo: 'fallback',
    uso: { tokens_entrada: 0, tokens_saida: 0 },
  };
}
