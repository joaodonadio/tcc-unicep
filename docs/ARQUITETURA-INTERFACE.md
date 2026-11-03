# Arquitetura da Interface

**Interface do TCC "Sistema Inteligente para Análise de Dados Financeiros e Investimentos"**

Este documento descreve a arquitetura da interface como ela está implementada no repositório. Os dados de referência são o pregão de 22/10/2026.

---

## Contexto

A interface é a camada de apresentação do TCC. Ela consome os pacotes produzidos pelo módulo de processamento, no contrato de versão 1.x, e os apresenta em nove páginas: Hoje, Mercado, Setores, Ações, Proventos, Notícias, O modelo, Sobre os dados e a ficha de cada ação. Um cabeçalho fixo leva às páginas, dá acesso à Minha lista e abre os controles de leitura.

Os documentos de referência do módulo de processamento são: *Guia da API para a interface*, *Guia dos pacotes para a interface*, *Especificação do Módulo de Processamento* e a planilha *Dados que precisam ser mandados para a interface*, todos de outubro de 2026.

**Princípio do produto:** a interface mostra os dados e explica como eles foram lidos. Ela não induz decisão. As regras de sinal mostram os dados que as acionaram, o que pesa contra e o que a análise não diz. Em todas as telas aparece o aviso fixo: "Conteúdo educativo: não é indicação de compra ou venda de ações."

**Público:** o público principal é a banca examinadora. O público secundário são investidores não profissionais, inclusive pessoas mais velhas e com pouca familiaridade com o mercado. As decisões de linguagem e de tamanho de texto derivam desse segundo público.

---

## 1. Visão geral da arquitetura

```
Coleta ──► Processamento ──► banco tcc_processador
                                    │
                                    ▼
                 API de leitura /v1 (somente leitura, cabeçalho X-API-Key)
                                    │
  ┌─────────────────────────────────┴────────────────────────────────┐
  │ fonte "api": /api/v1/... pelo proxy do Vite (chave só no servidor)│
  └─────────────────────────────────┬────────────────────────────────┘
                                    │
  public/dados/*.json ──► fonte "arquivos" ─┤
                                    ▼
             services/cliente.js  (ponto único de leitura)
                                    │
             hooks (TanStack Query): hooks/useDados.js e hooks/useAnalise.js
                                    │
             lib/analiseDoDia.js  (agregado da análise do dia, função pura)
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                       ▼
  Páginas (src/pages/)                                 Ficha (/acao/:ticker)

  Camada transversal (em todas as telas): cabeçalho fixo, menu Mais,
  controles de leitura (Simples/Técnica e tamanho do texto), termos com balão
  e Minha lista.
```

Decisões de alto nível (detalhadas nas seções seguintes):

| Decisão | Escolha | Justificativa |
|---|---|---|
| Padrão de aplicação | SPA com React Router 7 (`createBrowserRouter`), uma rota por página e a ficha da ação (`/acao/:ticker`) | Cada tema tem endereço próprio, e o cabeçalho leva a cada página sem recarregar o site |
| Divisão por rota | `React.lazy` em cada página, com `Suspense` | Carregamento inicial menor; cabeçalho e controles montam uma única vez no layout |
| Estado de servidor | TanStack Query 5 | Telas que usam a mesma consulta compartilham o cache |
| Estado de cliente | Dois contextos: preferências de leitura (nível e zoom) e Minha lista | Volume mínimo de estado; o restante é estado de servidor |
| Fonte de dados | Ponto único em `services/cliente.js`, escolhido por `VITE_FONTE_DADOS` (`arquivos`, padrão, ou `api`) | A interface funciona sem back-end, com os pacotes de exemplo; trocar a fonte não altera hooks nem telas |
| Chave da API | Somente no proxy do servidor de desenvolvimento e de preview, em variável sem prefixo `VITE_` | Uma variável com prefixo `VITE_` entraria no pacote do navegador |
| Valor ausente | Nunca vira zero; a tela mostra o texto "Indisponível" ou o motivo | Um zero seria uma informação falsa |
| Análise do dia | Montada no front a partir de seis pacotes; não há endpoint de agregado | Os números e os status vêm do processamento; a montagem é uma função pura e testável |
| Regras de sinal | Avaliadas no front, como tabela declarativa (`lib/sugestoes.js`), sobre os valores dos pacotes | O processamento fornece números e status; cada regra tem condição escrita, limite e teste (seção 4) |
| Textos | Todo texto da interface fica em `lib/textos.js` (objeto `TEXTOS`) | A linguagem tem um único lugar para revisão |
| Visual | Tema escuro cinza-quente, com destaque âmbar; cores e tipografia em `styles/tokens.css`; fonte Atkinson Hyperlegible Next | Contraste alto para leitura de números; fonte legível em tamanhos variados |
| Gráficos | SVG nos gráficos próprios; ECharts em alguns gráficos; Three.js só para os objetos 3D, carregado sob demanda | SVG é declarativo e tem alternativa textual (seção 7.5) |

---

## 2. Telas e requisitos funcionais

Cada requisito tem um identificador `RF-x.y`, para citação. A última coluna indica as heurísticas de Nielsen atendidas (H1 a H10, definidas na seção 8).

### 2.1 Cabeçalho e navegação global (RF-0.x)

| ID | Requisito | Heurísticas |
|---|---|---|
| RF-0.1 | Cabeçalho fixo, com o nome "Ações da B3" (link para Hoje), os links das páginas, o ícone de Minha lista com a contagem e o botão Leitura | H4, H6 |
| RF-0.2 | Páginas Hoje, Mercado, Setores e Ações ficam na barra. Proventos, Notícias, O modelo e Sobre os dados aparecem na linha a partir de 1280 px e ficam no menu Mais entre 721 px e 1279 px. No celular, o menu Mais fica na barra inferior | H4, H6 |
| RF-0.3 | Aviso no cabeçalho quando a coleta do dia não terminou bem (status `parcial` ou `falhou`, seção 3.8). Texto `role="status"` | H1, H9 |
| RF-0.4 | Erro de rota tem tela própria (`ErroRota`) | H9 |
| RF-0.5 | Estados de carregamento, de erro e de vazio nos blocos. O erro traz a mensagem em português e, quando faz sentido, um botão para tentar de novo (`role="alert"`) | H9 |
| RF-0.6 | Redirecionamentos: `/sugestoes` vai para `/acoes`; qualquer outro caminho vai para `/` | H4 |

### 2.2 Hoje (RF-1.x, rota `/`)

A página Hoje é o painel inicial. Começa com o bloco Como usar e segue com o painel do pregão.

| ID | Requisito | Heurísticas |
|---|---|---|
| RF-1.1 | Bloco "Como usar", com o passo a passo das páginas, que pode ser fechado e fica fechado na próxima visita | H6, H10 |
| RF-1.2 | Top 5 para estudar hoje, no topo do painel: cinco ações, com o motivo de cada uma | H1, H2 |
| RF-1.3 | Título com a data do pregão e resumo em frases curtas, gerado a partir dos números do pregão | H2 |
| RF-1.4 | Botão "Ouvir o resumo" pela Web Speech API (`SpeechSynthesis`, pt-BR). O botão alterna para parar a leitura. Não aparece se o navegador não tiver a API | H7 |
| RF-1.5 | Números do dia: Ibovespa, dólar (fechamento do pregão, sem histórico), CDI, IPCA e amplitude do pregão (matriz de pontos). Linha de fonte abaixo da grade, com a data do pacote | H1, H2 |
| RF-1.6 | Gráfico do Ibovespa nos últimos 6 meses, com link para a página Mercado | H1 |
| RF-1.7 | Destaques do dia: maior alta, maior queda e volume fora do comum | H1, H2 |
| RF-1.8 | Resumos de proventos, de notícias e da Minha lista, com link para a página completa | H6 |

### 2.3 Mercado (RF-2.x, rota `/mercado`)

Duas abas: Índices e Destaques (os setores têm página própria) (`aria-selected`). O mapa do pregão, em que cada setor é uma linha colorida e cada ação é uma estação, aparece nas abas de setor.

| ID | Requisito | Heurísticas |
|---|---|---|
| RF-2.1 | Abas com o estado da escolha no próprio elemento (`aria-selected`) | H4 |
| RF-2.2 | O mapa do pregão tem lista textual equivalente; tocar numa estação abre a ficha da ação | H4, H7 |

### 2.4 Setores (RF-3.x, rota `/setores`)

| ID | Requisito | Heurísticas |
|---|---|---|
| RF-3.1 | Seletor de período (1 dia, 1 mês, 6 meses e 1 ano) para a comparação entre setores | H7 |
| RF-3.2 | Cena 3D de colunas por setor, decorativa (`aria-hidden`), acima da lista "Quem subiu e quem caiu". Sem WebGL, a cena não aparece e a lista continua | H4, H7 |
| RF-3.3 | Explicação "O que é um setor" e resumo do que mudou em cada setor | H2, H10 |

### 2.5 Ações (RF-4.x, rota `/acoes`)

| ID | Requisito | Heurísticas |
|---|---|---|
| RF-4.1 | Filtros: Todas, Pontos fortes, Atenção, Só contexto e Minha lista. O filtro escolhido fica na URL (`?filtro=`) | H4, H6 |
| RF-4.2 | Busca por código ou por nome da empresa | H7 |
| RF-4.3 | Botão Guardar em cada linha, que leva a ação para a Minha lista | H3, H6 |

### 2.6 Proventos, Notícias e O modelo (RF-5.x)

| ID | Requisito | Heurísticas |
|---|---|---|
| RF-5.1 | Proventos (`/proventos`): agenda de pagamentos, gráfico por mês e ranking de quem mais pagou | H1, H2 |
| RF-5.2 | Notícias (`/noticias`): tom das manchetes do último pregão e empresas mais citadas. Manchetes em outra língua são traduzidas quando o proxy responde | H1, H2 |
| RF-5.3 | O modelo (`/modelo`): de onde vêm os dados, o modelo experimental, a comparação do acerto com o acaso (50%) e as menções | H1, H2, H10 |
| RF-5.4 | Sobre os dados (`/dados`): o que chegou na última atualização, avisos e fontes | H1, H10 |

### 2.7 Ficha da ação (RF-6.x, rota `/acao/:ticker`)

| ID | Requisito | Heurísticas |
|---|---|---|
| RF-6.1 | Faixa de fundamentos da empresa (`Fundamentos`). Cada indicador traz a explicação simples, a linha "De onde vem" (`TEXTOS.ficha.indicadores.origem`) e, quando o valor falta, o motivo visível abaixo do valor | H1, H2 |
| RF-6.2 | Sete perguntas em abas (`role="tablist"`), nesta ordem: O que as regras dizem?, Ela deve muito?, Está cara?, Paga proventos?, Oscila muito?, Como foi o preço? e O que dizem as notícias? | H4, H6 |
| RF-6.3 | A pergunta aberta fica na URL (`?pergunta=regras`, `divida`, `cara`, `proventos`, `oscila`, `preco` ou `noticias`). O parâmetro antigo `?aba=` continua valendo | H4, H7 |
| RF-6.4 | Cada pergunta traz indicadores com a explicação simples. No nível técnico, a ficha mostra os balanços trimestrais (em Ela deve muito?), o histórico do indicador (em Está cara?) e o retorno por período (em Como foi o preço?) | H2, H7 |
| RF-6.5 | Bloco "Entenda com um objeto", com um modelo 3D ilustrativo, carregado sob demanda | H6, H8 |
| RF-6.6 | Botão "Voltar à página anterior" volta pelo histórico quando há página anterior do site; sem histórico, leva a `/acoes` | H3, H4 |

### 2.8 Controles de leitura e termos (RF-7.x)

| ID | Requisito | Heurísticas |
|---|---|---|
| RF-7.1 | Botão Leitura, no cabeçalho, abre um painel com: Simples ou Técnica (`aria-pressed`), tamanho do texto (A− e A+) e o link Como usar | H2, H7 |
| RF-7.2 | Tamanho do texto de 90% a 130%, em passos de 10%, com o percentual visível (`aria-live`). Os botões desabilitam nos limites | H7 |
| RF-7.3 | Esc e clique fora fecham o painel de leitura; o foco volta ao botão quando a tecla Esc fecha | H3, H7 |
| RF-7.4 | Termos sublinhados abrem um balão com a explicação. Esc fecha o balão. Não há painel lateral de glossário | H6, H10 |
| RF-7.5 | As preferências de nível e de tamanho são guardadas no navegador e reaplicadas na próxima visita | H7 |

---

## 3. Contratos de dados

### 3.1 Envelope dos pacotes

Cada pacote é um arquivo JSON com os campos `pacote`, `versao_contrato`, `chave`, `gerado_em`, `dados_ate`, `registros` e `removidos`. A lista de registros fica em `registros`. A camada de dados confere `versao_contrato`: se a versão não começar com "1.", registra um aviso no console, mas não bloqueia a tela (`services/contrato.js`).

Os oito pacotes do processamento são copiados sem alteração para `public/dados/` pelo script `scripts/copiar-dados.mjs`, que também confere o envelope de cada um.

A data do pregão exibida na tela é a `data_referencia` do processamento (22/10/2026 no exemplo). O pacote `execucao` traz o horário da última execução e o status que alimenta o aviso do cabeçalho.

| Pacote | Registros no pregão de 22/10 | Campos principais usados pela interface | Uso |
|---|---|---|---|
| `acoes` | 85 | `ticker`, `empresa`, `setor`, `subsetor`, `tipo_acao`, `ativo_no_universo` | Lista de ações, nomes e setores |
| `resumo_acao` | 85 | `cotacao`, `rentabilidade`, `volume`, `volatilidade_20d`, `beta`, `pl`, `roe`, `dividend_yield`, `payout`, `endividamento`, `balanco_referencia` | Ações, mapa do pregão, resumo do dia e indicadores da Ficha |
| `series_diarias` | 177 | `ticker`, `inicio_janela`, `datas`, `valores` (`fechamento`, `indice_retorno_total`, `volume`, `pl`, `pvp`, `dividend_yield`) | Gráfico de preço da Ficha e tendência |
| `fundamentos_trimestrais` | 664 | balanços trimestrais e de 12 meses por ação | Balanços da Ficha, no nível técnico |
| `proventos` | 1.268 | `ticker`, `tipo`, `data_com`, `data_pagamento`, `valor_por_acao` | Agenda de proventos e pagamentos da Ficha |
| `mercado_dia` | 1 | `IBOV`, `USDBRL`, `BRENT`, `cdi_dia`, `ipca_12m`, `ipca_ate`, `indices` | Fatos do pregão e resumo do dia |
| `noticias_dia` | 85 | `ticker`, `resumo` (`quantidade`, `positivas`, `neutras`, `negativas`, `tom_medio`), `itens` (`titulo`, `fonte`, `link`, `publicado_em`, `rotulo`, `prob_*`, `destaque`) | Tom das notícias do dia e notícias da Ficha |
| `execucao` | 1 | `fim`, `status`, `data_referencia`, `dados_ate` | Cabeçalho (aviso de atualização), data do pregão e Sobre os dados |

### 3.2 Campo com valor e status

Todo indicador vem como `{valor, status}`, às vezes com `texto`. O campo só é utilizável com `status` igual a `ok` e número finito. Valor nulo nunca vira zero.

| Status | Significado | O que a tela mostra |
|---|---|---|
| `ok` | Valor utilizável | O valor, formatado |
| `lucro_negativo` | Lucro dos últimos 12 meses negativo; P/L não se aplica | O texto do pacote ou "Empresa com prejuízo nos últimos 12 meses" |
| `nao_se_aplica` | O indicador não se aplica àquela empresa | "Não se aplica" |
| `historico_insuficiente` | Não há pregões suficientes para o cálculo | "Histórico insuficiente" |
| `indisponivel` | Dado não disponível | "Indisponível" |
| `calibracao_nao_conferida` | Calibração ainda não conferida | O rótulo genérico "Indisponível" |
| Qualquer outro valor | Tratado como indisponível | "Indisponível" |

Regra de cálculo: uma regra de sinal só dispara com campos `ok`. Um campo com status diferente de `ok` não conta como zero e não ativa nenhuma regra (seção 4).

### 3.3 Unidades e formatação

| Grandeza | Unidade no pacote | Como aparece na tela (formato, não dado real) |
|---|---|---|
| Variações e rentabilidades | Fração (0,051 = 5,1%) | Porcentagem com sinal: "+5,1%", "−1,2%" |
| Preço, valor por ação e proventos | Reais, sem escala | "R$ 57,83"; valores grandes em forma compacta |
| Volume | Quantidade de ações negociadas no pregão | Contagem compacta |
| Ibovespa | Pontos | Inteiro com separador de milhar |
| P/L, DL/EBITDA e múltiplos | Número puro | Vezes, com uma casa decimal |
| Tom das notícias | Média de (probabilidade positiva − negativa), de −1 a +1 | Duas casas decimais |
| Datas puras (AAAA-MM-DD) | Texto | Tratadas como texto, para não mudar de dia por fuso horário |
| Instantes com horário e offset | ISO 8601 | Mostrados no fuso de São Paulo |

O sinal negativo usa o caractere de menos tipográfico (U+2212). Zero não recebe sinal, para evitar "−0,0%".

### 3.4 Rotas consumidas pela interface

A interface consome as rotas abaixo, todas `GET`, sob `/v1` no modo `api`. No modo `arquivos`, a mesma forma é emulada a partir de `public/dados/` (seção 7.2).

| Rota | Usada por | Função |
|---|---|---|
| `acoes` | Ações, Top 5 e Ficha | Lista das ações |
| `resumo_acao` | Ações, mapa do pregão e resumo do dia | Resumo de cada ação |
| `resumo_acao/{ticker}` | Ficha (indicadores) | Cotação e indicadores da ação |
| `resumo_acao/{ticker}/historico` | Ficha (Está cara?, no nível técnico) | Histórico de um indicador |
| `series_diarias/{ticker}` | Ficha (preço e tendência) | Série de fechamento |
| `fundamentos_trimestrais/{ticker}` | Ficha (balanços, no nível técnico) | Balanços trimestrais |
| `noticias_dia` | Hoje e Notícias | Notícias classificadas e tom do dia |
| `noticias_dia/{ticker}` | Ficha (O que dizem as notícias) | Notícias da ação |
| `mercado_dia` | Hoje e Mercado | Indicadores e índices |
| `proventos` | Proventos | Agenda de pagamentos |
| `proventos/{ticker}` | Ficha (Paga proventos?) | Pagamentos da ação |
| `execucao/ultima` | Cabeçalho | Status e horário da última execução |
| `experimento/top` | Top 5 | Ranking do experimento, quando existe |
| `experimento/historico` | O modelo | Histórico de acertos, quando existe |

A agenda de proventos lê todas as ações pela rota local `/proventos-todos`, que o servidor do Vite monta a partir da lista de ações (`services/proventosTodos.js`). Se essa rota faltar ou falhar, a agenda usa `proventos/{ticker}`, uma ação por vez.

Não existe endpoint de agregado. A análise do dia é composta no front por `hooks/useAnalise.js`, que lê os pacotes e os combina em `lib/analiseDoDia.js`.

### 3.5 Janelas de série

Pontos (pregões) por janela: 1 mês = 22, 3 meses = 64, 6 meses = 127 e 1 ano = 253. As janelas "2a" e "max" devolvem toda a série. A interface pede a janela de 1 ano e recorta no cliente para o período escolhido (`lib/series.js`).

### 3.6 Rentabilidade e variação

- **Rentabilidade** (`rentabilidade.m1`, `m6`, `a1`, e as mesmas chaves para o Ibovespa e o setor): índice de retorno total, com proventos reinvestidos. É a base da comparação de desempenho com o Ibovespa e o setor.
- **Variação** (`cotacao.variacao_dia`): fechamento do pregão em relação ao anterior, sem ajuste por proventos. É a base das altas e quedas do dia.

### 3.7 Setor de comparação

Cada ação é comparada com a mediana ou a média do seu setor. Na série, esse setor aparece com o identificador `SETOR_SEM:<ticker>`, que é a série do setor excluindo a própria ação. Nas rotas, o identificador é codificado (`SETOR_SEM%3APETR4`).

### 3.8 Status da execução

| Status de `execucao` | Efeito na interface |
|---|---|
| `ok` | Sem aviso no cabeçalho |
| `em_andamento` | Sem aviso |
| `parcial` | Aviso no cabeçalho: parte dos dados de hoje não pôde ser atualizada |
| `falhou` | Aviso no cabeçalho, com a data do pregão de referência |

---

## 4. Regras de sinal e a página Ações

### 4.1 Definição

Um **sinal** é um motivo para olhar uma ação de perto, dado por uma regra que disparou no pregão. Um sinal não prevê preço: a própria interface repete essa ressalva ("Não prevê o preço de amanhã.") nas telas que listam as regras.

As regras são avaliadas no front, sobre os valores dos pacotes. Cada regra é um registro declarativo com código, nome, tipo, condição escrita em texto, função de disparo e textos de montagem, em `lib/sugestoes.js`. Quem decide quais regras disparam é a interface; quem fornece os números é o processamento.

### 4.2 As 14 regras

A coluna "Tipo" é o tipo da regra; a interface o exibe como "Ponto forte", "Atenção" ou "Contexto".

| Código | Regra | Tipo | Condição |
|---|---|---|---|
| R1 | Volume incomum | contexto | Volume do dia de pelo menos 1,5× a mediana dos 20 pregões anteriores |
| R2 | Queda forte no dia | atenção | Variação do dia de −3% ou menos |
| R3 | Alta forte no dia | contexto | Variação do dia de +3% ou mais |
| R4 | Desempenho acima do Ibovespa e do setor em 6 meses | forte | Rentabilidade de 6 meses superior à do Ibovespa e à média do setor em mais de 5 pontos percentuais |
| R5 | P/L baixo com ROE em linha ou acima do setor | forte | P/L positivo abaixo de 70% da mediana do setor, com ROE igual ou maior que a mediana do setor |
| R6 | Dividend yield alto | forte | Dividend yield de 6% ou mais e de pelo menos 1,2 vez a mediana do setor |
| R7 | Dívida alta | atenção | Dívida líquida acima de 3× o EBITDA; ou acima de 2× a mediana do setor e de 1,5× |
| R8 | Prejuízo nos últimos 12 meses | atenção | Lucro líquido dos últimos 12 meses negativo |
| R9 | Queda forte no mês | atenção | Rentabilidade de 1 mês (22 pregões) de −15% ou menos |
| R10 | Oscila pouco | contexto | Volatilidade no quarto mais baixo das ações (até o 25º percentil) e beta abaixo de 0,7 |
| R11 | Notícias com tom positivo | forte | Pelo menos 5 notícias no dia e tom médio de +0,25 ou mais |
| R12 | Notícias com tom negativo | atenção | Pelo menos 5 notícias no dia e tom médio de −0,25 ou menos |
| R13 | Caixa líquido | forte | Dívida líquida negativa: mais caixa e aplicações do que dívida |
| R14 | Proventos acima do lucro | atenção | Payout acima de 100% nos últimos 12 meses |

Os números de cada regra (quantas ações disparam) mudam a cada pregão e não são registrados neste documento.

### 4.3 Filtros da página Ações

As abas Pontos fortes, Atenção e Só contexto mostram as ações que têm pelo menos um sinal daquele tipo. Uma ação pode aparecer em mais de uma aba. A aba Minha lista mostra as ações guardadas pelo usuário.

A interface não exibe percentual de confiança. O número de regras que dispararam é mostrado como contagem, sem ser convertido em probabilidade.

### 4.4 "O que pesa contra"

Para cada sinal, a lista de pontos contrários reúne os argumentos específicos da regra. Exemplos: "o mercado também caiu no dia" (R2); "em 6 meses ainda está acima do Ibovespa" (R9); "poucas notícias no período" (R11).

Quando não há nenhum contraponto, a tela diz: "Nada nos dados de hoje pesa contra este ponto."

### 4.5 "O que isto não diz"

Lista formada pelos limites de cada sinal e pela ressalva base de que a análise não prevê o preço de amanhã. Os limites citam, quando aplicável, a data do balanço usado, a comparabilidade fraca do setor e o fato de que o classificador de notícias erra às vezes e de que o tom não mede o efeito no preço. O aviso fixo fecha a lista.

---

## 5. Experimento acadêmico (Top 5 e O modelo)

**O que é.** Experimento que testa se um modelo consegue indicar quais ações têm maior chance de superar o Ibovespa no pregão seguinte. O modelo cruza o tom das notícias da noite, classificado pelo FinBERT-PT-BR, com preços e índices. O bloco é um teste acadêmico e não é sugestão de compra.

**Top 5 para estudar hoje.** A seção do Top 5 fica no topo da página Hoje. Ela usa o ranking do experimento quando o pacote existe e, enquanto isso não acontece, escolhe as cinco ações pelas regras, nesta ordem:

1. mais pontos a favor (sinais do tipo forte);
2. menos pontos de atenção;
3. maior volume relativo, no empate;
4. ordem alfabética do ticker, se ainda empatar.

O texto da seção diz qual critério está em uso ("Escolhidas pelas regras" ou "Escolhidas pelo modelo de previsão, que está em avaliação").

**Como o ranking do experimento é lido.** `services/experimento.js` normaliza o pacote:

- aceita a lista em `ranking`, `top3` ou `top5`, e ordena pela posição;
- a chance só é exibida quando o pacote marca `exibir: true`; a referência do acaso é `media`, `referencia_acaso` ou 0,5;
- cada motivo tem efeito "ajudou", "atrapalhou" ou "sem efeito claro"; qualquer outro valor vira "sem efeito claro";
- sem selo no pacote, o selo padrão é "em avaliação".

**O modelo.** A página O modelo compara o acerto do modelo com o acaso, que é de 50%. Ela lê `experimento/historico`. Sem histórico, mostra que ainda não há resultado para comparar.

**Método (texto técnico, no nível Técnica).** Modelo 3, com notícias da noite; validação walk-forward mensal; faixa do acaso obtida com 10 mil sorteios; a chance só aparece depois da calibração.

---

## 6. Linguagem

A linguagem da interface segue uma regra de contenção. Ela descreve o que os dados mostram e não indica decisão.

**Expressões permitidas (exemplos):** "ponto forte nos dados", "ponto de atenção", "contexto", "os dados mostram", "rentabilidade passada não garante resultados futuros" e "Não prevê o preço de amanhã."

**Termos proibidos:** o termo para conselho de investimento personalizado (e suas variações), o imperativo do verbo que significa adquirir ação, o substantivo que promete chance única de ganho e as expressões de ranking de ações (o superlativo de "bom" seguido de "ações") e de indicação de ativo como vantajoso. Os demais termos estão definidos no teste automatizado da seção 11.

**Regras de aplicação:**

- o aviso fixo ("Conteúdo educativo: não é indicação de compra ou venda de ações.") é definido em um único lugar, `lib/textos.js`, e reutilizado pelas telas e pelas análises;
- o teste `src/test/lib/linguagem.test.js` varre todos os arquivos `.js` e `.jsx` de `src/`, além de `index.html`, `package.json`, `docs/*.md`, `README.md` e `PRODUCT.md`, e falha se encontrar um termo proibido. Não há exceção: nem o aviso fixo escapa.

---

## 7. Decisões técnicas

### 7.1 Stack

| Camada | Tecnologia (versão principal) |
|---|---|
| Interface | React 18.3 e React DOM |
| Build e desenvolvimento | Vite 6, com plugin React |
| Roteamento | React Router 7, com `createBrowserRouter` |
| Dados do servidor | TanStack Query 5 |
| Estilo | CSS próprio, em `src/styles/`: tokens de cor e tipografia em `tokens.css`, e um arquivo por tela e por componente |
| Tipografia | Atkinson Hyperlegible Next Variable (títulos e texto) e Atkinson Hyperlegible Mono Variable (números), por `@fontsource-variable/atkinson-hyperlegible-next` e `@fontsource-variable/atkinson-hyperlegible-mono`, hospedadas com o próprio site |
| Ícones | lucide-react |
| Gráficos | SVG próprio; ECharts em alguns gráficos; Three.js (0.187) nos objetos 3D, sob demanda |
| Testes | Vitest 2, jsdom e Testing Library |
| Qualidade | ESLint 9 com configuração plana e regras de React Hooks |

A camada de dados usa `fetch` nativo.

### 7.2 Camada de dados

| Arquivo | Papel |
|---|---|
| `services/cliente.js` | Ponto único de leitura. Escolhe a fonte pelo ambiente, corrige a grafia de nomes e converte todo erro em `ErroDados` |
| `services/fonteArquivos.js` | Lê `public/dados/<pacote>.json` uma vez por sessão (cache em memória) e emula as rotas da API. Devolve cópias, nunca o objeto em cache |
| `services/fonteApi.js` | Faz `GET` em `${VITE_API_PREFIXO ?? '/api'}/v1/...`, com tempo limite de 12 segundos. Resposta 404 vira `null` (registro inexistente) |
| `services/contrato.js` | Confere `versao_contrato` (aviso no console) e normaliza listas e registros únicos |
| `services/erros.js` | Mensagens de erro em português. Traduz 401, 422 e 503 e as falhas de rede. Repete no máximo duas vezes as falhas transitórias (503 ou sem resposta) |
| `services/experimento.js` | Normaliza o Top 5 e o histórico de acertos do experimento |
| `services/proventosTodos.js` | Monta a agenda de proventos pela rota local `/proventos-todos` ou, se ela falhar, por ação |
| `hooks/useDados.js` | Um hook por rota, com `queryKey` em `['dados', caminho, parâmetros]` |
| `hooks/useAnalise.js` | Combina os pacotes da análise do dia |
| `hooks/useAgenda.js`, `useLeituraEmVoz.js`, `useReducedMotion.js`, `useRolarParaAncora.js`, `useMetaPublicacao.js` | Apoio: agenda de proventos, leitura em voz, preferência de movimento reduzido, rolagem para âncoras e metadados da publicação |
| `lib/*.js` | Funções puras de montagem, formatação, datas, séries, perguntas da ficha, lista de ações, setores e textos. Não fazem chamadas de rede, salvo as que são feitas por hooks |
| `lib/textos.js` | Objeto `TEXTOS`, com todo texto da interface |

Na fonte de arquivos, o parâmetro `data` é ignorado: a emulação sempre serve a última geração. Uma ação sem registro devolve `null`, como um 404 da API.

### 7.3 Estado

- **Servidor:** TanStack Query. A consulta não é refeita ao focar a janela. Falhas transitórias são repetidas no máximo duas vezes (`services/erros.js`).
- **Cliente:** dois contextos, `PreferenciasContext` (nível e tamanho do texto) e `ListaContext` (Minha lista). Ficam no `localStorage`, nas chaves `painel-b3:preferencias` e `painel-b3:lista`. O bloco Como usar fechado usa a chave `painel-b3:como-usar-fechado`. Cada leitura e gravação tem tratamento de erro, para o caso de o armazenamento estar indisponível (por exemplo, em navegação privada).

### 7.4 Proxy, chave e produção

O `vite.config.js` cria os seguintes proxies:

- `/api` para `API_BASE_URL`, acrescentando o cabeçalho `X-API-Key` com o valor de `API_KEY`. Só existe quando `API_BASE_URL` está preenchida.

Os proxies valem para o servidor de desenvolvimento (porta 5173) e para o `vite preview`. As variáveis `API_BASE_URL` e `API_KEY` não têm prefixo `VITE_`, porque o Vite só expõe ao navegador as variáveis com esse prefixo. Por isso a chave não entra no pacote publicado.

Em produção, o build é estático e os proxies do Vite não existem. É preciso um proxy próprio que faça o mesmo papel: receba `/api`, acrescente `X-API-Key` no servidor e encaminhe à API. Se a interface chamar a API diretamente, o domínio de origem precisa ser informado à equipe da API para liberação de CORS. Com o proxy, o navegador fala somente com a própria origem e CORS não se aplica.

### 7.5 Renderização gráfica

- **SVG:** os gráficos próprios e as sparklines são SVG declarativo. Quando há série, o elemento tem alternativa textual (`role="img"` com `aria-label` descrevendo a série).
- **ECharts:** usado em alguns gráficos (por exemplo, boxplot e gráfico interativo), com o núcleo importado de forma modular.
- **Three.js:** usado só nos objetos 3D (ficha e Top 5) e nas colunas da página Setores. A biblioteca é carregada sob demanda. Sem WebGL, o objeto não aparece e o texto ao lado continua.

Com movimento reduzido (`prefers-reduced-motion`), os contadores aparecem no valor final e as animações deixam de rodar, exceto o feedback de estado dos botões.

### 7.6 Tema e tokens

O tema é escuro, cinza-quente, com destaque âmbar. As cores e a tipografia ficam em `styles/tokens.css`, como variáveis `--cor-*`, `--fonte-*` e `--texto-*`. Alguns valores são translúcidos (cartões sobre o fundo).

| Token | Cor | Papel |
|---|---|---|
| `--cor-fundo` | `#1a1815` | Fundo da página (quase marrom-grafite, nunca preto puro) |
| `--cor-superficie` | `rgb(255 255 255 / 0.045)` | Cartões translúcidos |
| `--cor-texto` | `#f3efe7` | Texto principal |
| `--cor-texto-suave` | `#b8b1a5` | Textos de apoio |
| `--cor-acento` | `#e8b84a` | Âmbar: ativo, foco, ação principal e série principal |
| `--cor-foco` | `#e8b84a` | Contorno de foco |
| `--cor-alta` | `#8fc4a0` | Altas (sálvia) |
| `--cor-queda` | `#e38b7f` | Quedas (rosa-terra) |
| `--cor-forte` | `#8fc4a0` | Ponto forte |
| `--cor-atencao` | `#e8b84a` | Ponto de atenção |
| `--cor-contexto` | `#c9c3b8` | Contexto |

Dados e gráficos usam `--cor-dado-1` a `--cor-dado-7`. As cores de cada setor do mapa do pregão ficam nos tokens `--linha-*` (por exemplo, `--linha-financeiro` e `--linha-saude`).

A tipografia usa Atkinson Hyperlegible Next Variable (títulos e texto) e Atkinson Hyperlegible Mono Variable (números de dado e códigos). A escala tem sete degraus, de `--texto-xs` (0,8125rem) a `--texto-3xl` (2,75rem; 2,125rem em telas de até 720 px). Os pesos são 400 (corpo), 600 (destaque), 700 (títulos) e 800 (títulos de página).

---

## 8. IHC e acessibilidade

As heurísticas de Nielsen usadas como referência são: H1 visibilidade do status do sistema; H2 correspondência entre a interface e o mundo real; H3 controle e liberdade do usuário; H4 consistência e padrões; H5 prevenção de erros; H6 reconhecimento em vez de lembrança; H7 flexibilidade e eficiência de uso; H8 estética e design minimalista; H9 ajudar a reconhecer, diagnosticar e recuperar erros; H10 ajuda e documentação.

A tabela liga os recursos da interface às heurísticas e aos critérios de acessibilidade do WCAG 2.2:

| Recurso | Heurísticas | Critérios WCAG 2.2 | Fundamento |
|---|---|---|---|
| Aviso de atualização no cabeçalho | H1 | 4.1.3 Mensagens de status | `role="status"`; o usuário sabe se os dados estão completos |
| Abas de perguntas da ficha | H4, H6 | 4.1.2 Nome, função, valor | Cada aba tem `role="tab"` e `aria-selected`; a pergunta aberta fica na URL |
| Explicações Simples/Técnica | H2, H7 | 3.1.5 Nível de leitura (AAA) | Adequa o texto ao repertório sem esconder a fórmula |
| Termos com balão | H6, H10 | 3.1.3 Palavras incomuns (AAA) | Explica o termo no ponto em que ele aparece; Esc fecha |
| Texto A−/A+ (90% a 130%) | H7 | 1.4.4 Redimensionar texto; 1.4.10 Reflow | Escala a raiz em rem, para baixa visão e letramento limitado |
| Mapa do pregão com lista textual equivalente | H4, H7 | 1.1.1 Conteúdo não textual | O mapa é canal redundante; a lista de ações dá o mesmo acesso |
| Gráficos com `aria-label` | H1 | 1.1.1 Conteúdo não textual | A série é descrita em texto para leitor de tela |
| Cena 3D decorativa | H4 | 1.1.1 Conteúdo não textual | `aria-hidden`; a lista ao lado traz a informação |
| Abas com `aria-selected` e `aria-pressed` | H4 | 4.1.2 Nome, função, valor | O estado da escolha fica no próprio elemento |
| Minha lista | H3, H6 | 3.3.2 Rótulos ou instruções | Memória externa; o usuário guarda e retira ações a qualquer momento |
| Foco visível | H1 | 2.4.7 Foco visível | Contorno na cor `--cor-foco` |
| Movimento reduzido | H8 | 2.3.3 Animação por interação (AAA) | Contadores e animações respeitam a preferência do sistema operacional |
| Resumo em voz | H7, H2 | 1.1.1 Conteúdo não textual | Alternativa de leitura; o botão some se o navegador não tiver a função |
| Mensagens de erro e de zoom | H1, H9 | 4.1.3 Mensagens de status | `role="alert"` nos erros; `aria-live` no percentual de zoom |

O contraste de cores (1.4.3) ainda será verificado com o Lighthouse, na avaliação da seção 10.

---

## 9. Limitações conhecidas

### 9.1 Dados (conforme o *Guia dos pacotes para a interface*)

- Algumas empresas têm quantidade de ações informada de forma errada. Para elas, P/L, P/VP e payout ficam indisponíveis.
- Algumas empresas têm empréstimos zerados no balanço.
- Há empresas sem balanço recente, e alguns índices têm lacunas de série. Nesses casos a tela mostra o status do dado, e nunca zero.
- Algumas ações têm menos de um ano de histórico, e algumas têm saltos de preço.
- As notícias têm data de publicação, mas não horário exato.
- O histórico tem poucos dias publicados.

### 9.2 Interface

- **Setores:** a média é simples e calculada na própria interface. Não é índice oficial.
- **Regras de sinal:** foram calibradas em um único pregão (22/10/2026). A frequência de disparos não foi validada em série histórica.
- **Armazenamento:** preferências e Minha lista ficam no navegador. A API é somente leitura, então nada disso chega ao servidor.
- **Top 5:** enquanto o pacote do experimento não existe, o Top 5 usa as regras, e o texto da seção diz isso.
- **Modo de arquivos:** serve sempre a última geração do pacote, por isso o pregão mostrado é fixo.

---

## 10. Métricas de avaliação

- **Usabilidade percebida:** escala SUS (Brooke, 1996), com 10 itens e escore de 0 a 100. Meta: 68 ou mais, que é a média da literatura. Aplicada após o teste de tarefas.
- **Avaliação com usuários:** 5 participantes, pelo princípio de Nielsen de que cinco usuários revelam a maior parte dos problemas de usabilidade. Protocolo *think-aloud*, com as tarefas:
  1. dizer como o Ibovespa fechou no pregão e quantas ações caíram, na página Hoje;
  2. encontrar uma ação com sinal na página Ações e explicar, com as próprias palavras, por que ela aparece;
  3. dizer o que pesa contra essa ação;
  4. alternar para as explicações técnicas e localizar a fórmula usada;
  5. encontrar o tom das notícias do dia.

  Para cada tarefa, registram-se sucesso ou falha, tempo e número de erros.
- **Acessibilidade:** Lighthouse, na versão de produção, com pontuação de acessibilidade de 90 ou mais.
- **Entendimento das explicações:** as tarefas 2 e 3 medem se a explicação foi entendida, e não apenas se foi lida.

Os resultados serão reportados no capítulo de avaliação. Este documento registra o protocolo, não os resultados.

---

## 11. Testes automatizados

A suíte roda com `npm test` (Vitest, em modo único) e tem mais de 1.000 testes em 93 arquivos. Os arquivos ficam em `src/test/`, em pastas por área:

| Área | Pasta | O que verifica |
|---|---|---|
| Funções puras | `src/test/lib/` | Análise do dia; regras de sinal e seus limites; séries; formatação, valores e datas; perguntas da ficha; lista de ações; mapa do pregão; experimento; linguagem |
| Camada de dados | `src/test/services/`, `src/test/dados/` | Emulação das rotas da API, 404 como `null`, normalização do Top 5, e agenda de proventos |
| Páginas e rotas | `src/test/paginas/`, `src/test/rotas.test.jsx` | Páginas, redirecionamentos e rotas |
| Hoje, Mercado, Setores, Proventos e Notícias | `src/test/hoje/`, `src/test/inicio/`, `src/test/mercado/`, `src/test/setores/`, `src/test/proventos/`, `src/test/noticias/` | Blocos de cada página |
| O modelo | `src/test/modelo/` | Página O modelo |
| Apoio | `src/test/apoio/`, `src/test/fixtures/` | Hooks de apoio e dados de exemplo dos testes |
| Ficha e gráficos | `src/test/ficha/`, `src/test/graficos/`, `src/test/modelos3d/` | Perguntas, painéis, gráficos e objetos 3D |
| Layout e contexto | `src/test/layout/`, `src/test/contexto/`, `src/test/ui/` | Cabeçalho, controles de leitura, Minha lista e componentes de interface |
| Linguagem | `src/test/lib/linguagem.test.js` | Termos proibidos, em todo o código e na documentação |

Também são usados `npm run lint` (ESLint) e `npm run build` (build de produção). O build gera a separação do código por rota.

---

## 12. Referências

- Nielsen, J. *10 Usability Heuristics for User Interface Design*. Nielsen Norman Group. <https://www.nngroup.com/articles/ten-usability-heuristics/>
- Nielsen, J. *Why You Only Need to Test with 5 Users*. Nielsen Norman Group. <https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/>
- Brooke, J. (1996). *SUS: A "quick and dirty" usability scale*. In: Jordan, P. W. et al. (eds.), *Usability Evaluation in Industry*. Taylor & Francis.
- W3C. *Web Content Accessibility Guidelines (WCAG) 2.2*. <https://www.w3.org/TR/WCAG22/>
- MDN. *Web Speech API (SpeechSynthesis)*. <https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis>
- Chen, T.; Guestrin, C. (2016). *XGBoost: A Scalable Tree Boosting System*. In: KDD '16. ACM. DOI 10.1145/2939672.2939785.
- Lucas Leme. *FinBERT-PT-BR*. <https://github.com/lucas-leme/FinBERT-PT-BR>
- Documentação oficial: React <https://react.dev/>; Vite <https://vite.dev/>; TanStack Query <https://tanstack.com/query/latest>; React Router <https://reactrouter.com/>; Atkinson Hyperlegible Next <https://www.brailleinstitute.org/freefont>.
- Documentos do módulo de processamento (outubro de 2026): *Guia da API para a interface*; *Guia dos pacotes para a interface*; *Especificação do Módulo de Processamento*; planilha *Dados que precisam ser mandados para a interface*.

---

## Verificação

- Cada requisito `RF-x.y` é citável e corresponde a um comportamento implementado nos componentes de `src/pages/` e `src/components/`.
- Os números deste documento (85 ações, 14 regras, pacotes com 177, 664, 1.268 e demais registros) correspondem ao pregão de 22/10/2026 e aos arquivos de `public/dados/`. A quantidade de testes é a da última execução de `npm test`.
- Os contratos da seção 3 seguem o envelope `versao_contrato` 1.x e os nomes de campos dos pacotes em `public/dados/`.
- A interface avalia as regras e monta os textos a partir dos valores dos pacotes; nenhum número é gerado por estimativa.
- A verificação de linguagem (seção 6) é automatizada e roda em `npm test`.
