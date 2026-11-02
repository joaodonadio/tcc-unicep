---
name: Pregão em Linhas
description: O pregão da B3 em tema escuro cinza-quente, com âmbar como acento, cartões de cantos arredondados e setores em linhas de cor.
colors:
  fundo: "#1a1815"
  superficie: "rgb(255 255 255 / 0.045)"
  superficie-2: "rgb(255 255 255 / 0.08)"
  borda: "rgb(255 255 255 / 0.09)"
  fio: "rgb(255 255 255 / 0.06)"
  borda-forte: "rgb(243 239 231 / 0.5)"
  faixa: "rgb(255 255 255 / 0.045)"
  texto: "#f3efe7"
  texto-suave: "#b8b1a5"
  placa: "rgb(26 24 21 / 0.72)"
  placa-texto: "#f3efe7"
  placa-suave: "#a8a196"
  destaque: "#e8b84a"
  destaque-hover: "#f1c968"
  destaque-texto: "#1a1815"
  foco-plataforma: "#e8b84a"
  alta: "#8fc4a0"
  queda: "#e38b7f"
  estavel: "#b8b1a5"
  forte: "#8fc4a0"
  forte-fundo: "rgb(143 196 160 / 0.14)"
  atencao: "#e8b84a"
  atencao-fundo: "rgb(232 184 74 / 0.14)"
  contexto: "#c9c3b8"
  contexto-fundo: "rgb(255 255 255 / 0.08)"
  serie-1: "#e8b84a"
  serie-2: "#8fc4a0"
  serie-3: "#b8a6e8"
  serie-4: "#7d93bd"
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
    fontFamily: "'Manrope Variable', 'Manrope', system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Manrope Variable', 'Manrope', system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Manrope Variable', 'Manrope', system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  lead:
    fontFamily: "'Manrope Variable', 'Manrope', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "'Manrope Variable', 'Manrope', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "'Manrope Variable', 'Manrope', system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.2
  caption:
    fontFamily: "'Manrope Variable', 'Manrope', system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.25
  numero:
    fontFamily: "'Manrope Variable', 'Manrope', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
rounded:
  raio-1: "6px"
  raio-2: "10px"
  raio-3: "14px"
  raio-cartao: "22px"
  estacao: "50%"
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
    backgroundColor: "{colors.destaque}"
    textColor: "{colors.destaque-texto}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "0.5rem 1.5rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.destaque-hover}"
    textColor: "{colors.destaque-texto}"
  button-secondary:
    backgroundColor: "{colors.superficie-2}"
    textColor: "{colors.texto}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "0.5rem 1.5rem"
    height: "2.75rem"
  button-secondary-hover:
    backgroundColor: "{colors.superficie-hover}"
    textColor: "{colors.texto}"
  tab:
    textColor: "{colors.texto-suave}"
    typography: "{typography.label}"
    padding: "0.75rem 0"
  tab-selected:
    textColor: "{colors.texto}"
  input-search:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    typography: "{typography.body}"
    rounded: "{rounded.raio-2}"
    padding: "0.5rem 0.75rem"
    height: "2.75rem"
  chip-forte:
    backgroundColor: "{colors.forte-fundo}"
    textColor: "{colors.forte}"
    typography: "{typography.caption}"
    rounded: "{rounded.pilula}"
    padding: "0 0.5rem"
    height: "1.5rem"
  chip-atencao:
    backgroundColor: "{colors.atencao-fundo}"
    textColor: "{colors.atencao}"
    typography: "{typography.caption}"
    rounded: "{rounded.pilula}"
    padding: "0 0.5rem"
    height: "1.5rem"
  chip-contexto:
    backgroundColor: "{colors.contexto-fundo}"
    textColor: "{colors.contexto}"
    typography: "{typography.caption}"
    rounded: "{rounded.pilula}"
    padding: "0 0.5rem"
    height: "1.5rem"
  header-bar:
    backgroundColor: "{colors.placa}"
    textColor: "{colors.placa-texto}"
    typography: "{typography.label}"
  footer-bar:
    backgroundColor: "{colors.placa}"
    textColor: "{colors.placa-suave}"
    padding: "3rem 0"
  card:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.raio-cartao}"
    padding: "1.5rem"
  como-usar:
    backgroundColor: "{colors.faixa}"
    textColor: "{colors.texto}"
    rounded: "{rounded.raio-cartao}"
    padding: "1.5rem 2rem"
---

# Design System: Pregão em Linhas

## Overview

**Creative North Star: "A Sala de Painéis Noturna"**

O site lê o pregão como um painel de sala de operações, em tom sóbrio: fundo cinza-quente escuro, cartões translúcidos com fio claro e uma única cor de ação, o âmbar. Cada setor é uma linha com cor própria, cada ação é uma estação nessa linha, e o sinal de cada ação aparece pela forma da estação, não só pela cor. Verde e rosa-terra marcam alta e queda, sempre acompanhados de sinal ou palavra.

A leitura vem antes do enfeite. Os números são grandes, tabulares e alinhados. Objetos 3D (Three.js, modelos gerados no Blender) aparecem como explicação visual de uma ideia, ao lado do texto, e nunca substituem a informação escrita.

O mundo recusa o painel de trading com neon e fundo preto, e o dashboard de cartões brancos com número grande em azul.

**Key Characteristics:**
- Fundo cinza-quente (`#1a1815`), nunca preto puro; superfícies são brancos translúcidos (4,5% a 13%).
- Cartões com cantos de 22px, fio de 1px e sombra suave (`--sombra-cartao`); o painel de Ficha segue o mesmo padrão.
- Âmbar (`#e8b84a`) para ação, foco, seleção e série principal.
- Sinal pela forma da estação: círculo cheio para forte, losango para atenção, cápsula quando há os dois.
- Uma família (Manrope), pesos 400, 600, 700 e 800, números tabulares em toda coluna de dados.
- Objetos 3D como apoio visual, sob demanda, com alternativa em texto.

## Colors

Paleta de tema escuro: fundo cinza-quente, nunca preto puro. Cartões são superfícies translúcidas com fio claro, o texto é branco quente, e o âmbar é a única cor de ação e de seleção. Verde e rosa-terra marcam alta, queda e os sinais. As cores de setor ficam só nas linhas do mapa.

Os valores vêm de `src/styles/tokens.css`. Superfícies e fios são brancos translúcidos, por isso o DESIGN.md guarda o valor `rgb(...)` exato.

### Primary
- **Âmbar de Destaque** (destaque, foco-plataforma): botão principal, foco do teclado, item ativo e a série principal. No hover passa a `#f1c968` (destaque-hover). O texto sobre o âmbar é `#1a1815` (destaque-texto).
- **Fundo Grafite** (fundo): `#1a1815`, o chão de toda página.

### Secondary
- **Placa de Vidro** (placa): cabeçalho e rodapé, em cinza-quente translúcido sobre o fundo, com texto `#f3efe7` (placa-texto).
- **Faixa de Aviso** (faixa): superfície translúcida para blocos de aviso. Nunca é botão.

### Tertiary
- **Sálvia de Alta e de Ponto Forte** (alta, forte): `#8fc4a0`, com véu de 14% para o fundo do sinal (forte-fundo).
- **Âmbar de Atenção** (atencao): o mesmo âmbar do destaque, com véu de 14% (atencao-fundo).
- **Rosa-terra de Queda** (queda): `#e38b7f`, para variação negativa e tom negativo.
- **Cinza-claro de Contexto** (contexto): `#c9c3b8`, sobre fundo branco de 8% (contexto-fundo).
- **Cores de linha** (linha-financeiro a linha-outros): dez cores de setor e uma neutra para "outros", mapeadas pelo nome do setor. Aparecem no trilho do mapa do pregão, no marcador de setor e no fio de topo da ficha. Setor sem mapeamento cai em linha-outros.
- **Séries de gráfico** (serie-1 âmbar, serie-2 sálvia, serie-3 lavanda, serie-4 azul-aço): ação, setor e referência no mesmo eixo. Os gráficos de dados usam `--cor-dado-1` a `--cor-dado-7`.

### Neutral
- **Superfície** (superficie, superficie-2): cartões com 4,5% de branco e hover com 8%.
- **Fio** (fio, borda): fio de 6% e contorno de 9% de branco. Borda-forte (50% de branco quente) marca contornos de campo e de foco secundário.
- **Texto Suave** (texto-suave, estavel): `#b8b1a5`, para introduções, rótulos de coluna e variação estável.
- **Prata de Placa** (placa-suave): `#a8a196`, para data e textos de apoio no cabeçalho e no rodapé.

### Named Rules
**The Linha Só no Setor Rule.** Cor de linha identifica setor e nada mais. Nunca em botão, texto de corpo, sinal ou estado.

**The Uma Cor de Ação Rule.** Tudo que se aperta para agir, e tudo que está selecionado, é âmbar. Verde e rosa-terra indicam direção de preço e sinal; eles nunca são botão.

**The Nunca Só Cor Rule.** Todo sinal e toda direção de preço vêm com forma, sinal gráfico ou palavra além da cor.

## Typography

**Display Font:** Manrope Variable (com Manrope, system-ui, sans-serif), servida pelo próprio projeto por `@fontsource-variable/manrope`
**Body Font:** a mesma família
**Label/Mono Font:** a mesma família, com números tabulares nas colunas de dados

**Character:** geométrica e calorosa, com algarismos tabulares. A hierarquia vem do tamanho, do peso e do contraste de cor.

### Hierarchy
- **Display** (800, 2.75rem; 2.125rem em telas de até 720px, 1.1, -0.02em): título de página, como o nome da ação no topo da ficha.
- **Headline** (700, 1.875rem, 1.15, -0.01em): título de seção e pergunta da ficha.
- **Title** (700, 1.5rem): título de bloco, de mapa e de cartão.
- **Lead** (400, 1.25rem, 1.5): resumo do dia em frases; com peso 600 vira nome da empresa e preço na ficha.
- **Body** (400, 1.0625rem, 1.55): texto corrido, sobre base de 16px multiplicada pelo zoom de leitura (de 90% a 130%).
- **Label** (600, 0.9375rem): botões, abas, links do cabeçalho e rótulos de coluna.
- **Caption** (600, 0.8125rem): códigos no mapa, nome de setor, notas e marcadores de sinal.
- **Número** (600, tabular): valores de fatos, preços e indicadores; alinhados à direita nas tabelas.

### Named Rules
**The Escala Fixa Rule.** Só os sete degraus de tamanho dos tokens (`--texto-xs` de 0.8125rem a `--texto-3xl` de 2.75rem). Nada de tamanho fluido nem valor fora da escala.

**The Três Pesos Rule.** Corpo 400, destaque 600 e títulos 700. Títulos de página usam 800 (`--peso-forte`).

**The Número Tabular Rule.** Todo número em coluna, fato ou valor usa algarismos tabulares, para que preço e variação alinhem.

**The Sem Caixa-Alta Rule.** Nenhum rótulo em caixa-alta com espaçamento aberto. Títulos têm espaçamento levemente negativo.

## Layout

- **Largura:** o conteúdo fica num bloco `.pagina` de até 80rem (`--largura-max`), centralizado, com 1.5rem de respiro lateral.
- **Ritmo:** espaçamentos da escala `--espaco-1` (0.25rem) a `--espaco-9` (6rem). Seções são separadas por espaço de `--espaco-6` ou `--espaco-7`, com um fio de 1px quando ajuda a ler.
- **Cabeçalho:** placa translúcida fixa no topo (`--cor-placa`), com marca, páginas, Minha lista e o botão Leitura. Em 721px a 1279px, as páginas extras vão para o menu Mais. A partir de 1280px a linha inteira aparece.
- **Celular (até 720px):** a navegação passa para uma barra inferior (`--altura-barra-inferior`, 4.5rem) mostra as quatro primeiras páginas e o menu Mais.
- **Grades:** blocos de dados usam grades de duas ou três colunas em telas largas e uma coluna no celular.
- **Ficha:** a pergunta aberta ocupa a área principal, e as perguntas ficam em abas no topo.

## Elevation & Depth

Profundidade vem da cor, do fio e da sombra suave de cartão. A sombra `--sombra-cartao` (0 10px 30px -12px, a 50% de preto) fica nos cartões e em painéis suspensos.

Camadas (`--z-*`): cabeçalho 40, painéis 50, barra inferior 60, balão de termo 90, link de pular conteúdo 100.

Foco do teclado: contorno de 2px em âmbar, com deslocamento de 3px e um anel escuro de 5px por fora. É a única sombra de contorno no site.

**Brilho:** o site não usa brilho neon nem halos coloridos. A marca do cabeçalho é um ponto âmbar chapado.

## Shapes

- **Cartões e painéis:** cantos de 22px (`--raio-cartao`).
- **Campos de busca e blocos menores:** cantos de 10px (`--raio-2`).
- **Botões, chips, seletores e pílulas:** cápsula (`--raio-pilula`, 999px).
- **Estações do mapa:** círculo perfeito (50%). O losango marca atenção, e a cápsula marca os dois sinais ao mesmo tempo.
- **Fio e foco:** cantos de 6px (`--raio-1`).

## Components

### Botões
- **Principal** (`.botao` com ação principal): fundo âmbar, texto escuro (`--cor-destaque-texto`), cápsula, altura mínima de 2.75rem. No hover, o âmbar clareia para `#f1c968`.
- **Secundário** (`.botao`): fundo `--cor-superficie-2`, texto claro, borda de 1px, cápsula. No hover, ganha `--cor-superficie-hover`.
- **Discreto** (link de ação): só texto, sem fundo.
- Ao clicar, o botão desloca 1px para baixo (`transform`, 100ms), para dar retorno imediato.

### Seletores e abas
- **Segmentado** (Simples e Técnica, tamanho do texto): grupo em cápsula com a opção ativa em `aria-pressed="true"`.
- **Abas** (perguntas da Ficha, filtros da página Ações): `role="tab"` com `aria-selected`, que indica a aba escolhida.
- O estado visual sempre vem de `aria-*`, nunca de uma classe de estado.

### Sinais e chips
- **Ponto forte** (`chip-forte`): texto sálvia com fundo de 14%.
- **Atenção** (`chip-atencao`): texto âmbar com fundo de 14%.
- **Contexto** (`chip-contexto`): texto cinza-claro com fundo de 8%.
- Os chips sempre trazem o nome do sinal. A cor nunca carrega o sentido sozinha.

### Cabeçalho e rodapé
- **Cabeçalho:** placa translúcida, texto claro, o link da página atual recebe `aria-current` e destaque visual.
- **Rodapé:** mesma placa, com texto em `--cor-placa-suave` e o aviso fixo de conteúdo educativo.
- **Botão Leitura:** abre um painel suspenso (`role="region"`) com as opções de explicação e de tamanho. Esc e clique fora fecham.

### Cartões e faixas
- **Cartão** (`.cartao`): superfície translúcida, fio de 1px, cantos de 22px, padding de 2rem e sombra suave.
- **Como usar** (`.como-usar`): faixa de fundo `--cor-faixa`, com cantos de 22px. Pode ser fechada, e o estado fica guardado no navegador.

### Termos com balão
Termos sublinhados com pontilhado (`.termo-botao`) abrem um balão com a explicação. O balão fecha com Esc e com clique fora. Não existe painel lateral de glossário.

### Mapa do pregão
Cada setor é uma linha com cor própria (`--linha-*`). Cada ação é uma estação. A forma da estação diz o sinal, e a lista textual ao lado traz as mesmas informações.

### Gráficos
- **SVG:** gráficos próprios e sparklines. Têm `role="img"` e `aria-label` com a descrição da série.
- **ECharts:** em alguns gráficos de dados (boxplot e gráfico interativo), com as cores `--cor-dado-1` a `--cor-dado-7`.
- Cores de série: âmbar, sálvia, lavanda e azul-aço. Verde e vermelho só aparecem para alta e queda.

### Estados
- **Carregando:** esqueleto de linhas (`Linhas`) no lugar do conteúdo.
- **Erro:** bloco com `role="alert"`, mensagem em português e um botão para tentar de novo.
- **Vazio:** frase curta explicando por que não há dados, sem número de exemplo.

### Objetos 3D
Os objetos 3D (Three.js, com modelos `.glb` gerados no Blender por `scripts/blender/`) ilustram uma ideia da Ficha e do Top 5. A biblioteca carrega sob demanda. Eles são decorativos, com a explicação escrita ao lado. Sem WebGL, o objeto não aparece e o texto continua.

## Do's and Don'ts

### Do:
- **Do** usar só as cores e os tamanhos dos tokens em `src/styles/tokens.css`.
- **Do** usar âmbar para ação, foco e seleção, e verde ou vermelho só para alta e queda.
- **Do** acompanhar toda cor de preço com sinal (+ ou −) ou palavra.
- **Do** alinhar números em colunas com algarismos tabulares.
- **Do** manter movimento sutil, com a curva `--curva`, e respeitar `prefers-reduced-motion`.
- **Do** oferecer uma explicação escrita para cada objeto 3D.

### Don't:
- **Don't** usar caixa-alta nos rótulos (`text-transform: uppercase` está proibido).
- **Don't** usar borda lateral grossa e colorida para destacar um bloco.
- **Don't** usar cor de setor em botão, texto corrido ou sinal.
- **Don't** usar brilho neon, fundo preto chapado ou cartões brancos com contorno.
- **Don't** usar peso acima de 800 nem cantos acima de 22px.
- **Don't** usar só cor para dizer um sinal ou uma direção.
- **Don't** usar movimento contínuo sem pausa quando a animação sai da tela.
