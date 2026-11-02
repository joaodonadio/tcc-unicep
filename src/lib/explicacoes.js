/**
 * Explicações dos indicadores e conceitos da interface.
 *
 * Cada entrada tem:
 * - titulo: nome curto do item;
 * - simples: 1 a 2 frases para leitor leigo (analogias do dia a dia são aceitas);
 * - tecnico: fórmula ou janela de cálculo, conforme a especificação.
 */

export const EXPLICACOES = {
  pregao: {
    titulo: 'Pregão',
    simples:
      'É o período do dia em que a bolsa fica aberta oficialmente para comprar e vender ações, fundos imobiliários, contratos futuros e moedas. Na B3, vai das 10h às 17h, horário de Brasília.',
    tecnico:
      'Sessão de negociação da B3, no horário de Brasília, das 10h às 17h. Os dados de referência são do último pregão encerrado, publicados na manhã seguinte.',
  },

  sinais: {
    titulo: 'Sinais: ponto forte, atenção e contexto',
    simples:
      'Cada sinal é um aviso gerado por uma regra fixa. "Ponto forte nos dados" quer dizer que uma regra favorável deu resultado, como proventos acima do setor. "Ponto de atenção" quer dizer que uma regra de cuidado deu resultado, como dívida alta ou queda forte. "Contexto" é um fato que merece nota, mas não é bom nem ruim, como volume fora do normal ou oscilação baixa.',
    tecnico:
      'Três tipos de sinal, todos vindos de regras com limite fixo: ponto forte (regra favorável acesa), ponto de atenção (regra de cuidado acesa) e contexto (fato informativo, sem juízo de valor). Um sinal não soma pontos nem vira nota final.',
  },

  regra_acender: {
    titulo: 'Quando uma regra dá resultado',
    simples:
      'Cada regra é uma condição com um limite fixo, por exemplo: "P/L abaixo de 70% do setor e ROE no mínimo igual ao do setor". Se os dados da ação passam do limite, a regra dá resultado. Se não passam, ou se o dado está indisponível, ela fica sem resultado: nenhum valor é inventado.',
    tecnico:
      'Regra = condição sobre campos do pacote, com limite fixo definido antes da análise (ex.: P/L < 0,7 × mediana do setor e ROE ≥ mediana do setor). Dado ausente ou indisponível deixa a regra apagada; nunca vira zero nem estimativa.',
  },

  cotacao: {
    titulo: 'Cotação',
    simples: 'É o preço de uma ação no fechamento do pregão, em reais.',
    tecnico: 'Fechamento do último pregão, sem ajuste por dividendos.',
  },

  variacao: {
    titulo: 'Variação',
    simples: 'Mostra quanto o preço mudou em um período, sem contar os proventos recebidos.',
    tecnico: 'variação = fechamento(t) ÷ fechamento(t−n) − 1, sem dividendos.',
  },

  rentabilidade: {
    titulo: 'Rentabilidade',
    simples: 'Mostra quanto a ação rendeu em um período, contando a mudança de preço e os proventos recebidos.',
    tecnico: 'rentabilidade = fechamento ajustado(t) ÷ fechamento ajustado(t−n) − 1, com dividendos reinvestidos.',
  },

  volume: {
    titulo: 'Volume',
    simples: 'É a quantidade de ações negociadas no pregão. Não é o valor em reais.',
    tecnico: 'Quantidade de ações negociadas no pregão de referência (não é valor em reais).',
  },

  volume_relativo: {
    titulo: 'Volume relativo',
    simples: 'Compara o volume de hoje com o volume habitual da ação. Um número acima de 1 significa mais negociação que o normal.',
    tecnico: 'Volume relativo = volume(t) ÷ mediana dos 20 pregões anteriores.',
  },

  volatilidade: {
    titulo: 'Volatilidade',
    simples: 'Mede o quanto o preço sobe e desce de um dia para o outro. Quanto maior, mais agitada é a ação.',
    tecnico: 'Desvio-padrão dos 20 últimos retornos diários ajustados.',
  },

  beta: {
    titulo: 'Beta',
    simples: 'Mostra quanto a ação costuma acompanhar o Ibovespa. Beta 1 significa acompanhar na mesma medida; abaixo de 1, se mexe menos que o índice.',
    tecnico: 'Inclinação da regressão dos retornos diários da ação sobre os retornos diários do IBOV, em 252 pregões.',
  },

  pl: {
    titulo: 'P/L (preço sobre lucro)',
    simples:
      'Mostra quantos anos de lucro atual seriam necessários para "pagar" o preço da ação. Quanto menor, mais barata a ação parece em relação ao lucro. Mas um P/L muito baixo também pode indicar desconfiança do mercado.',
    tecnico:
      'P/L = valor de mercado ÷ lucro líquido de 12 meses. Abaixo da mediana do setor, pode indicar ação barata em relação ao lucro, mas também desconfiança. Não se aplica quando o lucro de 12 meses é negativo.',
  },

  pvp: {
    titulo: 'P/VP (preço sobre patrimônio)',
    simples: 'Compara o valor da empresa na bolsa com o patrimônio contábil, ou seja, o que sobraria no papel se tudo fosse vendido.',
    tecnico: 'P/VP = valor de mercado ÷ patrimônio líquido.',
  },

  roe: {
    titulo: 'ROE (retorno sobre o patrimônio)',
    simples:
      'Mostra quanto lucro a empresa gera para cada R$ 100 que os acionistas colocaram nela. Quanto maior, melhor a empresa usa o dinheiro dos donos.',
    tecnico: 'ROE = lucro líquido de 12 meses ÷ patrimônio líquido.',
  },

  dividend_yield: {
    titulo: 'Dividend yield',
    simples: 'É o quanto os proventos pagos nos últimos 12 meses representam do preço atual da ação, em porcentagem.',
    tecnico: 'DY = soma dos proventos com data-com em 12 meses ÷ fechamento.',
  },

  proventos: {
    titulo: 'Proventos',
    simples:
      'É o dinheiro que a empresa paga aos acionistas, na forma de dividendos ou juros sobre capital próprio (JCP). A data-com define quem tem direito a receber; a data de pagamento é quando o dinheiro cai na conta.',
    tecnico:
      'Dividendos e JCP por ação. Data-com: último dia para ter direito ao provento (a ação passa a ser negociada sem ele no pregão seguinte). Data de pagamento: quando o valor é creditado.',
  },

  payout: {
    titulo: 'Payout',
    simples: 'É a parte do lucro que a empresa distribuiu aos acionistas como proventos. Acima de 100%, a empresa pagou mais do que lucrou.',
    tecnico: 'Payout = proventos pagos em 12 meses ÷ lucro líquido de 12 meses.',
  },

  margem_bruta: {
    titulo: 'Margem bruta',
    simples: 'De cada 100 reais vendidos, quanto sobra depois de pagar o custo direto do que foi vendido.',
    tecnico: 'Margem bruta = lucro bruto de 12 meses ÷ receita de 12 meses.',
  },

  margem_liquida: {
    titulo: 'Margem líquida',
    simples: 'De cada 100 reais vendidos, quanto vira lucro final depois de todas as despesas e impostos.',
    tecnico: 'Margem líquida = lucro líquido de 12 meses ÷ receita de 12 meses.',
  },

  ebitda: {
    titulo: 'EBITDA',
    simples: 'É uma medida de geração de caixa da operação, antes de juros, impostos, depreciação e amortização.',
    tecnico: 'EBITDA = EBIT + depreciação e amortização (12 meses), cálculo padrão CVM.',
  },

  divida_liquida: {
    titulo: 'Dívida líquida',
    simples: 'É tudo o que a empresa deve, descontado o caixa que ela tem. Se o valor for negativo, há mais caixa do que dívida.',
    tecnico: 'DL = empréstimos de curto prazo + empréstimos de longo prazo − caixa − aplicações. Sem arrendamentos.',
  },

  dl_pl: {
    titulo: 'Dívida líquida sobre patrimônio',
    simples: 'Compara a dívida líquida com o patrimônio da empresa. Quanto maior, mais a empresa depende de dinheiro emprestado.',
    tecnico: 'DL ÷ patrimônio líquido.',
  },

  dl_ebitda: {
    titulo: 'Dívida líquida sobre EBITDA',
    simples: 'Mostra quantos anos de geração de caixa seriam necessários para pagar a dívida líquida. Quanto menor, mais folgada a empresa.',
    tecnico: 'DL ÷ EBITDA de 12 meses.',
  },

  caixa_liquido: {
    titulo: 'Caixa líquido',
    simples: 'Acontece quando a empresa tem mais caixa e aplicações do que dívidas. Ela poderia quitar tudo o que deve e ainda sobraria dinheiro.',
    tecnico: 'Caixa líquido quando a dívida líquida é negativa (DL < 0).',
  },

  setor: {
    titulo: 'Setor',
    simples:
      'É um grupo de empresas do mesmo ramo, pela classificação oficial da B3. Para comparar uma ação com as outras do grupo, usamos o valor do meio (a mediana), que não é distorcido por uma empresa muito fora da curva.',
    tecnico:
      'Setor pela classificação setorial da B3. Indicadores de valor (P/L, P/VP, ROE, DY, payout, margens, dívida) são comparados com a mediana das outras empresas do setor. A rentabilidade do setor é a média das outras empresas, sem a própria ação.',
  },

  noticias_tom: {
    titulo: 'Tom das notícias',
    simples: 'Resume se as notícias do dia falam bem ou mal da empresa, numa escala de −1 (todas negativas) a +1 (todas positivas).',
    tecnico: 'Tom médio = média de (probabilidade positiva − probabilidade negativa) de cada notícia.',
  },

  finbert: {
    titulo: 'FinBERT-PT-BR',
    simples:
      'É um modelo de inteligência artificial treinado para ler textos de finanças em português. Ele lê cada manchete e diz se o tom é positivo, neutro ou negativo, com uma probabilidade para cada. Não lê o preço da ação e às vezes erra.',
    tecnico:
      'Classificador de sentimento FinBERT-PT-BR: uma probabilidade para cada classe (positiva, neutra, negativa) por manchete. Não usa cotação; pode errar, por isso o tom é um indício, não um fato.',
  },

  tres_noticias: {
    titulo: 'As 3 principais notícias',
    simples:
      'Entre as manchetes de destaque de cada empresa, escolhemos as três em que o FinBERT mostrou tom mais forte, positivo ou negativo. Manchetes repetidas em ações da mesma empresa aparecem uma vez só.',
    tecnico:
      'Ordenação pela maior diferença entre a probabilidade positiva e a negativa de cada manchete (FinBERT-PT-BR). Manchetes idênticas de ações da mesma empresa são deduplicadas; ficam as três primeiras da lista.',
  },

  janela_noite: {
    titulo: 'Notícias fora do pregão',
    simples: 'Notícias publicadas depois que o mercado fechou entram na análise do pregão seguinte, porque ninguém conseguiu reagir a elas antes.',
    tecnico: 'Janela: notícias publicadas após o fechamento do pregão até as 8h do pregão seguinte (horário de Brasília).',
  },

  xgboost: {
    titulo: 'XGBoost',
    simples: 'É um modelo estatístico que aprende padrões em dados passados. Ele não prevê o preço de amanhã, e um número só aparece quando passa pelas checagens de calibração.',
    tecnico: 'Modelo de árvores de decisão em gradiente (XGBoost) treinado com dados históricos, com calibração conferida antes de exibir a saída.',
  },

  faixa_acaso: {
    titulo: 'Faixa do acaso',
    simples: 'É a faixa de resultados que um palpite aleatório também atingiria. Se a saída do modelo cai dentro dela, não há sinal que se distinga do acaso.',
    tecnico: 'Faixa de referência obtida com o mesmo modelo em dados sem padrão, para separar acerto por sorte de acerto por padrão.',
  },

  ibovespa: {
    titulo: 'Ibovespa',
    simples:
      'É o principal índice da bolsa brasileira: uma carteira com as ações mais negociadas da B3. Serve de régua para saber como o "mercado" se saiu no dia.',
    tecnico: 'Pontos do índice no fechamento. A variação diária do índice é calculada sem dividendos.',
  },

  dolar: {
    titulo: 'Dólar',
    simples: 'É quanto custa 1 dólar em reais.',
    tecnico: 'Cotação do dólar comercial em reais no fechamento do pregão de referência.',
  },

  brent: {
    titulo: 'Brent',
    simples:
      'É o preço internacional do barril de petróleo, cotado em dólares. Quando ele sobe ou cai, afeta a Petrobras e outras empresas ligadas ao petróleo.',
    tecnico: 'Cotação do petróleo Brent, em dólares por barril, no fechamento do pregão de referência.',
  },

  cdi: {
    titulo: 'CDI',
    simples:
      'É a taxa de referência da renda fixa no Brasil, o "juro básico" usado nas aplicações de bancos. Quando dizemos "render 100% do CDI", queremos dizer que a aplicação rendeu o mesmo que essa taxa.',
    tecnico: 'CDI diário acumulado no período da janela, a partir da taxa diária publicada.',
  },

  ipca: {
    titulo: 'IPCA',
    simples:
      'É a inflação oficial do Brasil, medida pelo IBGE. Mostra quanto os preços subiram em 12 meses, ou seja, quanto o dinheiro parado perdeu de poder de compra.',
    tecnico: 'IPCA acumulado em 12 meses, com o mês de referência publicado pelo IBGE.',
  },

  ivvb11: {
    titulo: 'IVVB11',
    simples:
      'É um fundo negociado na B3 que replica o S&P 500, o principal índice das ações americanas, com preço em reais. Permite acompanhar empresas dos Estados Unidos sem abrir conta lá fora.',
    tecnico: 'ETF negociado na B3 que replica o S&P 500 em reais; a cotação acompanha o índice americano convertido pelo câmbio.',
  },

  smll: {
    titulo: 'SMLL (small caps)',
    simples:
      'É o índice das empresas menores da B3, as chamadas small caps. Por serem menores, essas empresas costumam oscilar mais que as grandes.',
    tecnico: 'Índice das ações de menor valor de mercado e liquidez da B3 (small caps). Pontos no fechamento.',
  },

  idiv: {
    titulo: 'IDIV',
    simples:
      'É o índice das ações que mais pagam dividendos na B3. Serve de referência para quem procura empresas que distribuem renda aos acionistas.',
    tecnico: 'Índice das ações da B3 com maior rendimento de dividendos, em carteira teórica. Pontos no fechamento.',
  },

  ifix: {
    titulo: 'IFIX',
    simples:
      'É o índice dos fundos imobiliários negociados na B3. Mostra, na média, como foram os fundos que aplicam em imóveis e em títulos ligados a imóveis.',
    tecnico: 'Índice de fundos imobiliários da B3, em carteira teórica. Aqui aparece a variação do dia no fechamento.',
  },

  status_lucro_negativo: {
    titulo: 'Prejuízo nos últimos 12 meses',
    simples: 'A empresa teve prejuízo no período, por isso indicadores como o P/L não fazem sentido e não são mostrados.',
    tecnico: 'Lucro líquido de 12 meses negativo: indicadores que dependem do lucro ficam sem valor.',
  },

  status_nao_se_aplica: {
    titulo: 'Não se aplica',
    simples: 'Este indicador não faz sentido para este tipo de empresa, então não há número a mostrar.',
    tecnico: 'Indicador sem base de cálculo para o tipo de empresa ou de ativo.',
  },

  status_historico_insuficiente: {
    titulo: 'Histórico insuficiente',
    simples: 'Ainda não há dados suficientes para calcular este número com segurança.',
    tecnico: 'Série com menos pontos do que a janela exige (252 pregões no beta, 127 na rentabilidade de 6 meses).',
  },

  status_indisponivel: {
    titulo: 'Indisponível',
    simples: 'O dado não foi publicado ou não pôde ser obtido hoje. Não é zero: é a falta de informação.',
    tecnico: 'Valor ausente na fonte. Nunca é tratado como zero nos cálculos.',
  },

  status_calibracao_nao_conferida: {
    titulo: 'Calibração não conferida',
    simples: 'O modelo ainda não passou na checagem que mede se seus números batem com a realidade passada. Por isso, o número não aparece.',
    tecnico: 'Checagem de calibração do modelo pendente; a saída fica oculta até ser conferida.',
  },

  ptax: {
    titulo: 'PTAX (dólar oficial)',
    simples: 'É a cotação oficial do dólar em reais, calculada pelo Banco Central a partir de quatro consultas feitas durante o dia.',
    tecnico: 'Média das quatro janelas de consulta do Banco Central ao mercado de câmbio, usada como referência de contratos.',
  },

  selic: {
    titulo: 'Selic',
    simples: 'É a taxa básica de juros do Brasil, decidida pelo Banco Central. Quando ela sobe, deixar o dinheiro aplicado em renda fixa rende mais e pegar empréstimo fica mais caro.',
    tecnico: 'Taxa básica de juros definida pelo Copom (meta, SGS 432). Referência para o CDI e para o custo de capital das empresas.',
  },

  mediana: {
    titulo: 'Mediana',
    simples: 'É o valor do meio de uma lista ordenada. Metade das empresas fica abaixo dele e metade fica acima, então um valor muito fora da curva não distorce o resultado.',
    tecnico: 'Percentil 50 da distribuição. Mais robusta a valores extremos do que a média.',
  },

  percentil: {
    titulo: 'Percentil',
    simples: 'Mostra em que posição um número está entre todos os outros. O 25º percentil quer dizer que 25% das ações têm valor menor que ele.',
    tecnico: 'Valor abaixo do qual cai a fração indicada das observações do conjunto comparado.',
  },

  p_p: {
    titulo: 'Pontos percentuais (p.p.)',
    simples: 'É a diferença entre duas porcentagens. Se a taxa foi de 10% para 12%, subiu 2 pontos percentuais, e não 2%.',
    tecnico: 'Diferença aritmética entre duas taxas expressas em porcentagem.',
  },

  subsetor: {
    titulo: 'Subsetor',
    simples: 'É uma divisão menor dentro de um setor. Por exemplo, dentro de finanças há bancos e seguradoras.',
    tecnico: 'Nível intermediário da classificação setorial da B3, entre o setor econômico e o segmento.',
  },

  acao_on: {
    titulo: 'Ação ON (ordinária)',
    simples: 'É a ação que dá direito a voto nas decisões da empresa. O ticker termina em 3, como em PETR3.',
    tecnico: 'Ação ordinária, com direito a voto em assembleia. Sufixo 3 no código de negociação.',
  },

  acao_pn: {
    titulo: 'Ação PN (preferencial)',
    simples: 'É a ação que costuma ter prioridade no recebimento de proventos, mas em geral sem direito a voto. O ticker termina em 4, como em PETR4.',
    tecnico: 'Ação preferencial, com preferência na distribuição de proventos. Sufixo 4 no código de negociação.',
  },

  dividendo: {
    titulo: 'Dividendo',
    simples: 'É a parte do lucro que a empresa reparte com quem tem ações dela. Entra na conta do investidor sem desconto de imposto para pessoa física.',
    tecnico: 'Provento distribuído a partir do lucro líquido, isento de imposto de renda para a pessoa física.',
  },

  jcp: {
    titulo: 'JCP (juros sobre capital próprio)',
    simples: 'É outra forma de a empresa repartir lucro com os acionistas. Funciona como o dividendo, mas com um imposto retido na fonte.',
    tecnico: 'Remuneração do capital próprio dedutível do imposto da empresa; retenção de 15% de IR na fonte para a pessoa física.',
  },

  data_com: {
    titulo: 'Data com',
    simples: 'É o último dia em que quem comprar a ação ainda tem direito ao provento anunciado. Quem compra depois dessa data fica sem ele.',
    tecnico: 'Último pregão em que a ação é negociada com direito ao provento. No pregão seguinte, ela passa a ser negociada "ex".',
  },

  tom_noticias: {
    titulo: 'Tom das notícias',
    simples: 'Resume se as manchetes do dia falam mais de coisas boas, ruins ou neutras. Um programa lê cada manchete e escolhe um desses três tons.',
    tecnico: 'Classificação de cada manchete pelo FinBERT em positivo, neutro ou negativo; o tom médio vai de −1 a +1. Não mede o efeito no preço.',
  },

  regra: {
    titulo: 'Regra',
    simples: 'É uma comparação fixa de um número da empresa com um limite, como "P/L abaixo da mediana do setor". A regra não opina: só diz se a condição foi verdadeira.',
    tecnico: 'Predicado com limite definido antes da análise, avaliado sobre os campos do pacote do último pregão.',
  },

  regras_acenderam: {
    titulo: 'O que são as checagens',
    simples: 'Cada checagem é uma regra com limite fixo. Ela dá resultado quando a condição foi verdadeira, com os dados do último pregão. As outras ficam sem resultado. Há três tipos: a favor, atenção e contexto.',
    tecnico: 'Conjunto de regras cujo predicado retornou verdadeiro no pregão de referência. Campo ausente deixa a regra apagada; nunca é tratado como zero.',
  },

  ponto_forte: {
    titulo: 'A favor (ponto forte nos dados)',
    simples: 'Uma regra favorável deu resultado, como proventos acima do setor. É um fato dos dados, não uma indicação de compra.',
    tecnico: 'Sinal do tipo "forte": regra de leitura favorável acesa.',
  },

  ponto_atencao: {
    titulo: 'Atenção (ponto de atenção)',
    simples: 'Uma regra de cuidado deu resultado, como dívida alta ou queda forte. Pede uma olhada mais cuidadosa, mas não é aviso de venda.',
    tecnico: 'Sinal do tipo "atenção": regra de leitura desfavorável acesa.',
  },

  contexto: {
    titulo: 'Contexto',
    simples: 'É um fato que merece nota, mas não é bom nem ruim, como volume fora do normal ou oscilação baixa.',
    tecnico: 'Sinal do tipo "contexto": informativo, sem juízo de valor.',
  },

  b3: {
    titulo: 'B3',
    simples: 'É a bolsa de valores do Brasil, o lugar onde as ações das empresas brasileiras são compradas e vendidas.',
    tecnico: 'B3 S.A. Brasil, Bolsa, Balcão: bolsa onde são negociadas as ações, os fundos e os contratos acompanhados aqui.',
  },

  acao: {
    titulo: 'Ação',
    simples: 'É um pedacinho de uma empresa. Quem tem uma ação é dono de uma parte muito pequena dela e participa dos lucros.',
    tecnico: 'Valor mobiliário que representa uma fração do capital social. Aqui, as ações negociadas na B3.',
  },

  top5: {
    titulo: 'Top 5 para estudar hoje',
    simples: 'São cinco ações que as regras destacaram, para estudar. A ordem: mais pontos a favor, depois menos pontos de atenção e, no empate, mais negociação que o normal.',
    tecnico: 'Ordem por contagem de sinais favoráveis (maior primeiro), depois sinais de atenção (menor primeiro), depois volume relativo (maior primeiro) e ticker. Usa a saída do modelo quando ele está disponível.',
  },
};
