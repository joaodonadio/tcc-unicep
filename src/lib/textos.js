/**
 * Textos da interface. Todo texto que aparece na tela sai daqui.
 * O aviso legal fica só aqui: nenhum outro arquivo de src repete essa frase.
 * Voz: frases curtas, caixa normal, sem símbolos decorativos, o fato como sujeito.
 */

export const AVISO_FIXO = 'Conteúdo educativo: não é indicação de compra ou venda de ações.';

export const NAO_PREVE = 'Não prevê o preço de amanhã.';

/** Texto exibido no lugar de um valor ausente, por status do pacote. */
export const ROTULO_STATUS = {
  ok: '',
  lucro_negativo: 'Empresa com prejuízo nos últimos 12 meses',
  nao_se_aplica: 'Não se aplica',
  historico_insuficiente: 'Histórico insuficiente',
  indisponivel: 'Indisponível',
  calibracao_nao_conferida: '',
};

/** Estado da atualização diária. {fim} e {data} são substituídos pelo chamador. */
export const TEXTO_EXECUCAO = {
  ok: 'Atualizado em {fim}',
  parcial: 'Parte dos dados de hoje não pôde ser atualizada.',
  falhou: 'A atualização de hoje não chegou. A tela mostra o pregão de {data}.',
  em_andamento: 'Atualizando os dados.',
};

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

/**
 * Escolhe a variação de um texto pelo nível de leitura. Um texto que muda de nível é um objeto
 * `{ simples, tecnico }` (os valores podem ser textos ou funções). Qualquer outro valor passa direto.
 */
export function porNivel(valor, nivel) {
  if (valor && typeof valor === 'object' && !Array.isArray(valor) && ('simples' in valor || 'tecnico' in valor)) {
    return nivel === 'tecnico' ? (valor.tecnico ?? valor.simples) : (valor.simples ?? valor.tecnico);
  }
  return valor;
}

export const TEXTOS = Object.freeze({
  // nome do site em duas partes: a logo pinta o destaque na cor do Cotinha
  marca: { nome: 'CotAI', inicio: 'Cot', destaque: 'AI' },

  cabecalho: {
    identificacao: 'CotAI',
    avisoDetalhes: 'Ver o que houve',
    comoUsar: 'Como usar',
    navegacao: 'Páginas do site',
    paginas: {
      hoje: 'Hoje',
      mercado: 'Mercado',
      setores: 'Setores',
      acoes: 'Ações',
      proventos: 'Proventos',
      noticias: 'Notícias',
      modelo: 'O modelo',
      dados: 'Sobre os dados',
    },
    mais: 'Mais',
    maisRotulo: 'Mais páginas',
    pularConteudo: 'Pular para o conteúdo',
  },

  paginas: {
    hoje: 'Hoje',
    mercado: 'Mercado',
    acoes: 'Ações',
    proventos: 'Proventos',
    noticias: 'Notícias',
    noticiasTitulo: { simples: 'O que as notícias dizem?', tecnico: 'Tom das notícias' },
    poucasManchetes: {
      simples: (n, k) =>
        `Hoje o processamento classificou só ${n} ${n === 1 ? 'manchete' : 'manchetes'}, de ${k} ${k === 1 ? 'empresa' : 'empresas'}. O resultado do tom vale pouco com tão poucas notícias.`,
      tecnico: (n, k) => `Só ${n} ${n === 1 ? 'manchete classificada' : 'manchetes classificadas'}, de ${k} ${k === 1 ? 'empresa' : 'empresas'}. O tom vale pouco com amostra tão pequena.`,
    },
    noticiasIntro: {
      simples: 'Um programa lê as manchetes do dia e diz se cada uma é boa, neutra ou ruim para a empresa.',
      tecnico: 'Manchetes do último pregão classificadas pelo FinBERT, agregadas por tom e por empresa.',
    },
    modelo: 'O modelo',
    modeloIntro: 'De onde vêm os dados, como o modelo experimental funciona, se ele acerta e quem ajudou a construir este projeto.',
    dados: 'Sobre os dados',
    setores: 'Setores',
    setoresIntro: 'Setor é um grupo de empresas do mesmo ramo. Veja quais subiram e quais caíram.',
    tituloDocumento: (pagina) => `${pagina} · CotAI`,
  },

  comoUsar: {
    titulo: { simples: 'Um passeio rápido pela CotAI', tecnico: 'Para quem é e como usar' },
    publico: {
      simples: 'Feito para quem nunca investiu e quer entender como a bolsa de valores funciona, no seu ritmo e com palavras do dia a dia.',
      tecnico: 'Para quem investe na B3 e quer acompanhar o mercado e os indicadores das empresas.',
    },
    nivel: {
      texto: {
        simples: 'Prefere explicações mais simples ou mais técnicas? Troque aqui, ou depois no botão Leitura, no alto.',
        tecnico: 'Explicações simples ou técnicas: troque aqui ou, a qualquer hora, no botão Leitura, no alto.',
      },
    },
    comoNavegar: {
      simples: 'Para usar, é só clicar no que te interessa. Estas são as telas principais:',
      tecnico: 'Clique no item de interesse para abrir a tela. Abaixo, as principais:',
    },
    passos: {
      simples: [
        { titulo: 'Veja o Top 5', detalhe: 'As cinco ações para estudar hoje, logo abaixo.' },
        { titulo: 'Mercado', detalhe: 'Como foi o dia na bolsa, índice a índice.' },
        { titulo: 'Setores', detalhe: 'Quais grupos de empresas subiram e quais caíram.' },
        { titulo: 'Ações', detalhe: 'A ficha de cada empresa, em perguntas simples.' },
        { titulo: 'Proventos', detalhe: 'Quem vai pagar dinheiro aos acionistas em breve.' },
      ],
      tecnico: [
        { titulo: 'Top 5', detalhe: 'Cinco ações para estudar hoje, logo abaixo.' },
        { titulo: 'Mercado', detalhe: 'Índices e movimento do pregão.' },
        { titulo: 'Setores', detalhe: 'Variação média de cada grupo.' },
        { titulo: 'Ações', detalhe: 'Ficha com múltiplos, dívida e proventos.' },
        { titulo: 'Proventos', detalhe: 'Agenda de pagamentos e datas.' },
      ],
    },
    fechar: 'Fechar a explicação',
    dicas: {
      simples: [
        'Mostra como foi a bolsa e como estão as empresas.',
        'Não diz o que fazer com o dinheiro. A decisão é sua.',
      ],
      tecnico: [
        'Reúne dados de mercado e das empresas.',
        'Apoia a sua análise. A decisão continua sendo sua.',
      ],
    },
    dicaTermo: {
      simples: { antes: 'Toque no sublinhado, como ', termo: 'dividendo', depois: ', para entender.' },
      tecnico: { antes: 'Toque num termo, como ', termo: 'dividendo', depois: ', para ver a definição.' },
    },
    dicionario: {
      titulo: { simples: 'Palavras que vão aparecer', tecnico: 'Termos usados no painel' },
      verbetes: {
        simples: [
          { termo: 'pregão', significado: 'Um dia de negociação na bolsa.' },
          { termo: 'B3', significado: 'A bolsa de valores do Brasil.' },
          { termo: 'ações', significado: 'Pedaços de uma empresa.' },
        ],
        tecnico: [
          { termo: 'pregão', significado: 'Sessão de negociação da bolsa.' },
          { termo: 'B3', significado: 'Operadora da bolsa brasileira.' },
          { termo: 'ações', significado: 'Frações do capital de uma empresa.' },
        ],
      },
    },
  },

  termo: {
    fechar: 'Fechar a explicação',
  },

  leitura: {
    rotulo: 'Leitura',
    botao: 'Leitura',
    explicacoes: 'Explicações',
    simples: 'Simples',
    tecnica: 'Técnico',
    dicaSimples: 'Explica tudo, para quem nunca investiu.',
    dicaTecnica: 'Mais números e termos de mercado.',
    texto: 'Tamanho do texto',
    menor: 'A−',
    maior: 'A+',
    diminuir: 'Diminuir o texto',
    aumentar: 'Aumentar o texto',
    zoomAtual: (pct) => `${pct}%`,
    voltarNormal: 'Voltar ao normal',
    animacoes: 'Animações',
    movLigadas: 'Ligadas',
    movDesligadas: 'Desligadas',
    avisoTitulo: 'Seu computador está com as animações desligadas',
    avisoFrase: 'Este site tem animações que ajudam a entender os números. Você pode ligá-las só aqui.',
    avisoLigar: 'Ligar neste site',
    avisoManter: 'Manter desligadas',
  },

  regras: {
    resumo: 'Como as regras funcionam e quais deram resultado',
    resumoGeral: 'Como as regras funcionam e quais são',
    resumoCheck: (n) => `Como funcionam as ${n} checagens`,
    linkRegras: 'regras',
    passos: [
      {
        titulo: 'Compare',
        texto: {
          simples:
            'Um número da empresa é comparado com um limite fixo, como "P/L abaixo da mediana do setor". A checagem não opina nem prevê nada: só confere a condição.',
          tecnico: 'Um campo do pacote do último pregão é comparado com um limite fixo, definido antes da análise.',
        },
      },
      {
        titulo: 'Aponta algo ou não',
        texto: {
          simples:
            'Se a condição é verdadeira no último pregão, a checagem aponta algo. Se o dado falta, ela fica sem resultado: nunca se chuta um valor.',
          tecnico: 'Verdadeira: predicado verdadeiro no pregão de referência. Campo ausente ou com status diferente de ok: sem resultado.',
        },
      },
    ],
    placarLegenda: (n, total) => `${n} de ${total} checagens apontaram algo no último pregão`,
    deTotal: (n) => `de ${n}`,
    semReferencia: 'Sem referência',
    tipos: {
      forte: { nome: 'A favor', texto: 'Um ponto favorável nos dados.' },
      atencao: { nome: 'Atenção', texto: 'Um ponto que pede cuidado.' },
      contexto: { nome: 'Contexto', texto: 'Um fato que merece nota, sem ser bom nem ruim.' },
    },
    acendeuHoje: 'apareceu no último pregão',
    apagada: 'apagada no último pregão',
    linkGlossario: 'O que são as checagens?',
  },

  dia: {
    ibovespa: 'Ibovespa',
    termometro: { simples: 'Termômetro do dia', tecnico: 'Tom geral do pregão' },
    manchetesTitulo: { simples: 'As manchetes, tom por tom', tecnico: 'Manchetes por tom' },
    noticiasNota: {
      simples: 'Quem classifica é um programa que lê textos de economia (FinBERT). Ele pode errar.',
      tecnico: 'FinBERT-PT-BR: classificação de cada manchete do dia em positiva, neutra ou negativa.',
    },
    manchetesPositivas: 'Positivas',
    manchetesNeutras: 'Neutras',
    manchetesNegativas: 'Negativas',
    tonsManchetes: 'Tom das manchetes',
    palavraLidas: (n) => (n === 1 ? 'manchete lida' : 'manchetes lidas'),
    semManchetes: {
      simples: 'Nenhuma manchete foi lida neste pregão. Quando houver, ela aparece aqui.',
      tecnico: 'Nenhuma manchete classificada neste pregão.',
    },
    semManchetesTom: 'Nenhuma manchete deste tom.',
    empresasTitulo: { simples: 'Quais empresas estão nas notícias?', tecnico: 'Manchetes por empresa' },
    empresasNota: {
      simples: 'São as empresas com mais manchetes neste pregão. Toque no código para abrir a ficha da empresa.',
      tecnico: 'Empresas com mais manchetes no pregão. O ticker abre a ficha.',
    },
    // texto da linha para leitor de tela: "PETR3 e PETR4: 129 manchetes, 30 positivas, ..."
    empresaResumoSr: (nomes, total, positivas, neutras, negativas) =>
      `${nomes}: ${total} ${total === 1 ? 'manchete' : 'manchetes'}, ${positivas} ${positivas === 1 ? 'positiva' : 'positivas'}, ${neutras} ${neutras === 1 ? 'neutra' : 'neutras'}, ${negativas} ${negativas === 1 ? 'negativa' : 'negativas'}`,
    predominio: {
      positivas: 'Mais positivas',
      neutras: 'Mais neutras',
      negativas: 'Mais negativas',
      empate: 'Empate entre os tons',
    },
    semProventos: 'Nenhum pagamento marcado para as próximas semanas.',
    pagamento: (data) => `pagamento em ${data}`,
    sentimento: {
      otimista: { simples: 'Notícias animadoras', tecnico: 'Otimista' },
      otimista_moderado: { simples: 'Notícias um pouco animadoras', tecnico: 'Levemente otimista' },
      neutro: { simples: 'Notícias sem grande emoção', tecnico: 'Neutro' },
      pessimista_moderado: { simples: 'Notícias um pouco preocupantes', tecnico: 'Levemente pessimista' },
      pessimista: { simples: 'Notícias preocupantes', tecnico: 'Pessimista' },
    },
    mapa: 'O pregão por setor',
    mapaIntro: 'Cada bloco é uma ação; o tom mostra quanto ela subiu ou caiu no dia. Toque numa ação para abrir a ficha.',
    mapaSubiram: (subiram, total) => `${subiram} de ${total} subiram`,
    mapaMedia: (v) => `${v} em média`,
    mapaSemMedia: 'sem média no dia',
    mapaSemDado: 'sem dado',
    mapaVariacaoDia: (v) => `${v} no dia`,
    mapaRegrasFavor: (n) => (n === 1 ? '1 regra a favor' : `${n} regras a favor`),
    mapaRegrasAtencao: (n) => (n === 1 ? '1 de atenção' : `${n} de atenção`),
    mapaBloco: (cabeca, variacao, sinais) => (sinais ? `${cabeca}: ${variacao}. ${sinais}.` : `${cabeca}: ${variacao}.`),
    mapaEscala: ['−4% ou mais', '−2%', '0', '+2%', '+4% ou mais'],
    mapaCirculada: 'Mais papéis negociados do setor no dia.',
    legendaCirculada: 'Canto marcado: a ação com mais papéis negociados no setor, no dia.',
    erro: 'Não deu para carregar os dados do pregão agora. Tente de novo em alguns minutos.',
    abreNovaAba: '(abre em nova aba)',
    falhasProventos: (n) => `Não foi possível ler os proventos de ${n} ação(ões); a agenda pode estar incompleta.`,
    proventosCarregando: 'Buscando os proventos das ações…',
    proventosErro: 'Agenda indisponível',
    mostrarTodasManchetes: (n) => `Mostrar todas as ${n} manchetes`,
    mostrarMenosManchetes: 'Mostrar menos manchetes',
  },

  proventos: {
    titulo: { simples: 'Quem paga proventos', tecnico: 'Proventos' },
    porAcao: 'por ação',
    dataComCurta: (d) => `data-com ${d}`,
    intro: {
      simples:
        'Provento é a parte do lucro que a empresa divide com quem tem a ação. Veja quem paga em breve e quem mais pagou.',
      tecnico: 'Dividendos e JCP das ações acompanhadas: agenda de pagamentos e ranking por dividend yield em 12 meses.',
    },
    resumo: {
      guia: {
        simples: 'Em resumo: quem paga em breve, quanto paga e em que dia.',
        tecnico: 'Resumo da agenda de pagamentos e do ranking.',
      },
      proximo: { simples: 'Próximo a pagar', tecnico: 'Próximo pagamento' },
      proximoSemValor: 'valor por ação não informado',
      proximoData: 'paga em',
      marcados: { simples: 'Quantos pagamentos vêm', tecnico: 'Pagamentos marcados' },
      marcadosADefinir: (n) => `+ ${n} com data a definir`,
      mesPico: { simples: 'Mês com mais pagamentos', tecnico: 'Mês de pico' },
      mesPicoApoio: (qtd) => (qtd === 1 ? '1 pagamento' : `${qtd} pagamentos`),
      topo: { simples: 'Quem mais pagou em 12 meses', tecnico: 'Maior dividend yield, 12 meses' },
      topoApoio: 'do preço da ação',
    },
    graficoTitulo: { simples: 'Quantos pagamentos vêm por mês', tecnico: 'Pagamentos por mês' },
    graficoRotulo: 'Pagamentos',
    graficoDescricao: 'Quantidade de pagamentos de dividendos e JCP marcados para cada mês.',
    graficoVazio: {
      simples: 'Nenhuma empresa marcou pagamento para os próximos meses.',
      tecnico: 'Sem pagamentos marcados nos próximos meses.',
    },
    rankingTitulo: { simples: 'Quem mais pagou em 12 meses', tecnico: 'Dividend yield, 12 meses' },
    rankingComoLer: {
      simples: 'De cada R$ 100 do preço da ação, quanto voltou em um ano.',
      tecnico: 'Proventos pagos em 12 meses sobre o preço atual.',
    },
    rankingAviso: 'Pagamento passado não garante pagamento futuro.',
    rankingRolagem: 'Lista de quem mais pagou',
    rankingErro: 'Ranking indisponível',
    rankingCarregando: 'Buscando quem mais pagou…',
    rankingVazio: {
      simples: 'Nenhuma ação tem proventos informados nos últimos 12 meses.',
      tecnico: 'Sem dividend yield informado.',
    },
    termoDataCom: 'Data-com',
    agendaNota: {
      simples: 'último dia para ter a ação e receber.',
      tecnico: 'último dia com direito ao provento.',
    },
    agendaTitulo: 'Próximos pagamentos',
    verTodos: (n) => `Ver todos (${n})`,
    verMenos: 'Ver menos',
    mesPagamentos: (n) => (n === 1 ? '1 pagamento' : `${n} pagamentos`),
    notaListaAberta: 'Valores por ação. A data-com de cada pagamento está na ficha da ação.',
    aDefinirCurto: (n) => `Também há ${n} com data a definir.`,
    prazo: (dias) => (dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`),
    comoLer: {
      grafico: 'Cada barra é um mês; quanto mais alta, mais pagamentos.',
    },
    passo1Titulo: 'Ter a ação na ',
    passo1Termo: 'data-com',
    passo2Titulo: 'A empresa marca o pagamento',
    passo3Titulo: 'O dinheiro cai na conta',
    valorNaoInformado: 'valor não informado',
    agendaRolagem: 'Lista de próximos pagamentos',
    calendarioTitulo: { simples: 'Calendário de proventos', tecnico: 'Alertas de proventos' },
    calendarioDica: {
      simples: 'Toque num dia para ver quem paga ou marca a data-com.',
      tecnico: 'Pagamentos e datas-com marcados; toque num dia para listar.',
    },
    legendaPagamento: 'Pagamento',
    mesAnterior: 'Mês anterior',
    proximoMes: 'Próximo mês',
    meses: [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ],
    diasSemanaCurto: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
    diasSemanaLongo: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
    celulaComEventos: (data, qtd, com) => {
      const partes = [];
      if (qtd) partes.push(qtd === 1 ? '1 pagamento' : `${qtd} pagamentos`);
      if (com) partes.push(com === 1 ? '1 data-com' : `${com} datas-com`);
      return `${data}: ${partes.join(' e ')}`;
    },
    listaDoDia: (data) => `Proventos em ${data}`,
    outrosDiasDoMes: 'Mais neste mês',
    mesSemPagamento: {
      simples: 'Nenhuma empresa marcou pagamento neste mês.',
      tecnico: 'Sem pagamentos neste mês.',
    },
  },

  acoes: {
    intro: 'Todas as ações do pregão, agrupadas por setor.',
    dicaFicha: {
      simples: 'Dados fundamentalistas (os números da empresa): toque no código da ação que quiser ver.',
      tecnico: 'Dados fundamentalistas: toque no código do ativo para abrir a ficha completa.',
    },
    buscaRotulo: 'Procurar ação',
    buscaPlaceholder: 'Código ou nome, ex.: PETR4 ou Petrobras',
    buscaContagem: (n) => `${n} ${n === 1 ? 'ação encontrada' : 'ações encontradas'}`,
    buscaVazia: 'Nenhuma ação com esse código ou nome.',
  },

  acerto: {
    titulo: 'O modelo acerta?',
    intro: 'Antes de confiar numa lista, veja como ela foi no passado: as 5 ações do modelo, lado a lado com o acaso.',
    acaso: 'Acaso',
    modelo: 'Modelo',
    esperaTitulo: 'Ainda não dá para saber',
    esperaTexto: 'O acerto aparece quando o modelo tiver histórico, sempre comparado com o acaso, mesmo quando perde dele.',
    resultado: (taxa, dias) =>
      `Em ${dias} ${dias === 1 ? 'pregão' : 'pregões'}, ${taxa} das ações que o modelo escolheu renderam mais que o Ibovespa.`,
    acimaDoAcaso: 'Acima do acaso.',
    abaixoDoAcaso: 'Abaixo do acaso.',
    dentroDoAcaso: 'Dentro da faixa do acaso: ainda não dá para separar acerto de sorte.',
    erro: 'Não deu para carregar o histórico do modelo agora.',
  },

  modelo: {
    abertura: {
      titulo: 'Um projeto maior por trás da tela',
      tituloAcento: 'por trás da tela',
      camadas: {
        interface: 'A interface',
        coleta: 'Coleta diária',
        processamento: 'Processamento dos indicadores',
        modelo: 'Modelo experimental',
      },
      destaque: 'Esta é a interface do TCC: a ponta visível de um trabalho que roda todo dia útil.',
      texto:
        'Por trás dela há uma coleta diária de dados, um processamento que calcula os indicadores e um modelo experimental.',
      fecho: 'A interface não coleta dados nem calcula indicadores. Ela lê o resultado e o explica em português simples.',
    },
    fluxo: {
      titulo: 'Como os dados chegam aqui',
      intro: 'Em todo dia útil, os dados passam por quatro etapas antes de aparecer nesta tela.',
      lista: 'Etapas do caminho dos dados',
      etapas: [
        {
          chave: 'coleta',
          nome: 'Coleta',
          horario: '08:00',
          texto: 'Reúne os dados públicos do pregão anterior.',
          entra: 'Fontes públicas',
          sai: 'Dados crus',
          fontes: [
            'Preços, índices e balanços: B3 e empresas',
            'Juros (CDI) e dólar: Banco Central',
            'Notícias, com o tom lido pelo FinBERT',
          ],
        },
        {
          chave: 'processamento',
          nome: 'Processamento',
          horario: '08:25',
          texto: 'Calcula os indicadores e monta os 8 pacotes de dados.',
          entra: 'Dados crus',
          sai: 'Indicadores prontos',
        },
        {
          chave: 'api',
          nome: 'API de leitura',
          horario: '',
          texto: 'Entrega os pacotes. Só permite leitura: nada é gravado por aqui.',
          entra: 'Os pacotes',
          sai: 'Leitura liberada',
        },
        {
          chave: 'interface',
          nome: 'Esta interface',
          horario: '08:30',
          texto: 'Lê os pacotes e explica cada número em português simples.',
          entra: 'A leitura da API',
          sai: 'Números explicados',
        },
      ],
      pacotesRotulo: 'Os 8 pacotes',
      entraRotulo: 'Entra',
      saiRotulo: 'Sai',
      vivoAtualizacao: {
        antes: 'Última atualização: número ',
        depois: (inicio, fim) => (inicio && fim ? `, de ${inicio} a ${fim}.` : '.'),
      },
      vivoRegistros: { antes: '', depois: ' registros nos pacotes enviados' },
      vivoAcoes: { antes: '', depois: ' ações acompanhadas' },
    },
    experimento: {
      titulo: 'O modelo experimental',
      intro: {
        simples:
          'O modelo é uma calculadora que aprende com o passado. Ele não adivinha o futuro: só estima uma chance.',
        tecnico:
          'Classificador experimental treinado com dados históricos. A saída é uma probabilidade, não uma previsão de preço.',
      },
      diagramaRotulo: 'Do que o modelo lê até o Top 5',
      diagrama: [
        {
          chave: 'entradas',
          nome: 'O que entra',
          itens: ['Tom das notícias', 'Preços e volume', 'Dólar e petróleo', 'Balanços'],
        },
        { chave: 'modelo', nome: 'Modelo', itens: ['Aprende com o passado'] },
        { chave: 'chance', nome: 'Chance', itens: ['De cada ação render mais que o Ibovespa'] },
        { chave: 'top5', nome: 'Top 5 do modelo', itens: ['As 5 maiores chances, medidas contra o acaso'] },
      ],
      guia: {
        simples: 'Antes de ver se ele acerta, veja o que o modelo faz.',
        tecnico: 'Antes do histórico de acerto: entrada, aprendizado, régua e limites do modelo.',
      },
      cartoes: [
        {
          chave: 'preve',
          titulo: 'O que prevê',
          texto: {
            simples: [
              'Se a ação vai render mais que o ',
              { termo: 'ibovespa', texto: 'Ibovespa' },
              ' no próximo pregão. Sempre como chance, nunca certeza.',
            ],
            tecnico: [
              'Classificação por ação: o retorno do pregão seguinte fica acima do ',
              { termo: 'ibovespa', texto: 'Ibovespa' },
              '. A saída é uma probabilidade.',
            ],
          },
        },
        {
          chave: 'le',
          titulo: 'O que lê',
          itens: {
            simples: ['Notícias (FinBERT)', 'Preços', 'Volume', 'Dólar', 'Petróleo', 'Balanços'],
            tecnico: ['Tom das notícias (FinBERT-PT-BR)', 'Preços', 'Volume', 'Dólar', 'Brent', 'Indicadores de balanço'],
          },
        },
        {
          chave: 'aprende',
          titulo: 'Como aprende',
          texto: {
            simples: 'Estuda 5 anos de pregões.',
            tecnico: 'Árvores XGBoost com 5 anos de pregões, validadas mês a mês com dados anteriores ao período testado.',
          },
          pilula: {
            simples: 'Modelo em teste: as 5 ações dele são medidas, mas ainda não aparecem no site. O Top 5 da página inicial vem das regras.',
            tecnico: 'Modelo provisório em teste: o Top 5 dele entra no histórico de acerto, mas não é exibido.',
          },
        },
        {
          chave: 'acerta',
          titulo: 'Como mede o acerto',
          texto: {
            simples: 'A régua é o acaso, calculado a cada dia: quanto uma escolha ao acaso acertaria.',
            tecnico: [
              'Fração das ações do Top 5 que superaram o ',
              { termo: 'ibovespa', texto: 'Ibovespa' },
              ', comparada à ',
              { termo: 'faixa_acaso', texto: 'faixa do acaso' },
              ' (10 mil sorteios). A referência é o acaso médio de cada dia.',
            ],
          },
          regua: true,
        },
        {
          chave: 'naoE',
          titulo: 'O que não é',
          texto: {
            simples: 'Não é indicação para o seu dinheiro. É um teste acadêmico, e quando perde para o acaso, a página mostra.',
            tecnico: 'Experimento acadêmico, sem finalidade de aconselhamento. Resultados abaixo do acaso também são exibidos.',
          },
        },
      ],
    },
    mencoes: {
      titulo: 'Menções honrosas',
      texto: 'Pessoas que contribuíram para este projeto.',
      nomes: ['João Augusto Donadio', 'Vinícius Nordi Esperança', 'Cristina Ivo de Medeiros'],
    },
  },

  modelos3d: {
    titulo: 'Entenda com um objeto',
    detalhesTecnico: 'Ver o objeto 3D',
    arraste: 'Arraste para girar',
    carregando: 'Carregando o objeto 3D',
    semNumero: 'Sem número para medir.',
    legenda: {
      balanca: 'Balança: de um lado o caixa da empresa, do outro a dívida.',
      moedas: 'Pilha de moedas: cada moeda é um ano de lucro que o preço da ação pede.',
      cofrinho: 'Cofrinho: moedas de proventos pagas por ano a cada R$ 100 da ação.',
      pendulo: 'Pêndulos: o da ação balança mais ou menos que o da bolsa.',
    },
    frases: {
      balanca: {
        pergunta: 'Deve muito?',
        ausencia: 'Sem número para medir. Isso acontece, por exemplo, com bancos e seguradoras.',
        caixaLiquido: 'Não. Tem mais caixa do que dívida.',
        comparacao: { menos: 'Menos que o setor', igual: 'Parecido com o setor', mais: 'Mais que o setor' },
        comSetor: (cmp, n, setor) => `${cmp}: ${n} anos de lucro operacional para quitar a dívida; o setor, ${setor}.`,
        semSetor: (n) => `${n} anos de lucro operacional para quitar a dívida.`,
      },
      moedas: {
        pergunta: 'Está cara?',
        ausencia: 'Teve prejuízo, então não dá para medir.',
        comparacao: { menos: 'Mais barata que o setor', igual: 'Parecida com o setor', mais: 'Mais cara que o setor' },
        comSetor: (cmp, n, setor) => `${cmp}: custa ${n} anos de lucro; o setor custa ${setor}.`,
        semSetor: (n) => `Custa ${n} anos de lucro.`,
      },
      cofrinho: {
        pergunta: 'Paga proventos?',
        ausencia: 'Sem número de proventos para medir.',
        comSetor: (valor, setor) => `${valor} por ano a cada R$ 100; no setor, ${setor}.`,
        semSetor: (valor) => `${valor} por ano a cada R$ 100.`,
      },
      pendulo: {
        pergunta: 'Oscila muito?',
        ausencia: 'Sem número de oscilação para medir.',
        comparacao: { menos: 'Menos que a bolsa', igual: 'Parecido com a bolsa', mais: 'Mais que a bolsa' },
        resposta: (cmp, beta) => `${cmp}: beta ${beta}. A bolsa vale 1,00.`,
      },
    },
    rotulos: {
      caixa: 'Caixa',
      divida: 'Dívida',
      setor: (anos) => `Setor: ${anos} anos`,
      acaoAnos: (t, anos, cortada) => `${t}: ${anos} anos${cortada ? ' (pilha cortada)' : ''}`,
      setorReais: (valor) => `Setor: ${valor}`,
      acaoReais: (t, valor) => `${t}: ${valor}`,
      bolsa: 'Bolsa: 1,00',
      acaoBeta: (t, beta) => `${t}: ${beta}`,
    },
  },
  ficha: {
    voltar: 'Voltar às ações',
    voltarAnterior: 'Voltar à página anterior',
    naoEncontrada: 'Ação não encontrada',
    naoEncontradaTexto: (t) => `Não há ação com o código ${t} entre as acompanhadas.`,
    separador: ' · ',
    perguntas_rotulo: 'Perguntas sobre a ação',
    fundamentos: {
      titulo: 'Dados fundamentalistas',
      rotulos: {
        pl: 'P/L',
        pvp: 'P/VP',
        roe: 'ROE',
        dividend_yield: 'Dividend yield',
        dl_ebitda: 'Dívida líq./EBITDA',
      },
      verPergunta: (rotulo, valor) => `${rotulo}: ${valor}. Abrir a pergunta sobre ${rotulo}`,
      setor: (valor) => `Setor: ${valor}`,
      carregando: 'Carregando os dados da empresa.',
      datas: 'Datas da empresa',
      ultimoBalanco: (fim, entrega) => `Último balanço: ${fim}${entrega ? ` (entregue ${entrega})` : ''}`,
      balancoIndisponivel: 'Último balanço: indisponível',
      proventoCarregando: 'Próximo provento: carregando',
      proventoIndisponivel: 'Próximo provento: indisponível',
      proximoProvento: (tipo, valor, data) => `Próximo provento: ${tipo} de ${valor} em ${data}`,
      proximoProventoSemValor: (tipo, data) => `Próximo provento: ${tipo} em ${data}`,
      semProventoFuturo: 'Nenhum provento futuro anunciado',
    },
    perguntas: {
      regras: {
        titulo: { simples: 'O que as checagens mostram?', tecnico: 'Regras acesas' },
        curto: 'Regras',
        intro: {
          simples:
            'Cada checagem compara um número da empresa com um limite fixo. Se o número passa do limite, a checagem aponta algo. Os limites de todas elas estão no fim desta página.',
          tecnico: 'Regras de limite fixo sobre os indicadores. Os limites de cada regra estão no fim da página.',
        },
      },
      divida: {
        titulo: { simples: 'Ela deve muito?', tecnico: 'Endividamento' },
        curto: 'Dívida',
        intro: {
          simples:
            'Dever não é, por si só, um problema. O que importa é se a empresa ganha caixa suficiente para pagar o que deve. Veja o tamanho da dívida e compare com outras empresas do mesmo ramo.',
          tecnico: 'Dívida líquida/EBITDA e dívida líquida/patrimônio contra a mediana do setor.',
        },
      },
      cara: {
        titulo: { simples: 'Está cara?', tecnico: 'Múltiplos de preço' },
        curto: 'Está cara?',
        intro: {
          simples:
            'Veja quanto se paga pela ação em relação ao lucro da empresa e ao que ela vale no papel. Uma ação barata pode estar barata por um bom motivo, então compare também com o setor.',
          tecnico: 'P/L e P/VP contra a mediana do setor, com o ROE como contexto.',
        },
      },
      proventos: {
        titulo: { simples: 'Ela paga dinheiro a quem tem ações?', tecnico: 'Proventos' },
        curto: 'Proventos',
        intro: {
          simples:
            'Veja quanto dinheiro a empresa dividiu com quem tem ações dela. Por exemplo: de cada R$ 100 do preço da ação, quanto voltou em um ano.',
          tecnico: 'Dividend yield, payout e histórico anual de dividendos e JCP.',
        },
      },
      oscila: {
        titulo: { simples: 'O preço balança muito?', tecnico: 'Volatilidade' },
        curto: 'Oscilação',
        intro: {
          simples:
            'Uma ação que balança muito sobe e desce depressa, o que pode dar susto. Veja como esta se mexe em comparação com a bolsa inteira.',
          tecnico: 'Volatilidade de 20 pregões e beta contra o Ibovespa.',
        },
      },
      preco: {
        titulo: { simples: 'Como foi o preço?', tecnico: 'Preço e retorno' },
        curto: 'Preço',
        intro: {
          simples:
            'O preço da ação no fim de cada dia, ao lado da bolsa no mesmo período. Assim dá para ver se ela andou melhor ou pior que o mercado.',
          tecnico: 'Fechamento diário e retorno acumulado contra o Ibovespa.',
        },
      },
      noticias: {
        semHorario: 'sem horário',
        titulo: { simples: 'O que dizem as notícias?', tecnico: 'Fluxo de notícias' },
        curto: 'Notícias',
        intro: {
          simples:
            'Manchetes recentes sobre a empresa. Um programa lê cada uma e diz se o tom é bom, neutro ou ruim para ela.',
          tecnico: 'Manchetes recentes com as probabilidades do FinBERT por classe.',
        },
      },
    },
    aFavor: (n) => `A favor (${n})`,
    cuidado: (n) => `Pontos de atenção (${n})`,
    contexto: (n) => `Contexto (${n})`,
    colunaAcao: 'Esta ação',
    colunaSetor: 'Mediana do setor',
    semRegras: {
      simples: 'Nenhuma checagem deu resultado para esta ação no último pregão. Isso não é bom nem ruim: só não houve nada a destacar.',
      tecnico: 'Nenhuma regra se aplicou a esta ação no último pregão.',
    },
    limitesRegras: (lista) => `Limites destas regras: ${lista.join('; ')}.`,
    contra: 'O que pesa contra',
    setor: (valor) => `No setor: ${valor}`,
    origem: (fonte) => `Fonte: ${fonte}`,
    periodo: 'Período',
    periodos: { '1S': '1 semana', '1M': '1 mês', '6M': '6 meses', '1A': '1 ano' },
    comparar: 'Comparar com o Ibovespa',
    balancos: 'Balanços trimestrais',
    historico: 'Histórico do indicador',
    retornos: 'Retorno por período',
    retornosTabela: {
      periodos: { d1: '1 dia', s1: '1 semana', m1: '1 mês', m6: '6 meses', a1: '1 ano' },
      linhas: {
        precoAcao: 'Preço da ação',
        comProventos: 'Ação com proventos',
        ibovespa: 'Ibovespa',
        setor: 'Setor, sem a empresa',
      },
    },
    semNoticias: {
      simples: 'Nenhuma manchete sobre esta empresa nos últimos dias.',
      tecnico: 'Sem manchetes da empresa nos últimos dias.',
    },
    semProventos: {
      simples: 'Esta ação não tem nenhum pagamento de dinheiro aos acionistas registrado.',
      tecnico: 'Nenhum provento registrado para esta ação.',
    },
    tipoAcao: {
      ON: 'Ordinária (ON): dá direito a voto',
      PN: 'Preferencial (PN): prioridade nos proventos, sem voto',
    },
    setorFraco: 'O setor tem poucas empresas na lista; a comparação com ele vale menos.',
    negociacao: {
      titulo: 'Como foi a negociação',
      volume: 'Volume do dia',
      mediana: 'Mediana de 20 pregões',
      volumeAusente: 'Volume do dia indisponível para esta ação.',
      oscilacao: 'Oscilação em 20 pregões',
      semOscilacao: 'Sem dado de oscilação para esta ação.',
      faixas: { baixa: 'Baixa', moderada: 'Moderada', alta: 'Alta' },
      faixa: (f) => `Faixa: ${f}`,
      oscilaMais: (p) => `Oscila mais que ${p}% das ações acompanhadas.`,
      volumeMaiorQue: (p) => `Volume maior que em ${p}% dos pregões do último ano.`,
      volumePercentil: (p) => `Volume do dia: percentil ${p} no último ano`,
      regua: 'Posição entre as ações acompanhadas',
      // nota quando a API segurou algum número desta ação (ex.: RAIZ4 em nov/2026)
      retido: {
        simples:
          'Por que falta número aqui: a API confere cada dado antes de publicar. Quando um valor sai muito do normal ou não tem base suficiente, ele fica de fora, para não mostrar informação errada.',
        tecnico:
          'Campos com histórico insuficiente ou indisponíveis: a validação da API retém valores fora do normal ou sem janela completa, em vez de publicar um número possivelmente errado.',
      },
    },
    tecnicoNota: 'Detalhes técnicos aparecem com as explicações em Técnico.',
    // Leitura por nível: Simples ensina cada número; Técnica mostra tabelas densas.
    indicadores: {
      origemRotulo: 'De onde vem:',
      origemLista: 'De onde vem cada número',
      origem: {
        pl: 'Preço de fechamento do pregão (B3) dividido pelo lucro dos últimos 12 meses, dos balanços da empresa.',
        pvp: 'Valor de mercado no fechamento do pregão (B3) dividido pelo patrimônio do último balanço da empresa.',
        roe: 'Lucro dos últimos 12 meses dividido pelo patrimônio, nos balanços da empresa.',
        dividend_yield: 'Proventos com data-com nos últimos 12 meses (B3) divididos pelo preço de fechamento.',
        payout: 'Proventos pagos em 12 meses divididos pelo lucro dos mesmos 12 meses, nos balanços da empresa.',
        margem_bruta: 'Balanços trimestrais da empresa, somando os últimos 12 meses.',
        margem_liquida: 'Balanços trimestrais da empresa, somando os últimos 12 meses.',
        ebitda: 'Balanços trimestrais da empresa, somando os últimos 12 meses.',
        dl_ebitda: 'Dívida líquida do último balanço dividida pelo EBITDA dos últimos 12 meses, nos balanços da empresa.',
        dl_pl: 'Dívida líquida e patrimônio do último balanço da empresa.',
        beta: 'Retornos diários da ação e do Ibovespa nos últimos 252 pregões (B3).',
        volatilidade: 'Retornos diários dos últimos 20 pregões (B3).',
        volume_relativo: 'Volume do pregão comparado com a mediana dos 20 pregões anteriores (B3).',
      },
      comoLer: 'Como ler',
      tabela: 'Indicadores desta pergunta, com a mediana do setor',
      regiao: 'Tabela de indicadores',
      colIndicador: 'Indicador',
      colAcao: 'Ação',
      colSetor: 'Mediana do setor',
      colDiferenca: 'Diferença',
      colSituacao: 'Situação',
      situacao: { abaixo: 'abaixo', acima: 'acima', emLinha: 'em linha' },
      comparacao: {
        abaixo: (setor) => `Fica abaixo do que as outras empresas do mesmo ramo costumam ter (${setor}).`,
        acima: (setor) => `Fica acima do que as outras empresas do mesmo ramo costumam ter (${setor}).`,
        emLinha: (setor) => `Fica parecido com o que as outras empresas do mesmo ramo costumam ter (${setor}).`,
      },
      extras: {
        ebitda12m: 'EBITDA 12 meses',
        margemEbitda: 'Margem EBITDA',
        dividaLiquida: 'Dívida líquida',
        caixaLiquido: 'Caixa líquido',
        sim: 'Sim',
        nao: 'Não',
        volatilidadePosicao: 'Volatilidade 20 dias, percentil',
        volatilidadePosicaoValor: (p) => `${p}º entre as ações`,
        volumeMediana: 'Mediana de volume em 20 pregões',
      },
    },
    frases: {
      subiu: (p) => `subiu ${p}`,
      caiu: (p) => `caiu ${p}`,
      estavel: 'ficou estável',
      precoIbov: (periodo, acao, ibov) => `O preço ${acao} em ${periodo}; o Ibovespa ${ibov} no mesmo período.`,
      precoSo: (periodo, acao) => `O preço ${acao} em ${periodo}.`,
      volume: (dia, mediana) =>
        `No último pregão foram negociadas ${dia} ações; a mediana dos últimos 20 pregões é ${mediana}.`,
      oscilacao: (faixa) => `A oscilação desta ação nos últimos 20 pregões está na faixa ${faixa}.`,
      proventosAno: (ano, valor) => `Em ${ano}, a empresa pagou ${valor} por ação.`,
      proventosAnoAnterior: (ano, valor, anoAnt, valorAnt) =>
        `Em ${ano}, a empresa pagou ${valor} por ação; em ${anoAnt}, ${valorAnt}.`,
      historico: (rotulo, de, para, dataDe, dataAte) =>
        `${rotulo} passou de ${de} em ${dataDe} para ${para} em ${dataAte}.`,
      resultado: (tri, receita, lucro) =>
        `No balanço de ${tri}, a receita dos últimos 12 meses foi ${receita} e o lucro líquido, ${lucro}.`,
      resultadoSoReceita: (tri, receita) => `No balanço de ${tri}, a receita dos últimos 12 meses foi ${receita}.`,
      dividaVezes: (tri, vezes) => `No balanço de ${tri}, a dívida líquida equivalia a ${vezes} o EBITDA de 12 meses.`,
      dividaCaixa: (tri) => `No balanço de ${tri}, a empresa tinha mais caixa do que dívida.`,
      dividaAnterior: (tri, vezes) => `Um ano antes, em ${tri}, era ${vezes}.`,
    },
    tec: {
      porAno: 'Proventos por ano',
      porAnoRegiao: 'Tabela de proventos por ano',
      colAno: 'Ano',
      colDividendo: 'Dividendo',
      colJcp: 'JCP',
      colOutros: 'Outros',
      colTotal: 'Total',
      colResumo: 'Total no resumo',
      colPayout: 'Payout',
      percentil: (p) => `Percentil ${p} entre as ações`,
      ultimosPagamentos: 'Últimos pagamentos',
      itemPagamento: (data, tipo, valor) => `${data}: ${tipo}, ${valor} por ação`,
      tomNoticia: 'Tom',
      manchete: 'Manchete',
      probabilidades: 'FinBERT: positiva / neutra / negativa',
      probabilidadesValor: (p, n, g) => `${p} / ${n} / ${g}`,
      noticiasRegiao: 'Manchetes com as probabilidades do FinBERT',
      tomExplica:
        'O tom é a leitura que o FinBERT, um modelo de linguagem, faz da manchete: positiva, neutra ou negativa para a empresa. Não é previsão de preço.',
    },
    barraAcao: 'Esta ação',
    barraSetor: 'Setor',
    variacao: {
      alta: (p) => `+${p} no dia`,
      queda: (p) => `−${p} no dia`,
      estavel: 'Estável no dia',
    },
    indicador: 'Indicador',
    serie: 'Série',
    precoTitulo: 'Preço de fechamento',
    precoTexto: 'Cada ponto é o preço da ação no fim de um dia de negociação.',
    rentabilidadeTitulo: 'Rentabilidade: ação e Ibovespa',
    rentabilidadeTexto: 'As duas linhas começam em 0% no primeiro dia. Quanto mais alta a linha, mais aquele investimento rendeu, já contando o dinheiro pago aos acionistas.',
    semIbov: 'Série do Ibovespa indisponível.',
    setorNoPeriodo: (t) => `Setor, sem a empresa, no período: ${t}`,
    graficoIndisponivel: 'Gráficos indisponíveis',
    semSerie: 'Sem série diária para esta ação.',
    historicoCurto: 'Histórico insuficiente para este período.',
    balancosIndisponiveis: 'Balanços indisponíveis',
    semBalancos: 'Sem balanços publicados para esta ação.',
    balancosRegiao: 'Balanços por trimestre',
    setorSemEmpresa: 'Setor sem a empresa',
    volumeTitulo: 'Volume negociado por dia',
    volumeTexto: 'Barra alta: dia em que muita gente comprou e vendeu esta ação.',
    resultadoTitulo: 'Receita e lucro em 12 meses',
    receitaSerie: 'Receita em 12 meses',
    lucroSerie: 'Lucro líquido em 12 meses',
    dividaEbitdaTitulo: 'Dívida líquida sobre EBITDA',
    dividaEbitdaTexto:
      'Quantos anos de geração de caixa pagariam a dívida. Abaixo de zero: a empresa tem mais caixa do que dívida.',
    dividaEbitdaSerie: 'Dívida líquida / EBITDA',
    balancosNota: 'Valores em reais: bi = bilhões, mi = milhões. Margens, ROE e payout em porcentagem.',
    entregue: (d) => `entregue em ${d}`,
    historicoIndisponivel: 'Histórico indisponível',
    historicoVazio: 'Ainda não há publicações guardadas para esta ação.',
    historicoDias: (n, t) =>
      `Há ${n} ${n === 1 ? 'dia' : 'dias'} de publicações guardadas para ${t}. Guardamos um registro por pregão; a lista cresce a cada dia.`,
    historicoSoUm: (d) => `Só há o pregão de ${d} guardado. A comparação aparece quando houver mais dias.`,
    historicoUmDia: 'Com um dia só ainda não dá para desenhar a evolução.',
    historicoSemDados: 'Não há dados guardados para este indicador.',
    historicoAno: {
      titulo: 'Histórico de 1 ano',
      abas: 'Indicador do histórico de 1 ano',
      atual: 'Valor atual',
      minima: 'Mínima do ano',
      maxima: 'Máxima do ano',
      mediana: 'Mediana do período',
      percentil: 'Percentil do valor atual',
      percentilValor: (p) => `${p}º entre os valores do ano`,
      descricao: (rotulo, ticker) => `Gráfico de ${rotulo} de ${ticker} no último ano.`,
      semValor: (indicador, de, ate, motivo) => `Sem ${indicador} de ${de} a ${ate}: ${motivo}`,
      semDado: 'Sem valores deste indicador no último ano.',
    },
    comoEstava: 'Como estava em',
    pregaoDe: 'Pregão de',
    emData: (d) => `Em ${d}`,
    maisRecente: (d) => `Mais recente (${d})`,
    diferenca: 'Diferença',
    evolucao: 'Evolução de um indicador',
    carregandoNoticias: 'Carregando notícias…',
    noticias: {
      titulo: (t) => `Notícias de ${t}`,
      indisponivel: 'Contagem de notícias indisponível para esta empresa',
      soTotal: (q) => `${q} ${q === 1 ? 'notícia' : 'notícias'}`,
      resumo: (q, p, n, g) =>
        `${q} ${q === 1 ? 'notícia' : 'notícias'}: ${p} ${p === 1 ? 'positiva' : 'positivas'}, ` +
        `${n} ${n === 1 ? 'neutra' : 'neutras'} e ${g} ${g === 1 ? 'negativa' : 'negativas'}`,
      erro: 'Não foi possível carregar as notícias desta empresa.',
      ver: (n) => `Ver todas as ${n} notícias`,
      primeiras: 'Mostrar só as primeiras',
      novaAba: '(abre em nova aba)',
      tom: { positivo: 'Positiva', neutro: 'Neutra', negativo: 'Negativa' },
      janelaPeriodo: (ini, fim) => `Notícias publicadas entre ${ini} e ${fim}`,
      janela: {
        noite: 'noite: depois do fechamento até 8h',
        pregao: 'pregão',
        sem_horario: 'horário não informado',
      },
      finbert: (p, n, g) => `FinBERT: positiva ${p} · neutra ${n} · negativa ${g}`,
    },
    proventos: {
      indisponiveis: 'Proventos indisponíveis',
      abertura: {
        antes: 'Os valores são por ação e somados pelo ano da ',
        termo: 'data-com',
        depois: '.',
      },
      grafico: 'Proventos por ação em cada ano',
      semRegistro: 'sem registro',
      resumoConf: (v) => `resumo: ${v}`,
      payoutConf: (v) => `payout: ${v}`,
      semRegistroAno: (ano) => `${ano}: sem registro na lista de proventos.`,
      detalheAno: (ano, dividendo, jcp, total) =>
        `${ano}: dividendos ${dividendo}, JCP ${jcp}, total ${total} por ação.`,
      payoutNota: 'Payout: parte do lucro do ano que virou proventos.',
      legenda: 'Legenda do gráfico',
      dividendo: 'Dividendo',
      jcp: 'JCP',
      outros: 'Outros',
      explicaDividendo: 'Parte do lucro paga em dinheiro aos acionistas.',
      explicaJcp:
        'Juros sobre capital próprio: outra forma de repassar lucro aos acionistas, com imposto descontado na fonte.',
      pagamentos: 'Pagamentos de proventos',
      pagamentosCaption: 'Pagamentos, do mais recente para o mais antigo',
      dataCom: 'Data-com',
      pagamento: 'Pagamento',
      tipo: 'Tipo',
      valorPorAcao: 'Valor por ação',
      verTodos: (n) => `Ver todos os ${n} pagamentos`,
      verMenos: 'Mostrar só os mais recentes',
    },
  },

  grafico: {
    rotuloPadrao: 'Preço',
    descricaoSerie: (de, ate) => `Série de preços do período: de ${de} a ${ate}.`,
    descricaoMulti: (rotulo, de, ate) => `${rotulo}: de ${de} a ${ate}`,
    dupla: (rotulo, valor) => `${rotulo} ${valor}`,
    tipRotulo: (rotulo) => `${rotulo}: `,
    semDado: 'sem dado',
    semDados: 'Sem dados suficientes para desenhar o gráfico.',
    descricaoBarras: (quantidade) => `Gráfico de barras com ${quantidade} itens.`,
    tabelaLegenda: 'Dados do gráfico',
  },

  estados: {
    carregando: 'Carregando os dados do pregão.',
    erroTitulo: 'Não deu para carregar esta parte',
    erroTexto: 'Os dados não chegaram. O resto da página continua funcionando.',
    erroPaginaTitulo: 'Esta página não abriu',
    erroPaginaTexto: 'Algo deu errado ao montar a página. Recarregue para tentar de novo.',
    erroVersaoNova: 'O site foi atualizado enquanto você navegava. Recarregue para abrir a versão nova.',
    tentarDeNovo: 'Tentar de novo',
    vazio: 'Nada para mostrar aqui hoje.',
  },

  setores: {
    carregando: 'Carregando os setores.',
    vazio: 'Os setores não estão disponíveis.',
    semDado: 'Sem dado',
    periodoGrupo: 'Período',
    periodos: { d1: 'Último pregão', s1: '1 semana', m1: '1 mês', m6: '6 meses', a1: '1 ano' },
    periodosExtenso: { d1: 'No último pregão', s1: 'Em 1 semana', m1: 'Em 1 mês', m6: 'Em 6 meses', a1: 'Em 1 ano' },
    periodoAjuda: 'Escolha o período. A lista e os cartões mostram a variação nesse período.',
    rankingTitulo: 'Quem subiu e quem caiu',
    comoLerRanking:
      'Cada barra mostra a variação média das ações do setor. Para a direita, o setor subiu; para a esquerda, caiu. Toque no nome para ir ao cartão dele.',
    rankingLista: 'Variação média de cada setor, do que mais subiu ao que mais caiu',
    cena3d: {
      dica: 'Troque o setor arrastando o objeto, passando o mouse na lista ou com as setas do teclado.',
      verSetor: 'Ver o setor',
      mediaDoSetor: 'Variação média no período',
      palco: 'Vitrine dos setores',
      papel: 'carrossel',
    },
    resumo: (quando, subiram, cairam) =>
      `${quando} ${plural(subiram, 'setor subiu', 'setores subiram')} e ${cairam} ${cairam === 1 ? 'caiu' : 'caíram'}.`,
    resumoMaior: (nome, valor) => `O que mais subiu foi ${nome} (${valor}).`,
    resumoMenor: (nome, valor) => `O que mais caiu, ${nome} (${valor}).`,
    cartoesTitulo: 'Cada setor, de perto',
    cartoesTexto: {
      simples: 'Cada ponto é uma ação: círculo subiu, losango caiu. Toque no nome do setor para ver as ações dele.',
      tecnico: 'Cada ponto é uma ação, na cor da variação no período. Tracejado: o preço mudou de escala.',
    },
    subiuMais: 'Subiu mais',
    caiuMais: 'Caiu mais',
    subiuMenos: 'Subiu menos',
    caiuMenos: 'Caiu menos',
    semanaErro: 'A semana não carregou',
    maiorAltaMedia: 'Maior alta média do período',
    maiorQuedaMedia: 'Maior queda média do período',
    menorAltaMedia: 'Menor alta média do período',
    menorQuedaMedia: 'Menor queda média do período',
    pilulasDoSetor: (nome) => `Ações de ${nome}`,
    resumoPontos: (n, subiram, cairam) =>
      `${n} ${n === 1 ? 'ação' : 'ações'} do setor: ${subiram} subiram e ${cairam} caíram no período.`,
    pontoAcao: (ticker, empresa, situacao) => `${[ticker, empresa].filter(Boolean).join(', ')}, ${situacao}`,
    variacaoNoPeriodo: (variacao) => `${variacao} no período`,
    emRevisaoAcao: 'preço mudou de escala',
    listaTitulo: 'Um cartão por setor',
    subiramDe: (subiram, n) => `${subiram} de ${n} subiram`,
    subiramAcoes: (subiram, n) =>
      subiram === 0
        ? `nenhuma das ${n} ${n === 1 ? 'ação' : 'ações'} subiu`
        : `${subiram === 1 ? 'subiu' : 'subiram'} ${subiram} de ${n} ${n === 1 ? 'ação' : 'ações'}`,
    descricoes: {
      'Consumo não Cíclico': 'Comida, bebida, higiene e remédios: coisas que a gente compra mesmo quando o orçamento aperta.',
      Financeiro: 'Bancos, seguradoras e corretoras: as empresas que guardam, emprestam e cuidam do dinheiro.',
      'Consumo Cíclico': 'Lojas, carros, viagens e roupas: coisas que a gente compra quando a renda e a confiança permitem.',
      'Utilidade Pública': 'Energia elétrica, água e saneamento: serviços que a gente usa todo dia.',
      'Bens Industriais': 'Fábricas, máquinas, construção e transporte: empresas que fornecem equipamentos e serviços para outras empresas.',
      'Materiais Básicos': 'Mineração, papel, químicos e aço: matéria-prima que vira base de muitos produtos.',
      'Petróleo, Gás e Biocombustíveis': 'Petróleo, gás e combustíveis como o etanol: a energia que move carros, caminhões e navios.',
      Saúde: 'Hospitais, laboratórios, clínicas e planos de saúde: tudo que cuida da saúde das pessoas.',
      'Tecnologia da Informação': 'Software, sistemas e serviços digitais: os programas e a nuvem que as empresas usam.',
      Comunicações: 'Telefonia, internet e TV por assinatura: as empresas que levam conexão para casa e para o celular.',
    },
    tomNoticias: 'Tom das notícias do dia',
    tomFatias: { positivas: 'positivas', neutras: 'neutras', negativas: 'negativas' },
    tom: { positivas: 'mais positivas', negativas: 'mais negativas', equilibrado: 'equilibrado' },
    mapaTitulo: 'Todas as ações por setor, no último pregão',
    velas: {
      titulo: 'Como cada setor andou no período',
      comoLer:
        'Cada vela é um setor. O corpo vai do começo ao fim do período e o pavio marca o ponto mais alto e o mais baixo. A vela é feita com o fechamento de cada dia, pela média das ações do setor: a máxima e a mínima são de fechamento, não de dentro do pregão.',
      notaDia: 'No último pregão a vela só tem o fechamento anterior e o do dia, por isso fica sem pavio.',
      legenda: 'Como ler o gráfico',
      legendaCorpo: 'Corpo: do começo ao fim do período',
      legendaPavio: 'Pavio: ponto mais alto e mais baixo',
      legendaSinal: 'Sinal: + subiu, − caiu',
      tabela: 'Vela de cada setor',
      descricao: (n) => `Gráfico de velas de ${n} setores no período escolhido, feito com os fechamentos de cada dia.`,
      semDados: (lista) => `Sem dado no período: ${lista}`,
      carregando: 'Carregando as velas dos setores.',
      erro: 'Não foi possível montar as velas dos setores agora.',
      tooltip: {
        acoes: (n) => `${n} ${n === 1 ? 'ação' : 'ações'}`,
        periodo: (inicio, fim) => `De ${inicio} a ${fim}`,
        subiu: 'Subiu',
        caiu: 'Caiu',
        estavel: 'Ficou estável',
        comeco: 'Começo',
        maxima: 'Ponto mais alto',
        minima: 'Ponto mais baixo',
        nota: 'Pelos fechamentos de cada dia',
      },
    },
  },

  mercado: {
    titulo: 'O mercado',
    intro: 'Quanto rendeu cada índice do mercado, no dia e nos últimos meses.',
    carregando: 'Carregando os dados do mercado.',
    cdi: 'CDI',
    cdi12m: 'acumulado em 12 meses',
    semDado: 'sem dado',
    semSoDia: 'Só o valor do dia',
    noDia: 'no dia',
    noPeriodo: 'no período',
    graficoTitulo: 'Quanto rendeu cada índice',
    graficoTexto: 'Rentabilidade acumulada no período, a partir do primeiro dia da janela.',
    periodoGrupo: 'Período',
    comparacaoGrupo: 'Índices no gráfico',
    comparacaoIndisponivel: (rotulos) => `Não foi possível carregar: ${rotulos}.`,
    periodos: { '1s': '1 semana', '1m': '1 mês', '6m': '6 meses', '1a': '1 ano' },
    comparacao: {
      IPCA: 'IPCA',
      IDIV: 'IDIV dividendos',
      SMLL: 'SMLL small caps',
      IFIX: 'IFIX fundos',
      IVVB11: 'IVVB11 S&P 500',
    },
    comparacaoLonga: {
      IPCA: 'IPCA, inflação oficial',
      IDIV: 'Dividendos (IDIV)',
      SMLL: 'Small caps (SMLL)',
      IFIX: 'Fundos imobiliários (IFIX)',
      IVVB11: 'S&P 500 em reais (IVVB11)',
    },
    limiteSeries: 'Ligue e desligue os índices que quiser. As linhas tracejadas são as comparações.',
    semSelecao: 'Escolha um ou mais índices para ver as linhas.',
    resumoTitulo: (periodo) => `Em ${periodo}`,
    resumoLista: (periodo) => `Rentabilidade de cada série em ${periodo}`,
    leituraCem: {
      simples: (final) => `R$ 100 viraram R$ ${final}`,
      tecnico: (final) => `Valor final de R$ 100: R$ ${final}`,
    },
    semSerie: 'Sem histórico suficiente para este período.',
    indicesTitulo: 'Como foi cada índice',
    grupos: { bolsa: 'Bolsa', juros: 'Juros e inflação', cambio: 'Câmbio e petróleo' },
    indices: {
      IBOV: { nome: 'Ibovespa', explicacao: { simples: 'as ações mais negociadas da B3', tecnico: 'principal índice da B3, em pontos' } },
      DOLAR: { nome: 'Dólar', explicacao: { simples: 'quanto custa um dólar em reais', tecnico: 'cotação do dólar em reais' } },
      BRENT: { nome: 'Petróleo Brent', explicacao: { simples: 'preço do petróleo de referência, em dólares', tecnico: 'petróleo Brent, em dólares por barril' } },
      CDI: { nome: 'CDI, 12 meses', explicacao: { simples: 'juro de referência da renda fixa', tecnico: 'taxa CDI acumulada em 12 meses' } },
      IPCA: { nome: 'IPCA, 12 meses', explicacao: { simples: 'inflação oficial dos últimos 12 meses', tecnico: 'IPCA acumulado em 12 meses' } },
      IDIV: { nome: 'IDIV', explicacao: { simples: 'empresas que mais pagam proventos', tecnico: 'ações com maior pagamento de proventos' } },
      SMLL: { nome: 'SMLL', explicacao: { simples: 'empresas menores da bolsa', tecnico: 'small caps: empresas de menor porte' } },
      IFIX: { nome: 'IFIX', explicacao: { simples: 'fundos imobiliários negociados na bolsa', tecnico: 'fundos imobiliários (FIIs) da B3' } },
      IVVB11: { nome: 'IVVB11', explicacao: { simples: 'ações dos EUA (S&P 500) em reais', tecnico: 'ETF que acompanha o S&P 500 em reais' } },
    },
    pregaoData: (data) => `Dados do pregão de ${data}.`,
    taxaDia: {
      simples: (taxa, data) => (data ? `Juros do dia: ${taxa} (${data})` : `Juros do dia: ${taxa}`),
      tecnico: (taxa, data) => (data ? `Taxa do dia: ${taxa} (${data})` : `Taxa do dia: ${taxa}`),
    },
    asterisco: '*',
    calculadoSr: 'calculado pela série histórica',
    calculadoNota: {
      simples: 'calculado pelo histórico do índice.',
      tecnico: 'calculado pela série histórica; ausente no pacote do dia.',
    },
    resumoAtivos: (n) => `${n} ${n === 1 ? 'ação acompanhada' : 'ações acompanhadas'}.`,
    estadoDia: { volatil: 'Dia volátil.', estavel: 'Dia estável.' },
    dolar: {
      titulo: { simples: 'Quanto custa o dólar', tecnico: 'Dólar (R$ por US$)' },
      apoio: 'Fechamento de cada pregão, em reais por dólar.',
      vazio: 'O histórico do dólar ainda não tem pregões para mostrar.',
      nota: {
        simples: 'O site junta o fechamento de cada dia num só gráfico.',
        tecnico: 'Série montada com as publicações diárias de mercado_dia.',
      },
      notaSerie: {
        simples: 'Cada ponto é o fechamento de um pregão, da série diária do dólar.',
        tecnico: 'Série diária USDBRL de series_diarias (fechamento em R$ por US$).',
      },
    },
    juros: {
      titulo: { simples: 'Juros hoje: Selic e CDI', tecnico: 'Juros: CDI anualizado e Selic' },
      tituloSerie: { simples: 'Selic, a taxa básica de juros', tecnico: 'Meta da Selic (histórico estimado pelo CDI)' },
      apoioSerie: {
        simples: 'O Copom, do Banco Central, revê a Selic a cada 45 dias, numa quarta-feira. O valor de hoje é a meta dele; o gráfico mostra a taxa estimada pelo CDI.',
        tecnico: 'Meta definida pelo Copom em 8 reuniões por ano. Histórico estimado pelo CDI diário: anualizado em 252 dias, + 0,10 p.p., arredondado a 0,25.',
      },
      tituloSeriePublicada: { simples: 'Selic, a taxa básica de juros', tecnico: 'Meta da Selic no período' },
      apoioSeriePublicada: {
        simples: 'O Copom, do Banco Central, revê a Selic a cada 45 dias, numa quarta-feira. O gráfico mostra a meta de cada dia.',
        tecnico: 'Meta definida pelo Copom em 8 reuniões por ano. Série diária da meta publicada em series_diarias (SELIC).',
      },
      mudancasTitulo: { simples: 'Quando a Selic mudou', tecnico: 'Mudanças da meta no período' },
      semMudanca: 'A Selic não mudou no período.',
      mudancaDesdeSr: 'a partir de',
      mudancaSr: { down: (de) => `caiu de ${de} para`, up: (de) => `subiu de ${de} para` },
      notaCdi: {
        simples: (cdi, data) => `CDI de hoje: ${cdi} ao ano${data ? ` (${data})` : ''}. A Selic fica cerca de 0,10 ponto acima.`,
        tecnico: (cdi, data) => `CDI anualizado${data ? ` em ${data}` : ''}: ${cdi} a.a. (base 252); spread típico de 0,10 p.p. para a meta.`,
      },
      graficoSerie: (de, ate, final) => `Selic ao longo do tempo, estimada pelo CDI, de ${de} a ${ate}; terminou em ${final} ao ano.`,
      graficoSeriePublicada: (de, ate, final) => `Meta da Selic ao longo do tempo, de ${de} a ${ate}; terminou em ${final} ao ano.`,
      apoio: {
        simples: 'A Selic é a taxa básica de juros do país. O valor de hoje é a meta que o Copom definiu. O gráfico é estimado pelo CDI, que anda colado nela.',
        tecnico: 'Meta da Selic publicada pelo Copom. O histórico é estimado pelo CDI do dia: anualizado em 252 dias úteis, + 0,10 ponto, arredondado ao múltiplo de 0,25.',
      },
      valorLegenda: {
        simples: (data) => (data ? `ao ano, meta vigente em ${data}` : 'ao ano, meta do Copom'),
        tecnico: (data) => (data ? `a.a., meta vigente em ${data}` : 'a.a., meta do Copom'),
      },
      selicIndisponivel: 'indisponível',
      selicSemDado: 'sem dado',
      cdiRotulo: { simples: 'CDI de hoje', tecnico: 'CDI anualizado' },
      cdiTexto: { simples: (taxa) => `${taxa} ao ano`, tecnico: (taxa) => `${taxa} a.a. (base 252)` },
      fatos: {
        simples: [
          { rotulo: 'Quem decide a Selic', texto: 'O Copom, o comitê do Banco Central que cuida dos juros.' },
          { rotulo: 'De quanto em quanto tempo', texto: 'Mais ou menos a cada 45 dias, sempre numa quarta-feira.' },
          { rotulo: 'E o CDI?', texto: 'É o juro que os bancos cobram entre si. Fica colado na Selic, um pouquinho abaixo.' },
        ],
        tecnico: [
          { rotulo: 'Copom', texto: 'Comitê de Política Monetária do Banco Central; define a meta da Selic.' },
          { rotulo: 'Reuniões', texto: '8 por ano, a cada 45 dias em média; decisão divulgada na quarta-feira.' },
          { rotulo: 'CDI x Selic', texto: 'O CDI acompanha a Selic efetiva, em geral 0,10 ponto abaixo da meta.' },
        ],
      },
      grafico: { simples: 'Taxa Selic ao longo do tempo, estimada', tecnico: 'Meta da Selic no período (estimada pelo CDI)' },
      vazio: 'O gráfico do histórico aparece quando a série do CDI chegar. O valor de hoje vem da meta do Copom.',
    },
    serieRotulo: (titulo, de, ate, final) => `${titulo}, de ${de} a ${ate}, terminou em ${final}.`,
  },

  eventos: {
    eleicao2026: {
      marca: 'Eleição',
      nota: {
        simples: '26/10/2026: primeiro pregão depois do 2º turno da eleição. A bolsa caiu tanto que a B3 pausou os negócios (circuit breaker).',
        tecnico: '26/10/2026: pregão seguinte ao 2º turno; Ibovespa −13,88% no dia, com circuit breaker acionado pela B3.',
      },
      aria: 'Marcação em 26/10/2026: pregão depois da eleição, com circuit breaker.',
    },
  },
  rodape: {
    assinatura: 'A bolsa explicada em palavras simples, com o Cotinha do lado.',
    projeto: 'Projeto acadêmico de TCC.',
    dados: (pregao, publicado) => `Dados do pregão de ${pregao}, publicados em ${publicado}.`,
    fonte: 'Os números vêm dos pacotes diários publicados pelo projeto.',
  },

  hoje: {
    titulo: {
      simples: (quando) => `Como foi a bolsa em ${quando}?`,
      tecnico: (quando) => `Pregão de ${quando}`,
    },
    tituloSemData: { simples: 'Como foi a bolsa no último dia?', tecnico: 'Último pregão' },
    erroTitulo: 'O pregão de hoje não carregou',
    erro: 'Os dados do dia não chegaram. Tente de novo em instantes.',
    estavel: 'Estável',
    numeros: { simples: 'Os números do dia, explicados', tecnico: 'Indicadores do dia' },
    fatos: {
      leadInicio: { simples: 'O Ibovespa fechou em', tecnico: 'Ibovespa fechou em' },
      leadPontos: 'pontos',
      leadVariacao: 'no dia',
      amplitude: { simples: 'Subiram e caíram', tecnico: 'Altas e baixas' },
      subiu: (n) => (n === 1 ? 'subiu' : 'subiram'),
      caiu: (n) => (n === 1 ? 'caiu' : 'caíram'),
      estaveis: (n) => (n === 1 ? 'estável' : 'estáveis'),
      maiorAlta: { simples: 'Quem mais subiu', tecnico: 'Maior alta' },
      maiorQueda: { simples: 'Quem mais caiu', tecnico: 'Maior queda' },
      dolar: { simples: 'Dólar no dia', tecnico: 'Dólar' },
      brent: { simples: 'Petróleo (Brent)', tecnico: 'Brent' },
    },
    fonte: {
      pacote: (itens, data) => `${itens}: pacotes do pregão de ${data}.`,
      itensPacote: 'Ibovespa, CDI, IPCA e altas e quedas',
      itensPacoteComDolar: 'Ibovespa, dólar, CDI, IPCA e altas e quedas',
    },
    variacaoAusente: 'Variação do dia indisponível',
    ibovespa: { simples: 'Como está a bolsa (Ibovespa)', tecnico: 'Ibovespa, var. diária' },
    dolar: { simples: 'Preço de 1 dólar em reais', tecnico: 'Dólar' },
    dolarPacote: 'Fechamento do pregão',
    dolarSemHistorico: 'Os dados do projeto trazem só o fechamento do dia, sem o histórico do dólar.',
    cdi: { simples: 'Quanto a renda fixa rendeu (CDI)', tecnico: 'CDI' },
    cdiNota: { simples: 'Nos últimos 12 meses', tecnico: 'Acumulado em 12 meses' },
    selicLinha: { simples: (taxa) => `Selic: ${taxa} ao ano`, tecnico: (taxa) => `Selic: ${taxa} a.a.` },
    selicNota: {
      simples: (data) => `Juro definido pelo Copom${data ? `, vigente em ${data}` : ''}`,
      tecnico: (data) => `Meta do Copom${data ? `, vigente em ${data}` : ''}`,
    },
    selicIndisponivel: 'Selic: indisponível',
    ipca: { simples: 'Quanto os preços subiram (IPCA)', tecnico: 'IPCA' },
    ipcaNota: {
      simples: (mes) => `Em 12 meses, até ${mes}`,
      tecnico: (mes) => `12 meses até ${mes}`,
    },
    amplitude: { simples: 'Quantas ações subiram e quantas caíram', tecnico: 'Amplitude, alta / queda' },
    amplitudeValor: (subiram, cairam) => `${subiram} / ${cairam}`,
    amplitudeNota: {
      simples: (total) => `Entre ${total} ações. O primeiro número é de quem subiu.`,
      tecnico: (total) => `De ${total} ações`,
    },
    graficoTitulo: { simples: 'A bolsa nos últimos 6 meses', tecnico: 'Ibovespa em 6 meses' },
    graficoDescricao: 'Fechamento diário do Ibovespa nos últimos 6 meses.',
    faixaSeisMeses: 'Faixa de 6 meses',
    faixaSeisMesesDescricao: (minimo, maximo) =>
      `Nos últimos 6 meses, o Ibovespa esteve entre ${minimo} e ${maximo} pontos.`,
    detalhes: (nome) => `Mais sobre: ${nome}`,
    mini: {
      ibovespa: (inicio, fim) => `Ibovespa nos últimos 6 meses: de ${inicio} a ${fim} pontos.`,
      valorPontos: (valor) => `${valor} pontos`,
      semDado: 'sem dado',
      cdi: (meses, ultimo) => `CDI de cada mês nos últimos ${meses} meses completos; no mais recente, rendeu ${ultimo}.`,
      ipca: (meses, ultimo) => `IPCA de cada mês nos últimos ${meses} meses, pela série do projeto; o mais recente foi ${ultimo}.`,
      ipcaPacote: (meses, ultimo) => `IPCA de cada mês nos últimos ${meses} meses, pelo mês de referência; o mais recente foi ${ultimo}.`,
      dolarSerie: (inicio, fim) => `Dólar pregão a pregão: de ${inicio} a ${fim}.`,
      amplitude: (subiram, cairam, estaveis) =>
        `Um ponto por ação. Subiram: ${subiram}. Caíram: ${cairam}.${estaveis != null ? ` Estáveis: ${estaveis}.` : ''}`,
      tom: (positivas, neutras, negativas) =>
        `Cem pontos, cada um vale 1% das manchetes. Positivas: ${positivas}. Neutras: ${neutras}. Negativas: ${negativas}.`,
    },
    legendaGrafico: {
      ibovespa: 'O gráfico mostra o fechamento de cada dia nos últimos 6 meses. A linha tracejada marca onde a janela começou.',
      dolar: 'Cada ponto é o fechamento de um pregão guardado. A linha tracejada marca o primeiro valor.',
      dolarSerie: 'Cada ponto é o fechamento de um pregão, da série diária do dólar. A linha tracejada marca o primeiro valor.',
      cdi: 'Cada barra é quanto o CDI rendeu em um mês completo. A barra em destaque é o mês mais recente.',
      ipca: 'Cada barra é o IPCA de um mês, calculado pela série de inflação do projeto. Barra para baixo é mês em que os preços caíram. A barra em destaque é o mês mais recente.',
      ipcaPacote: 'Cada barra é o IPCA de um mês, pelo mês de referência que o pacote do dia publica. Barra para baixo é mês em que os preços caíram. A barra em destaque é o mês mais recente.',
    },
    legendaAmplitude: { subiram: 'Subiram', estaveis: 'Estáveis', cairam: 'Caíram' },
    graficoIndisponivel: 'O gráfico não carregou agora.',
    verMercado: 'Ver o mercado',
    destaquesTitulo: { simples: 'Quem mais se mexeu no dia', tecnico: 'Destaques do dia' },
    maiorAlta: { simples: 'Subiu mais', tecnico: 'Maior alta' },
    maiorQueda: { simples: 'Caiu mais', tecnico: 'Maior queda' },
    volumeIncomum: { simples: 'Muita gente negociando', tecnico: 'Volume incomum' },
    vezesMediana: {
      simples: (vezes) => `${vezes} vezes o normal`,
      tecnico: (vezes) => `${vezes}× a mediana`,
    },
    verAcoes: 'Ver todas as ações',
    proventosTitulo: { simples: 'Quem vai pagar dinheiro em breve', tecnico: 'Próximos proventos' },
    legendaProventos: {
      antes: 'Cada pagamento tem uma ',
      termo: 'data-com',
      depois: ', o último dia para ter a ação e receber.',
    },
    legendaTom: {
      antes: 'O ',
      termo: 'tom',
      depois: ' diz se a manchete é boa, neutra ou ruim para a empresa.',
    },
    proventosVazio: {
      simples: 'Nenhuma empresa marcou pagamento para os próximos dias.',
      tecnico: 'Nenhum pagamento futuro na agenda.',
    },
    verProventos: 'Ver a agenda completa',
    noticiasTitulo: { simples: 'O que as notícias dizem?', tecnico: 'Tom das notícias' },
    semNoticias: {
      simples: 'O programa que lê as notícias ainda não classificou nenhuma manchete hoje.',
      tecnico: 'Sem notícias classificadas no dia.',
    },
    sentimento: {
      otimista: { simples: 'No geral, as notícias estão animadoras.', tecnico: 'Tom geral otimista.' },
      otimista_moderado: {
        simples: 'No geral, as notícias estão um pouco animadoras.',
        tecnico: 'Tom geral levemente otimista.',
      },
      neutro: { simples: 'No geral, as notícias estão sem grande emoção.', tecnico: 'Tom geral neutro.' },
      pessimista_moderado: {
        simples: 'No geral, as notícias estão um pouco preocupantes.',
        tecnico: 'Tom geral levemente pessimista.',
      },
      pessimista: { simples: 'No geral, as notícias estão preocupantes.', tecnico: 'Tom geral pessimista.' },
    },
    verNoticias: 'Ler as notícias',
    dolarConversao: (dolares) => `Pelo fechamento do dia, R$ 100 equivalem a US$ ${dolares}.`,
    graficoVariacao: { simples: 'em 6 meses', tecnico: 'var. em 6 meses' },
    volumeNota: {
      simples: 'O número com × diz quantas vezes a ação foi negociada a mais que num dia normal. O risco na barra marca o normal (1×).',
      tecnico: 'Múltiplo do volume do dia sobre a mediana; o traço marca 1×.',
    },
    quemE: (ticker, empresa) => `${ticker}: ${empresa}.`,
    tempoHoje: 'Hoje',
    tempoAte: (dias) => `em ${dias} dias`,
    tempoDescricao: (n, dias) => `${n === 1 ? '1 pagamento' : `${n} pagamentos`} nos próximos ${dias} dias.`,
    proventoDetalhe: (ticker, tipo, dataCom) => (dataCom ? `${ticker}: ${tipo}, data-com em ${dataCom}.` : `${ticker}: ${tipo}.`),
    legendaTomContagem: { positivas: 'Positivas', neutras: 'Neutras', negativas: 'Negativas' },
    tomTotal: (texto) => `${texto} no dia.`,
    tomContagens: (positivas, neutras, negativas) =>
      `${positivas} positivas, ${neutras} neutras e ${negativas} negativas.`,
  },

  top5Hoje: {
    tituloInicio: 'Top 5',
    tituloFim: 'para estudar hoje',
    apoio: 'Cinco ações que as regras destacaram hoje. Toque numa para ver o porquê.',
    apoioModelo: 'Cinco ações escolhidas pelo modelo em teste. Toque numa para ver o porquê.',
    listaRotulo: 'As cinco ações para estudar hoje',
    origemRegras: {
      simples: (total) =>
        `Olhamos ${total} regras em cada ação. Entram as com mais pontos a favor; no empate, as com menos pontos de atenção. O modelo de previsão ainda está em teste.`,
      tecnico: (total) =>
        `${total} regras fixas sobre o resumo do pregão e as notícias. Ordem: mais sinais a favor, menos sinais de atenção, maior volume relativo e, por fim, o código. O modelo de previsão ainda está em teste.`,
    },
    origemModelo: {
      simples:
        'Escolhidas e ordenadas pelo modelo de previsão, que ainda está em avaliação. A chance de cada ação fica oculta enquanto ele é conferido. Preço, gráfico e números vêm dos dados do dia.',
      tecnico:
        'Ordem do modelo de previsão, em avaliação. Chance oculta até a conferência. Preço, gráfico e números vêm dos dados do pregão.',
    },
    seloModelo: 'Em avaliação',
    avisosModelo: 'Avisos do modelo de hoje',
    // o que cada efeito de um motivo do modelo quer dizer (o texto do motivo vem do pacote)
    motivoModelo: {
      ajudou: {
        simples: 'Este ponto ajudou a ação a subir na ordem do modelo.',
        tecnico: 'Contribuição positiva para a pontuação do modelo neste pregão.',
      },
      atrapalhou: {
        simples: 'Este ponto puxou a ação para baixo na ordem do modelo.',
        tecnico: 'Contribuição negativa para a pontuação do modelo.',
      },
      neutro: {
        simples: 'Este ponto quase não mudou a ordem do modelo.',
        tecnico: 'Contribuição próxima de zero para a pontuação.',
      },
    },
    chance: (valor, acaso) => `Chance estimada ${valor}, acaso ${acaso}`,
    painelRotulo: 'Detalhes da ação escolhida',
    porQue: 'Por que está aqui',
    maisNaFicha: (quantidade) => `Mais ${quantidade} na ficha completa.`,
    escolhido: (ticker) => `Mostrando ${ticker}`,
    posicao: (numero) => `Posição ${numero}`,
    entenda: 'Entenda com um objeto',
    abasPainelRotulo: 'O que ver sobre a ação',
    abasRotulo: 'Escolha uma pergunta',
    abas: {
      balanca: 'Deve muito?',
      moedas: 'Está cara?',
      cofrinho: 'Paga proventos?',
      pendulo: 'Oscila muito?',
    },
    abrirFicha: 'Ver a ficha completa',
    erroTitulo: 'O Top 5 não carregou',
    erro: 'Os dados do dia não chegaram. Tente de novo em instantes.',
    vazio: 'Hoje nenhuma ação tem sinais suficientes nas regras para entrar na lista.',
    carregando: 'Separando as cinco ações de hoje…',
    comoEscolhemos: 'Como escolhemos',
    seisMesesRotulo: (ticker, inicio, fim) => `${ticker} nos últimos 6 meses: de ${inicio} a ${fim}.`,
    tomMotivo: { forte: 'A favor', atencao: 'Atenção', contexto: 'Para saber' },
    semMotivos: 'As regras não trouxeram pontos sobre esta ação hoje.',
    seisMesesTitulo: 'Preço nos últimos 6 meses',
    resumoMotivos: {
      forte: (n) => (n === 0 ? 'nenhum ponto a favor' : n === 1 ? '1 ponto a favor' : `${n} pontos a favor`),
      atencao: (n) => (n === 0 ? 'nenhum ponto de atenção' : n === 1 ? '1 ponto de atenção' : `${n} pontos de atenção`),
      contexto: (n) => (n === 1 ? '1 informação para saber' : `${n} informações para saber`),
    },
    // título de cada regra (ids de REGRAS em sugestoes.js): simples para quem começa; técnico = título do sinal
    tituloSinal: {
      volume_incomum: { simples: 'Foi bem mais negociada que o normal no último pregão', tecnico: 'Volume acima do normal' },
      queda_forte_dia: { simples: 'Caiu bastante no último pregão', tecnico: 'Queda forte no dia' },
      alta_forte_dia: { simples: 'Subiu bastante no último pregão', tecnico: 'Alta forte no dia' },
      desempenho_6m: {
        simples: 'Rendeu mais que a bolsa e o setor em 6 meses',
        tecnico: 'Desempenho acima do Ibovespa e do setor em 6 meses',
      },
      pl_baixo_roe_ok: {
        simples: 'Preço baixo perto do lucro, comparado ao setor',
        tecnico: 'P/L baixo com ROE em linha ou acima do setor',
      },
      dy_alto: { simples: 'Pagou aos acionistas mais que o setor no último ano', tecnico: 'Dividend yield alto para o setor' },
      divida_alta: { simples: 'Deve muito perto do que ganha', tecnico: 'Dívida alta em relação ao lucro operacional' },
      prejuizo_12m: { simples: 'Teve prejuízo no último ano', tecnico: 'Prejuízo nos últimos 12 meses' },
      queda_forte_mes: { simples: 'Caiu bastante no último mês', tecnico: 'Queda forte no mês' },
      oscila_pouco: { simples: 'O preço sobe e desce pouco', tecnico: 'Oscila pouco' },
      noticias_positivas: { simples: 'Notícias do dia em tom positivo', tecnico: 'Notícias com tom positivo' },
      noticias_negativas: { simples: 'Notícias do dia em tom negativo', tecnico: 'Notícias com tom negativo' },
      caixa_liquido: { simples: 'Tem mais dinheiro em caixa do que dívidas', tecnico: 'Caixa líquido' },
      payout_acima_lucro: {
        simples: 'Pagou aos acionistas mais do que lucrou no último ano',
        tecnico: 'Proventos acima do lucro',
      },
    },
  },

  dados: {
    titulo: { simples: 'De onde vêm os números?', tecnico: 'Sobre os dados' },
    linkRodape: 'Sobre os dados',
    carregando: 'Carregando a atualização dos dados.',
    semDado: {
      simples: 'Ainda não há registro de quando os números foram atualizados pela última vez.',
      tecnico: 'Não há registro da última atualização.',
    },
    ultima: 'Última atualização',
    pavio: {
      ok: 'Os dados chegaram completos.',
      parcial: 'Parte dos dados chegou nesta atualização.',
      falhou: 'A atualização falhou. Alguns números podem estar desatualizados.',
      desconhecida: 'Não dá para saber se os dados chegaram completos.',
    },
    situacaoPainel: {
      ok: 'Atualização concluída',
      parcial: 'Atualização parcial',
      falhou: 'Atualização com falha',
      desconhecida: 'Situação não informada',
    },
    secoes: {
      origens: 'Por onde os dados passam',
      pacotes: 'O que chegou nesta atualização',
      avisos: 'Avisos da coleta',
      fatosColeta: 'Como foi a coleta',
    },
    // Bloco recolhido para a equipe: pacotes e avisos da coleta, que o público não precisa ler.
    equipe: {
      titulo: 'Para quem mantém o projeto',
      texto: 'O que chegou em cada pacote e os avisos da coleta. Serve para a equipe conferir a atualização; para entender os números, não é preciso abrir.',
      abrir: 'Ver detalhes da equipe',
    },
    fatos: {
      status: 'Status',
      pregao: 'Pregão',
      dadosAte: 'Dados até',
      publicado: 'Publicado em',
      atualizacao: 'Atualização do dia',
      periodo: 'Início e fim',
    },
    valores: {
      publicado: (dia, hora) => `${dia} às ${hora}`,
      numero: (n) => `nº ${n}`,
      periodo: (inicio, fim) => `${inicio} a ${fim}`,
    },
    itens: { um: 'item', varios: 'itens' },
    selos: {
      atualizado: 'Atualizado',
      semMudanca: { simples: 'Sem mudança nesta atualização', tecnico: 'Sem mudança' },
      retirados: (n) => `Retirados: ${n}`,
    },
    semQuantidade: 'Quantidade não informada',
    cru: (registros, removidos) => `Registros: ${registros}; removidos: ${removidos}`,
    origens: {
      coleta: {
        titulo: 'Coleta',
        texto: {
          simples: 'Toda manhã de dia útil, um programa do projeto junta preços, balanços, juros, dólar e notícias.',
          tecnico: 'Módulo de coleta (web scraping): preços e balanços da B3 e das empresas, CDI, IPCA, dólar e manchetes, toda manhã de dia útil.',
        },
      },
      processamento: {
        titulo: 'Processamento',
        texto: {
          simples:
            'Outro programa confere tudo, faz as contas e lê o tom das notícias com o FinBERT. O FinBERT pode errar. Valor muito fora do normal não é publicado: a ficha mostra um traço no lugar.',
          tecnico:
            'Módulo de processamento: validação, indicadores, tom das manchetes pelo FinBERT e o modelo experimental do Top 5. Valores suspeitos são retidos (status sem número), nunca publicados.',
        },
      },
      api: {
        titulo: 'API do projeto',
        texto: {
          simples: 'O site pega tudo daqui. Nenhum dado vem de outro lugar.',
          tecnico: 'A API privada (/v1) é a única fonte do site: nenhuma consulta a serviço público.',
        },
      },
    },
    pacotes: {
      acoes: 'Cadastro das ações',
      resumo_acao: 'Resumo de cada ação',
      series_diarias: 'Séries de preço e índices',
      mercado_dia: 'Mercado do dia',
      fundamentos_trimestrais: 'Balanços trimestrais',
      proventos: 'Proventos',
      noticias_dia: 'Notícias do dia',
      execucao: 'Dados da atualização',
      experimento_historico: 'Histórico do modelo',
      experimento_top: 'Top 5 do modelo',
    },
    avisosResumo: {
      modelo: 'O modelo de previsão ainda está em teste. Por isso o Top 5 do modelo não aparece no site.',
      ibovespa: 'Para alguns dias antigos, a lista de ações do Ibovespa foi estimada com a lista de hoje.',
      horario: 'Esta atualização saiu depois do horário normal.',
      generico: 'Há observações técnicas sobre esta atualização.',
      nenhum: 'Nenhum aviso nesta atualização.',
    },
    categoriasAviso: {
      ibovespa: 'Ibovespa',
      modelo: 'Modelo',
      horario: 'Horário',
      top5: 'Top 5',
      agenda: 'Agenda',
      outro: 'Outro',
    },
    coleta: {
      consultada: { simples: 'A coleta foi consultada nesta atualização.', tecnico: 'Coleta consultada nesta atualização.' },
      naoConsultada: {
        simples: 'A coleta não foi consultada nesta atualização.',
        tecnico: 'Coleta não consultada nesta atualização.',
      },
      etapasTitulo: 'Etapas da coleta',
      segundos: (n) => `${n} s`,
      fatos: {
        inicio: 'Início da coleta',
        fim: 'Fim da coleta',
        entrega: 'Entrega concluída',
        prazo: 'Prazo',
        primeiraConsulta: 'Primeira consulta',
        ultimaConsulta: 'Última consulta',
        consultas: 'Consultas',
        espera: 'Espera',
        pregaoEsperado: 'Pregão esperado',
        pregaoLido: 'Pregão lido',
        origem: 'Origem',
        execucao: 'Execução',
      },
      etapas: {
        precos: 'Preços',
        macro: 'Juros, inflação e câmbio',
        noticias: 'Notícias',
        ipe: 'Documentos das empresas',
        enriquecimento: 'Enriquecimento',
        juiza: 'Checagem dos dados',
        cadastro: 'Cadastro',
        entrega: 'Entrega',
        analise: 'Análise',
      },
      situacoes: { concluida: 'concluída', pulada: 'pulada', falhou: 'falhou', pendente: 'pendente' },
    },
  },
  // Variação suspeita (grupamento ou desdobramento sem ajuste nos dados): selo "mudou de escala" e período sem valor.
  revisao: {
    rotulo: 'mudou de escala',
    explicacao: {
      simples: 'O preço mudou de escala (provável grupamento de ações). Os dados não trazem o ajuste, então essa variação fica de fora.',
      tecnico: 'Fechamento anterior sem ajuste de grupamento/desdobramento na origem; variação descartada.',
    },
    periodo: 'Período com mudança de escala do preço (grupamento ou desdobramento); variação não exibida.',
    desde: (data) => `Desde ${data}, quando o preço mudou de escala (provável grupamento ou desdobramento). Antes disso, os preços estão em outra escala e ficam de fora.`,
  },
  // Contas feitas no próprio site com os dados da API (selo "Calculado no site" + página Dados).
  contas: {
    selo: 'Calculado no site',
    comoFeito: 'como é feito',
    titulo: 'O que o site calcula',
    intro: {
      simples: 'Todos os dados vêm da API do projeto. Alguns números são contas feitas aqui no site com esses dados. Nada é inventado: sem o dado de base, a conta não aparece.',
      tecnico: 'A fonte é só a API privada. Os números abaixo são derivados no cliente (ou no servidor do site) a partir dos pacotes dela; sem a entrada, o resultado fica null e não é exibido.',
    },
    rotuloUsa: 'Usa',
    rotuloComo: 'Como',
    rotuloOnde: 'Aparece em',
    // cartão à parte no fim da grade: não é conta, explica as datas que aparecem no site
    datas: {
      titulo: 'Datas de cada número',
      usa: 'Data do pregão e da publicação de cada pacote',
      como: {
        simples:
          'A API publica de manhã os números do pregão anterior, por isso o site mostra a data do pregão. Os períodos contam desse pregão para trás. O IPCA vai até o mês passado. Nos proventos, a data-com (último dia para ter a ação) vem antes do pagamento.',
        tecnico:
          'data_referencia é o pregão, publicado por volta das 8h do dia útil seguinte. As janelas d1 a a1 terminam nela; o "de X a Y" dos gráficos é a janela usada. IPCA por mês de referência (ipca_ate). Proventos: a data-com define o direito, o pagamento ordena a agenda.',
      },
      onde: 'Gráficos, períodos e proventos de todas as telas',
    },
    itens: {
      selic: {
        titulo: 'Histórico dos juros básicos',
        usa: 'Série diária do CDI',
        como: {
          simples: 'A taxa básica de juros anda quase junto com o CDI. O site transforma o CDI de cada dia em taxa ao ano, soma 0,10 ponto e arredonda para o degrau de 0,25 usado pelo Banco Central. O valor de hoje vem pronto da API.',
          tecnico: 'Taxa anual = (índice/índice anterior)^252 − 1; Selic ≈ taxa + 0,10 p.p., arredondada a múltiplo de 0,25 e suavizada pela mediana de 5 pregões. O ponto de hoje é `selic_meta`.',
        },
        onde: 'Mercado (gráfico de juros)',
      },
      dolar: {
        titulo: 'Histórico e períodos do dólar',
        usa: 'Cotação do dólar de cada publicação diária do mercado',
        como: {
          simples: 'O site junta o dólar de cada dia publicado nos últimos 120 dias e monta a linha. A variação de 1 mês, 6 meses e 1 ano compara com o dia mais próximo daquela data.',
          tecnico: 'Série = `USDBRL.fechamento` de cada `mercado_dia` dos últimos 120 dias corridos. Período = último / ponto mais próximo da data-alvo − 1; 1 dia contra o pregão anterior.',
        },
        onde: 'Hoje (mini gráfico) e Mercado (gráfico e tabela do dólar)',
      },
      ipca: {
        titulo: 'IPCA de cada mês',
        usa: 'Série do IPCA (índice acumulado)',
        como: {
          simples: 'A inflação de cada mês é a diferença entre o índice no fim do mês e no fim do mês anterior.',
          tecnico: 'Variação mensal = último valor do mês / último valor do mês anterior − 1, cortada no mês de referência `ipca_ate`.',
        },
        onde: 'Hoje (barras do IPCA)',
      },
      cdi: {
        titulo: 'CDI de cada mês',
        usa: 'Série diária do CDI (índice acumulado)',
        como: {
          simples: 'O rendimento de cada mês é a diferença entre o índice no fim do mês e no fim do mês anterior. O mês em curso fica de fora.',
          tecnico: 'Variação mensal = último valor do mês / último valor do mês anterior − 1; o mês incompleto é descartado.',
        },
        onde: 'Hoje (barras do CDI)',
      },
      semana: {
        titulo: 'Variação de 1 semana',
        usa: 'Fechamentos diários de cada ação',
        como: {
          simples: 'Compara o último fechamento com o de 5 pregões atrás.',
          tecnico: 'Variação = fechamento atual / fechamento de 5 pregões antes − 1; janela com mudança de escala fica null.',
        },
        onde: 'Setores (1 semana)',
      },
      periodosIndice: {
        titulo: 'Períodos dos índices',
        usa: 'Série histórica de cada índice',
        como: {
          simples: 'Quando a variação do período não vem pronta, o site compara o último valor com o de alguns pregões atrás.',
          tecnico: 'Retorno = último / valor de 1, 21, 126 e 252 pregões atrás − 1.',
        },
        onde: 'Mercado (índices)',
      },
      mediaSetor: {
        titulo: 'Média e contagem por setor',
        usa: 'Variação de cada ação e o setor dela',
        como: {
          simples: 'A variação do setor é a média simples das ações dele. O site também conta quantas subiram e quantas caíram. Ações com o preço em outra escala ficam de fora.',
          tecnico: 'Média aritmética das variações críveis das ações do setor (peso igual); contagem de altas e quedas. Variações fora dos limites de escala são excluídas.',
        },
        onde: 'Setores e mapa do pregão (Ações)',
      },
      velas: {
        titulo: 'Velas por setor',
        usa: 'Fechamentos diários das ações do setor',
        como: {
          simples: 'Cada vela mostra o caminho médio das ações do setor no período: começa em zero, termina no resultado do período, e as pontas são o maior e o menor valor de fechamento no caminho.',
          tecnico: 'Índice do setor = média simples do retorno acumulado das ações; abertura 0, fechamento = último ponto, máxima e mínima = extremos do índice (de fechamento, não intradiários).',
        },
        onde: 'Setores (modo técnico)',
      },
      comparacao: {
        titulo: 'Comparação com o Ibovespa e o setor',
        usa: 'Fechamentos da ação, do Ibovespa e do setor sem a empresa',
        como: {
          simples: 'As três linhas começam em zero no primeiro dia do período e mostram quanto cada uma subiu ou caiu desde então.',
          tecnico: 'Retorno acumulado = valor / valor do primeiro dia comum − 1, com as séries alinhadas pelas datas.',
        },
        onde: 'Ficha da ação (comparar com o Ibovespa)',
      },
      escala: {
        titulo: 'Mudança de escala do preço',
        usa: 'Fechamentos e variações de cada ação',
        como: {
          simples: 'Quando o preço muda de tamanho de um dia para o outro (grupamento ou desdobramento), os dados não trazem o ajuste. O site não inventa esse ajuste: tira a variação das contas e mostra o selo "mudou de escala".',
          tecnico: 'Descarta variação diária acima de +100% ou abaixo de −75%, período acima de +300% ou abaixo de −85%, e janelas com razão entre fechamentos seguidos acima de 2 ou abaixo de 0,25 (os mesmos limites do dia, iguais aos da API). O gráfico da ficha começa depois do último salto.',
        },
        onde: 'Todas as telas com variação de ação',
      },
      proventos: {
        selo: 'Juntado no site',
        titulo: 'Agenda de proventos',
        usa: 'Proventos de cada ação',
        como: {
          simples: 'A API entrega os proventos ação por ação. O site junta as consultas de todas as ações numa agenda só, sem mudar nenhum valor.',
          tecnico: 'Junção de `/v1/proventos/{ticker}` de todas as ações (só registros com data de pagamento), sem transformação dos valores.',
        },
        onde: 'Proventos e Hoje (próximos pagamentos)',
      },
    },
  },
});
