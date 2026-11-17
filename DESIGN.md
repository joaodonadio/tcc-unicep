---
name: CotAI
description: O pregão da B3 explicado em placas de vidro escuro sobre uma malha de pontos, com a cor morando em manchas vivas de dois tons que dizem o assunto do cartão.
colors:
  fundo: "#242428"
  vidro-base: "#19191c"
  vidro-base-hover: "#1e1e22"
  poca-teal: "#43a89c"
  poca-azul: "#4e68cc"
  poca-carmim: "#bd4a66"
  poca-magenta: "#ad55a4"
  poca-violeta: "#7558cc"
  poca-verde: "#4faa66"
  poca-oliva: "#8fa248"
  poca-ardosia: "#5f7096"
  sub-fundo: "rgb(255 255 255 / 0.04)"
  sub-fundo-hover: "rgb(255 255 255 / 0.07)"
  sub-borda: "rgb(255 255 255 / 0.08)"
  flutuante-fundo: "rgb(30 30 34 / 0.78)"
  flutuante-borda: "rgb(255 255 255 / 0.08)"
  fio: "rgb(255 255 255 / 0.07)"
  borda: "rgb(255 255 255 / 0.09)"
  borda-hover: "rgb(255 255 255 / 0.18)"
  texto: "#f4f4f5"
  texto-suave: "#b4b4bb"
  texto-suave-na-mancha: "#dedee3"
  placa-suave: "#a6a6ae"
  acento: "#f4f4f5"
  acento-hover: "#ffffff"
  acento-texto: "#0b0b0c"
  acento-suave: "rgb(255 255 255 / 0.1)"
  alta: "#7fd19a"
  alta-suave: "rgb(127 209 154 / 0.14)"
  queda: "#f08a8a"
  queda-suave: "rgb(240 138 138 / 0.14)"
  estavel: "#b4b4bb"
  atencao: "#e6cf5c"
  atencao-fundo: "rgb(230 207 92 / 0.14)"
  contexto: "#c8c8ce"
  contexto-fundo: "rgb(255 255 255 / 0.08)"
  dado-1: "#ececef"
  dado-2: "#7fd19a"
  dado-3: "#b3a2f0"
  dado-4: "#7d9be0"
  dado-5: "#8a8a93"
  dado-6: "#5fc9c0"
  dado-7: "#e09ad6"
  linha-financeiro: "#e8b84a"
  linha-consumo-ciclico: "#8fc4a0"
  linha-utilidade-publica: "#b8a6e8"
  linha-consumo-nao-ciclico: "#7d93bd"
  linha-materiais-basicos: "#d9a27a"
  linha-petroleo: "#e38b7f"
  linha-bens-industriais: "#9fb8a8"
  linha-saude: "#c9a8c4"
  linha-tecnologia: "#8fb3c9"
  linha-comunicacoes: "#c4b88a"
  linha-outros: "#8e887d"
typography:
  display:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.2
  caption:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.25
  numero-destaque:
    fontFamily: "'Atkinson Hyperlegible Mono Variable', ui-monospace, monospace"
    fontSize: "2.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "'tnum', 'zero'"
  numero:
    fontFamily: "'Atkinson Hyperlegible Mono Variable', ui-monospace, monospace"
    fontSize: "0.92em"
    fontWeight: 500
    letterSpacing: "-0.02em"
    fontFeature: "'tnum', 'zero'"
rounded:
  raio-1: "6px"
  raio-2: "10px"
  raio-3: "14px"
  raio-cartao: "22px"
  pilula: "999px"
spacing:
  espaco-1: "0.25rem"
  espaco-2: "0.5rem"
  espaco-3: "0.75rem"
  espaco-4: "1rem"
  espaco-5: "1.5rem"
  espaco-6: "2rem"
  espaco-7: "3rem"
  espaco-8: "4.5rem"
  espaco-9: "6rem"
components:
  button-primary:
    backgroundColor: "{colors.acento}"
    textColor: "{colors.acento-texto}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "0.5rem 1.5rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.acento-hover}"
    textColor: "{colors.acento-texto}"
  button-secondary:
    backgroundColor: "{colors.sub-fundo}"
    textColor: "{colors.texto}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "0.5rem 1.5rem"
    height: "2.75rem"
  button-secondary-hover:
    backgroundColor: "{colors.sub-fundo-hover}"
    textColor: "{colors.texto}"
  tab:
    backgroundColor: "{colors.sub-fundo}"
    textColor: "{colors.texto}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "0.5rem 1rem"
    height: "2.75rem"
  tab-selected:
    backgroundColor: "{colors.acento}"
    textColor: "{colors.acento-texto}"
  input-search:
    backgroundColor: "{colors.sub-fundo}"
    textColor: "{colors.texto}"
    typography: "{typography.body}"
    rounded: "{rounded.pilula}"
    padding: "0 1rem"
    height: "2.75rem"
  pill-alta:
    backgroundColor: "{colors.alta-suave}"
    textColor: "{colors.alta}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "0.125rem 0.75rem"
    height: "1.75rem"
  pill-queda:
    backgroundColor: "{colors.queda-suave}"
    textColor: "{colors.queda}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "0.125rem 0.75rem"
    height: "1.75rem"
  chip-atencao:
    backgroundColor: "{colors.atencao-fundo}"
    textColor: "{colors.atencao}"
    typography: "{typography.caption}"
    rounded: "{rounded.pilula}"
    padding: "0 0.5rem"
    height: "1.5rem"
  selo-sinal:
    backgroundColor: "{colors.sub-fundo}"
    textColor: "{colors.texto}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "0 0.75rem"
    height: "2rem"
  card:
    backgroundColor: "{colors.vidro-base}"
    textColor: "{colors.texto}"
    rounded: "{rounded.raio-cartao}"
    padding: "2rem"
  kpi-card:
    backgroundColor: "{colors.vidro-base}"
    textColor: "{colors.texto}"
    rounded: "{rounded.raio-cartao}"
    padding: "1.5rem"
  sub-surface:
    backgroundColor: "{colors.sub-fundo}"
    rounded: "{rounded.raio-3}"
  nav-bar:
    backgroundColor: "{colors.flutuante-fundo}"
    textColor: "{colors.placa-suave}"
    typography: "{typography.label}"
    height: "4.25rem"
  nav-link-active:
    backgroundColor: "{colors.acento-suave}"
    textColor: "{colors.texto}"
    rounded: "{rounded.pilula}"
    height: "2.5rem"
---

# Design System: CotAI

## Overview

**Creative North Star: "Vidro sobre a Mesa de Operações"**

O site é uma mesa cinza-escura e neutra, coberta por uma malha de pontos apagados. Sobre ela, cada assunto é uma placa de vidro escuro quase opaco, e atrás de cada placa acendem duas manchas de luz colorida, vivas e difusas, em cantos opostos. A cor nunca está na interface: está no cartão, e diz do que ele trata (alta, queda, juros, série, destaque). Toda a navegação, o foco e a ação principal são monocromáticos, em branco.

O sistema não saiu de uma rodada de conceitos. Foi conduzido por duas imagens de referência do usuário (uma grade de cartões escuros, cada um com uma mancha viva de dois tons, número grande e legenda; e uma interface de vidro quente) e pelo retorno dele durante a construção: tirar o âmbar, deixar as manchas mais vivas, consertar os cartões e a barra de navegação. O que ficou é o que o código mostra.

A leitura vem antes do enfeite: público leigo e idoso, texto de 17px ajustável, número grande em fonte de painel de cotação, legenda curta embaixo. A cor de mancha é atmosfera e assunto; o sentido de alta e queda sempre vem também por sinal, palavra ou ícone.

**Key Characteristics:**
- Chão neutro cinza-escuro (#242428), com os cartões um degrau mais escuros, nunca preto, com malha de pontos fixa por trás de tudo.
- Cartões de vidro escuro opaco (na página Hoje, translúcido: ver a regra do desfoque) com duas manchas vivas de tamanho fixo em cantos opostos, aresta de 1px que pega luz em cima, sem sombra projetada.
- Interface monocromática: branco para o ativo, o foco e a ação principal.
- Par de cores da mancha com significado (direção do preço, assunto da pergunta).
- Duas famílias de tipo: Atkinson Hyperlegible Next nos títulos e no texto, Atkinson Hyperlegible Mono só nos números de dado e códigos. Escolhidas pela legibilidade: letras e algarismos difíceis de confundir, o que ajuda quem está começando.
- Vidro translúcido com desfoque reservado ao que flutua (barra do topo, barra inferior do celular, painéis e balões) e, como única exceção, aos cartões da página Hoje.

## Colors

Chão neutro e escuro, tinta branca e cor viva só nas manchas atrás do vidro e nos dados.

### Primary
- **Branco de Comando** (acento): a única cor de interface. Botão principal, aba e opção ativa do segmentado, foco do teclado, selo de contagem, seleção de texto, sublinhado de link. Texto por cima em quase-preto (acento-texto). No hover vai a branco puro (acento-hover). Véu de 10% (acento-suave) para estados abertos discretos.

### Secondary
As manchas (poca-*) são cores suaves, de saturação contida, que, misturadas a 48% sobre a placa escura (`--brilho-forca: 48%`; 34% nas telas com mancha mais discreta, como a Hoje), viram luz colorida difusa sem cansar o olho (decisão do usuário em 04/11/2026: fundo cinza-escuro e cores menos saturadas). Nunca aparecem como fundo chapado, texto ou borda.
- **Teal de Recife** (poca-teal): segunda luz do destaque e do par de gráfico; primeira luz do par "aço".
- **Azul Cobalto** (poca-azul): primeira luz do par "dado" (gráficos de série).
- **Carmim** (poca-carmim): primeira luz do par "queda".
- **Magenta Orquídea** (poca-magenta): segunda luz de "queda" e primeira de "lavanda".
- **Violeta Elétrico** (poca-violeta): primeira luz de "acento" e segunda de "lavanda".
- **Verde Folha** (poca-verde): primeira luz do par "alta".
- **Oliva Ácido** (poca-oliva): segunda luz do par "alta".
- **Ardósia Fria** (poca-ardosia): segunda luz do par "aço", menos saturada, para o que é estável ou sem direção.

### Tertiary
- **Verde de Alta** (alta) e **Rosa de Queda** (queda): direção do preço em texto, pílulas, réguas e gráficos, legíveis no escuro sem brilhar. Véus de 14% (alta-suave, queda-suave) como fundo de pílula. Estável fica em cinza (estavel).
- **Amarelo-Limão de Atenção** (atencao): só sinal de cuidado. Chip de atenção, faixa de aviso (véu de 8% com aresta a 32%). Nunca botão, nunca estado ativo, nunca mancha.
- **Cinza de Contexto** (contexto) sobre véu branco de 8%: o terceiro tipo de sinal.
- **Série de dados** (dado-1 a dado-7): branco para a série principal, depois verde, lavanda, azul, cinza, teal e rosa. Usada em gráficos SVG e ECharts.
- **Cores de setor** (linha-financeiro a linha-outros): identidade de setor dentro dos dados (dispersão, marcadores, linhas), sempre com o nome do setor junto. O ouro do financeiro (linha-financeiro) é uma delas: cor de dado de setor, nunca cromo de interface.

### Neutral
- **Mesa Cinza-Escura** (fundo): o chão de toda página, sob a malha de pontos.
- **Placa de Vidro** (vidro-base, vidro-base-hover): o corpo opaco de todo cartão.
- **Sub-superfície** (sub-fundo, sub-fundo-hover, sub-borda): branco a 4% e 7% com aresta de 8%, para blocos dentro de cartões, botões secundários, abas, campos e selos.
- **Vidro Flutuante** (flutuante-fundo, flutuante-borda): quase-preto a 78% com `blur(20px) saturate(140%)`.
- **Fio e Contorno** (fio, borda, borda-hover): brancos de 7%, 9% e 18%.
- **Tinta** (texto) e **Tinta Suave** (texto-suave); dentro de um cartão com mancha a tinta suave clareia para texto-suave-na-mancha, para manter 4,5:1 no centro da cor. **Prata da Barra** (placa-suave) para links inativos da navegação.

### Named Rules
**The Cor Mora no Cartão Rule.** A cor viva vive só nas manchas atrás do vidro e nos dados. Botão, aba, link, foco e navegação são brancos ou neutros.

**The Par com Significado Rule.** Toda mancha é um dos seis pares nomeados, escolhidos por significado: acento (violeta + teal, destaque e Top 5), alta (verde + oliva), queda (carmim + magenta), lavanda (magenta + violeta, notícias e modelo), aço (teal + ardósia, juros, câmbio, estável) e dado (azul + teal, gráficos). Nada de cor de mancha avulsa.

**The Direção Manda Rule.** Onde um cartão fala de um preço que se moveu (números do dia, cartões de destaque de ações), a direção escolhe o par: subiu é alta, caiu é queda, sem direção cai em aço. Nas perguntas da Ficha, a pergunta escolhe o par (regras acento, dívida aço, preço e "está cara" dado, proventos alta, notícias lavanda).

**The Amarelo Só Avisa Rule.** O amarelo-limão de atenção marca cuidado e nada mais. O âmbar saiu do sistema por decisão do usuário; o único ouro restante é a cor de dado do setor financeiro.

**The Nunca Só Cor Rule.** Toda direção e todo sinal vêm com sinal gráfico (+ ou −), palavra, forma ou ícone além da cor; nos cartões de ações o sinal mora nos selos.

## Typography

**Display Font:** Atkinson Hyperlegible Next Variable, em pesos 700 e 800 (fallback system-ui)
**Body Font:** Atkinson Hyperlegible Next Variable (fallback system-ui)
**Label/Mono Font:** Atkinson Hyperlegible Mono Variable, só para números de dado e códigos de ação

**Character:** uma sans feita para legibilidade, em que letras e algarismos parecidos não se confundem. Títulos e texto usam a mesma família, a Next; os números de dado usam a Mono, com algarismos da mesma largura. Tudo self-hosted pelo `@fontsource-variable`.

### Hierarchy
- **Display** (800, 2.75rem; 2.125rem até 720px, 1.05, -0.03em): título de abertura de página.
- **Headline** (700, 1.875rem, 1.15, -0.02em): título de seção.
- **Title** (700, 1.25rem a 1.5rem, 1.2, -0.02em): título de cartão e de bloco; títulos dos KPI reservam duas linhas.
- **Lead** (400, 1.25rem, 1.5, até 60ch): resumo do dia.
- **Body** (400, 1.0625rem, 1.55): texto corrido, sobre base de 100% do navegador multiplicada pelo zoom de leitura.
- **Label** (600, 0.9375rem, 1.2): botões, abas, pílulas, links da navegação, rótulos de seção.
- **Caption** (600, 0.8125rem): cabeçalho de tabela, chips de sinal, rótulos da barra inferior.
- **Número-destaque** (Atkinson Hyperlegible Mono, 600, 1.625rem no celular, 2.5rem a partir de 640px, 2.75rem a partir de 960px, 1, -0.04em, sem quebra): o número grande do KPI.
- **Número** (Atkinson Hyperlegible Mono, 500, 0.92em do texto ao redor, -0.02em, tabular e zero cortado): preço, variação, indicador, ticker, colunas numéricas alinhadas à direita.

### Named Rules
**The Mono Só no Dado Rule.** Atkinson Hyperlegible Mono só em número de dado e código de ação. Palavras no lugar do número ("Indisponível", "Carregando") voltam para Atkinson Hyperlegible Next.

**The Escala Fixa Rule.** Só os sete degraus de tamanho dos tokens (0.8125rem a 2.75rem), mais os tamanhos próprios do número-destaque. Nada de tamanho fluido.

**The Sem Caixa-Alta Rule.** Nenhum rótulo em caixa-alta com espaçamento aberto; títulos com espaçamento levemente negativo, rótulos de seção em frase normal.

## Layout

- **Largura:** conteúdo num bloco de até 80rem, centralizado, com 1.5rem de respiro lateral (1rem até 640px).
- **Ritmo:** escala de 0.25rem a 6rem. Seções se separam só por espaço (3rem a 4.5rem); os cartões agrupam o conteúdo, sem fios entre seções.
- **Grade dos números do dia:** uma ou duas colunas no celular, duas a partir de 640px, três a partir de 960px, com vão de 1rem a 1.5rem. A fonte dos números ocupa a linha inteira abaixo.
- **Anatomia do cartão KPI:** título que reserva duas linhas, número preso logo abaixo (todos os números de uma fileira na mesma altura), variação do dia, micro-visual opcional (régua de proporção alta/estável/queda ou faixa de 6 meses com marcador), e a sobra de espaço vai para o pé do cartão. Altura mínima de 12.5rem (8.5rem no celular).
- **Duas colunas:** gráfico e destaques lado a lado a partir de 1024px (1.6fr e 1fr).
- **Navegação:** barra de ponta a ponta fixa no topo, em uma linha: marca à esquerda (o Cotinha e o nome), páginas no centro, Leitura à direita. Entre 721px e 1279px as páginas extras vão para o menu Mais. Até 720px o topo rola com a página e a navegação vira uma barra inferior flutuante em pílula (até 28rem de largura), com ícone e rótulo, e o corpo ganha folga embaixo para ela não cobrir o fim.
- **Fundo:** a malha de pontos (26px entre centros, ponto de 1.15px, branco a 10%) é uma camada fixa atrás de todo o conteúdo.

## Elevation & Depth

Profundidade por material, não por sombra. Os cartões são placas opacas sem sombra projetada: só um fio interno de luz em cima e uma aresta em degradê, mais clara no topo. A sensação de camada vem da luz colorida das manchas e do contraste com a malha de pontos que aparece só nos vãos. Apenas o que flutua sobre o conteúdo (barra inferior, menu Mais, painel de Leitura, balão de termo) ganha translucidez com desfoque e uma sombra escura difusa embaixo.

### Shadow Vocabulary
- **Luz de aresta** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.035)`, hover 0.06): todo cartão de vidro.
- **Luz de sub-superfície** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.03)`): blocos, botões e campos dentro de cartões.
- **Suspensão** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06), 0 18px 40px -16px rgb(0 0 0 / 0.7)`): só painéis e barras flutuantes.
- **Halo de foco** (`outline: 2px solid` branco, `outline-offset: 3px`, `box-shadow: 0 0 0 5px rgb(11 11 12 / 0.9)`): foco do teclado, visível em qualquer mancha.

Camadas: cabeçalho 40, painéis 50, barra inferior 60, balão 90, link de pular 100.

### Named Rules
**The Vidro Não Empilha Rule.** Dentro de um cartão de vidro nunca vai outro cartão de vidro. Bloco interno é sub-superfície: véu branco de 4%, aresta de 8%, sem mancha, sem sombra externa.

**The Desfoque Só Flutua Rule.** `backdrop-filter` só no que flutua sobre o conteúdo. Cartões no fluxo da página são opacos. Exceção: na página Hoje (e no bloco Como usar) o vidro é translúcido (`--vidro-base-translucido`) e desfoca a malha de pontos (`--vidro-desfoque`). Com `prefers-reduced-transparency`, volta à placa opaca.

## Shapes

- **Cartões, painéis e menus suspensos:** cantos bem arredondados (22px).
- **Sub-superfícies, avisos, erros e balão de termo:** 14px.
- **Botões, abas, segmentados, pílulas, selos, chips, campo de busca, links da navegação e a barra inferior:** cápsula (999px).
- **Esqueleto e anel de foco:** 6px.
- **Marcadores de dado:** círculos (50%) para o marcador da faixa e o ícone de setor; o chip de atenção usa um losango, o de ponto forte um círculo cheio, o de contexto um círculo vazado.
- **Aresta:** sempre 1px, transparente sobre o degradê de borda do vidro ou em branco translúcido.

## Components

### Buttons
Discretos e de toque largo; só a ação principal é cheia.
- **Shape:** cápsula (999px), altura mínima 2.75rem.
- **Primary:** branco cheio com texto quase-preto, 0.5rem 1.5rem, peso 600. No hover vai a branco puro.
- **Secondary (padrão):** sub-superfície (véu de 4%, aresta de 8%, luz interna), texto branco; no hover véu de 7% e aresta de 18%.
- **Pressed:** `aria-pressed="true"` vira branco cheio; ao clicar desce 1px em 100ms. Desabilitado a 40% de opacidade.

### Chips
- **Pílula de tom:** cápsula baixa (1.75rem), véu de 14% da cor do tom e aresta da mesma cor a 30%: acento, alta, queda ou neutro.
- **Chip de sinal:** 1.5rem, caption, forma + cor + palavra (círculo cheio forte, losango atenção, círculo vazado contexto).
- **Selo de sinal:** cápsula de sub-superfície de 2rem com ícone SVG na cor do sinal e o texto em branco; é ele que leva o sinal nos cartões de ações.

### Cards / Containers
- **Corner Style:** 22px.
- **Background:** a receita de vidro: duas manchas radiais de tamanho fixo (26rem × 21rem e 24rem × 19rem) em cantos opostos, interpoladas em oklab e esmaecendo até 72%, sobre o corpo opaco, com a aresta em degradê recortada na faixa da borda. Num cartão curto as manchas tomam o cartão; num alto ficam como luz nos cantos. Cartões compactos podem encolher as manchas (16rem × 13rem) para manter o mesmo efeito.
- **Shadow Strategy:** só luz de aresta (ver Elevation & Depth).
- **Border:** 1px transparente sobre o degradê de aresta.
- **Internal Padding:** 2rem (1.5rem no KPI, 1rem no celular).
- **Sem mancha:** cartão sem `data-brilho` mostra a mancha branca a 3%, quase neutra.

### Inputs / Fields
- **Style:** busca em cápsula de sub-superfície, 2.75rem de altura, 1rem de respiro lateral.
- **Focus:** contorno branco de 3px com 2px de afastamento, sem halo.

### Navigation
- **Computador:** barra translúcida de ponta a ponta, fixa no topo, com desfoque e um fio de 1px embaixo. Marca em Atkinson Hyperlegible Next 800 com o Cotinha ao lado do nome. Links em pílula de 2.5rem, Atkinson Hyperlegible Next 600 0.9375rem, em prata; hover com véu de 7% e texto branco; página atual com véu branco de 9%, aresta interna de 10% e texto branco, sem cor de destaque.
- **Celular (até 720px):** pílula flutuante de vidro na base da tela, com as quatro primeiras páginas e o menu Mais; cada item tem ícone e rótulo em caption; o ativo usa a mesma pílula de véu branco.

### Cartão KPI (signature)
O cartão dos números do dia é a assinatura do sistema: placa de vidro com o par de manchas da direção do preço, título em Atkinson Hyperlegible Next que reserva duas linhas, número enorme em Atkinson Hyperlegible Mono preso logo abaixo, variação com sinal em peso 600, e uma régua fina opcional (6px em três partes, ou trilho de 4px com marcador branco). A sobra de espaço fica no pé.

### Malha de pontos (signature)
Canvas fixo atrás de tudo: pontos brancos a 10% que acendem até 60% perto do cursor; um movimento rápido empurra os pontos, que voltam com mola elástica (gsap). Só reage com ponteiro fino e sem pedido de menos movimento; no resto fica parada. Dorme quando ociosa. Decorativa (`aria-hidden`).

### Aviso e erro
Mesma fórmula: véu de 8% da cor com aresta a 30-32%, 14px de canto, texto branco. Aviso em amarelo-limão, erro em rosa de queda.

### Marca (CotAI)
Logo = Cotinha ocioso + nome em Atkinson Hyperlegible Next 700 com tracking -0.035em: "Cot" na cor do texto e "AI" em `--cor-mascote`, com o brilho de quatro pontas do Cotinha em `--cor-atencao` no alto do "I". Medidas em em, para servir em qualquer tamanho. No hover o Cotinha pula e o brilho gira um quarto de volta (só sem movimento reduzido). Componente `src/components/ui/Logo.jsx`, estilos em `src/styles/marca.css`; o nome vem de `TEXTOS.marca`. O rodapé repete a logo com uma frase. Seleção de texto e cursor de digitação usam `--cor-mascote`. Favicon: Cotinha com o brilho amarelo contornado.

### Mascote (Cotinha)
Um candle com olhos: corpo inteiro numa cor só, `--cor-mascote` (o verde-água do dado 6), sem lateral escura, olhos em `--cor-mascote-olho` (o fundo) e brilho branco. Componente `src/components/ui/Mascote.jsx`, animações em `src/styles/mascote.css`. Favicon em `public/favicon.svg`.
- **Humores** (o olhar muda, a forma é a mesma): `neutro` é o logo; `contente` para motivos a favor e boas-vindas; `atento` para ponto de atenção e erro; `pensativo` para espera; `dormindo` para lista vazia. Novos: `animado` (olhos em arco, pulinho) para pagamento próximo; `preocupado` (pálpebra caída, corpo encolhido) para tom com mais negativas e variação negativa; `surpreso` (olhos redondos, boca em "o", susto) para variação de 2% ou mais; `curioso` (um olho maior, corpo inclinado 6°) para tom empatado.
- **Onde aparecem:** abertura do Hoje (`humorDaVariacao` da variação do Ibovespa), tom das notícias (`humorDoTom`), proventos (`animado` com pagamento próximo, `dormindo` sem), fallback de carregamento (`pensativo`) e rodapé (`neutro` com `ocioso`).
- **Ações** (loop, independentes do humor): `ocioso` no logo, que olha para um lado, para o outro e pensa num ciclo de 16s; `acenando` no card de primeira vez; `moeda`, em que uma moeda surge ao lado do corpo, sobe e some a cada ciclo de 4 s, com um brilhinho, usada no resumo de proventos da página Hoje (junto do humor `animado`).
- **Vivo** (só no Top 5, ao lado da frase dos motivos): `contente` pula, olha para a frase e balança a cada 6 s; `atento` estica o pavio, se inclina para a frase e o pavio tremula a cada 5 s; `neutro` usa o ciclo do logo.
- **Regras:** sempre ao lado de uma frase, nunca sozinho. Decorativo (`aria-hidden`) por padrão; só ganha rótulo quando a figura carrega sentido sozinha. No máximo um por bloco. Com movimento reduzido, fica parado (os pontos do pensamento e o z ficam à mostra).
- **Reações de chegada** (`contente`, `atento`, `animado`, `surpreso`) tocam uma vez, ao aparecer. Passar o mouse na marca faz o Cotinha pular, só sem movimento reduzido.

### Movimento

Trocas de aba e de nível usam `trocarComTransicao(fn, 'suave')`: só um fade de 220ms. Troca feita pela URL passa `flushSync: true` ao roteador, para o conteúdo novo entrar no quadro capturado. Listas que crescem por clique usam `useAlturaSuave`. A coreografia do porquinho fica em `src/lib/cofrinho3d.js`.
A interface deve parecer fluida: nada pisca de um estado para outro. Tokens em `src/styles/tokens.css`: `--curva` (cubic-bezier(0.16, 1, 0.3, 1)), `--duracao-entrada` (340ms), `--duracao-saida` (160ms, a saída é mais rápida), `--duracao-toque` (120ms), `--passo-onda` (25ms) e `--passo-lista` (12ms).
- **Entrada** 280-420ms com `--curva`; **saída** 120-180ms. Sem quique nem elástico.
- **Só** transform, opacity e filter leve. Nunca animar width, height, top ou left (exceção: o marcador do seletor, que muda a largura ao deslizar).
- **Estado padrão sempre visível:** se o JS ou a animação falhar, o conteúdo aparece como estaria.
- **Troca de período** (Setores, Mercado, ficha): `trocarComTransicao` (`src/lib/movimento.js`) envolve a troca numa transição de vista. Cada cartão e cada linha do ranking tem nome próprio, então desliza até a nova posição; o cartão recolhe (escala 0,96, fade) e reaparece. O marcador da aba ativa desliza até a nova opção.
- **Rotas:** transição de vista do react-router (`viewTransition`): a tela esmaece e sobe 8px; o cabeçalho fica parado.
- **Ondinha nas bolinhas do setor:** entram em onda (escala 0,4 a 1); no hover ou foco do cartão, uma onda sobe 3px e volta. Pílulas sobem 2px no hover. O total fica perto de 400ms.
- **Listas** (mapa de ações, próximos pagamentos, manchetes, ranking de proventos): cascata com a classe `entra-lista`, teto de cerca de 300ms.
- **Números da ficha:** `NumeroAnimado` usa o `Contador` (adaptado do Counter do React Bits; aviso em `src/components/ui/LICENCA-REACT-BITS.md`): os dígitos rolam para cima e somem na borda. Sem movimento, o número aparece direto.
- **Índices do Mercado:** ao ligar um índice, a linha nova se desenha em 900ms e as outras deslizam para a nova escala (`trocaSuave` em `GraficoInterativo`).
- **Carregamento:** skeleton quando a forma do conteúdo é conhecida; `Carregador` (três barras em loop) quando não é. Os dois em `src/components/ui/Estados.jsx`.
- **Movimento reduzido** (`data-movimento='reduzido'` ou o pedido do sistema): nada se desloca; só fades curtos de opacidade (150ms) e nenhuma transição de forma.

## Do's and Don'ts

### Do:
- **Do** dar cor a um cartão só por um dos seis pares de `data-brilho`, escolhido por significado.
- **Do** escolher o par pela direção do preço quando o cartão fala de algo que se moveu (alta, queda, ou aço sem direção).
- **Do** usar branco (#f4f4f5) para todo estado ativo, foco e ação principal, com texto quase-preto por cima.
- **Do** usar sub-superfície para tudo que fica dentro de um cartão de vidro.
- **Do** escrever números de dado e tickers em Atkinson Hyperlegible Mono, tabular, com zero cortado.
- **Do** acompanhar toda cor de preço com sinal (+ ou −), palavra ou ícone.
- **Do** clarear a tinta suave para #dedee3 dentro de cartões com mancha.
- **Do** respeitar o pedido de menos movimento: malha parada, transições só de cor e opacidade.

### Don't:
- **Don't** usar âmbar ou laranja em interface; a única cor dourada é a do setor financeiro nos dados.
- **Don't** usar o amarelo de atenção em botão, estado ativo ou mancha.
- **Don't** pintar botão, aba, link ou navegação com cor de mancha ou de setor.
- **Don't** colocar vidro dentro de vidro, nem desfoque em cartão no fluxo da página.
- **Don't** dar sombra projetada a cartão; sombra escura difusa só no que flutua.
- **Don't** usar brilho neon (halo externo, texto com glow, sombra colorida); a cor vem só da luz atrás do vidro.
- **Don't** usar Atkinson Hyperlegible Mono em texto corrido ou em palavras no lugar de números.
- **Don't** usar rótulos em caixa-alta com espaçamento aberto.
- **Don't** usar preto puro (#000) como fundo.
