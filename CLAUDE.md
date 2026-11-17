# CotAI — regras do projeto

Painel educativo da bolsa brasileira para quem está começando. React 18 + Vite, React Query,
ECharts, three.js. Design em `DESIGN.md`, produto em `PRODUCT.md`, arquitetura em `docs/`.

## Dados: só a API privada

- **O front não faz nenhuma consulta a API pública.** Nada de Banco Central, Google, Yahoo,
  brapi, B3, IPEA ou qualquer outro serviço externo — nem direto, nem por proxy do Vite.
- Todo dado vem da API privada, pelo cliente em `src/services/cliente.js`
  (`fonteApi.js` → `/api/v1/...`, ou `fonteArquivos.js` → `public/dados/*.json`, que espelha
  os mesmos pacotes) e pelos hooks de `src/hooks/useDados.js`. `fetch` só existe em `src/services/`.
- Valores simulados só com `VITE_FONTE_DADOS=simulado` (`src/services/fonteSimulada.js`, geradores em `src/lib/simulacao.js`); o padrão de produção é `api`. A fonte simulada existe só para o design: seus números nunca são tratados como reais.
- **Se um dado necessário não existe na API privada, não busque em outro lugar:** deixe o
  componente sem ele (ou fora da página) e **relate ao usuário** o que falta, com o campo
  esperado e a tela que ele alimentaria. Registre na lista abaixo.
- Fontes tipográficas e qualquer outro recurso também são locais (`@fontsource-variable`),
  nunca por CDN.

### Dados que a API privada não vai mandar (resolvidos no front)

| Dado | Como o site resolve |
|---|---|
| Ajuste de grupamento/desdobramento (`fator_ajuste`; RAIZ4 em 03/11/2026) | O fator não é calculado: a razão real (ex.: 0,30 → 27,10) não diz se foi 100:1 com queda ou 90:1. A interface descarta variação acima de +100% ou abaixo de −75% no dia e janelas com salto de escala (`src/lib/crivel.js`), com o selo "mudou de escala"; o gráfico de preço da ficha começa depois do último salto (`ultimoSalto`) |
| Proventos de todas as ações numa rota só | O servidor do Vite junta as 85 consultas de `/v1/proventos/{ticker}` na rota local `/api/v1/proventos-todos` (`scripts/proventosAgregados.mjs`, só na memória); sem a rota, o cliente consulta ação por ação (`src/services/proventosTodos.js`) |
| Fatos de mercado que explicam um salto real (ex.: 26/10/2026, pregão após o 2º turno, Ibovespa −13,88% com circuit breaker; confirmado pela equipe da API) | Lista fixa em `src/lib/eventosMercado.js` + `TEXTOS.eventos`: marcação "Eleição" nos gráficos de linha e nota curta. Queda real forte não é "mudou de escala": o critério de salto usa os mesmos limites do dia (+100% / −75%) |
| Abertura, máxima e mínima diárias por ação | Sem gráfico de velas por ação na ficha (só linha de fechamento). As velas por setor de Setores saem dos fechamentos diários (máxima e mínima de fechamento), pela rota local `/api/v1/velas-setores` ou pelas séries de 1 ano |

### Número calculado no site sempre se mostra

- Toda conta feita no site com os dados da API tem uma entrada em `TEXTOS.contas.itens` (usa / como / aparece em) e o selo `<SeloCalculo conta="…" />` (`src/components/ui/SeloCalculo.jsx`) onde o número aparece, **só quando a conta de fato é feita** (origem dinâmica: série publicada não leva selo). A página Dados lista todas em "O que o site calcula" (`ContasDoSite.jsx`, âncora `#conta-<chave>`).
- Nada de estimar o que não sai dos dados (ex.: fator de grupamento).

### Deploy (Vercel)

`vercel.json` + `api/`: `api/proxy.js` repassa `/api/v1/*` à API com `X-API-Key` (env `API_BASE_URL`, `API_KEY`; `VITE_FONTE_DADOS=api`); as rotas montadas (`proventos-todos`, `dolar-historico`, `series-semana`, `velas-setores`) são funções em `api/v1/` que reutilizam `scripts/*.mjs`. Cache só na CDN (`s-maxage`), nunca no navegador.

Título das notícias em português: a API não vai fazer. As manchetes ficam no idioma original.

### Campos que vêm da API a partir de 16/11/2026 (com volta à conta local se ausentes)

Campo ausente (`undefined`) = a API ainda não manda, e a tela usa a conta local. Presente sem `status: "ok"` = indisponível, e fica `null`.

| Campo | Usado em | Sem ele |
|---|---|---|
| `resumo_acao.variacao_preco.s1` / `rentabilidade.s1` | Setores (1 semana), ficha (coluna 1 semana da tabela de retornos) | rota local `/api/v1/series-semana` (`scripts/seriesSemana.mjs`) ou 85 séries; a ficha fica sem a coluna |
| `mercado_dia.indices.USDBRL.{d1,m1,m6,a1}` / `indices.BRENT.{...}` | Mercado (períodos das linhas Dólar e Brent) | dólar pela série (`useSerieDoDolar` + `periodosPorCalendario`); Brent só com o valor do dia |
| `series_diarias/USDBRL` | Hoje (mini gráfico), Mercado (gráfico do dólar) | rota local `/api/v1/dolar-historico` (`scripts/dolarHistorico.mjs`), montada pelas publicações de `mercado_dia` desde 16/10/2026 |
| `series_diarias/SELIC` (tipo `taxa`; `indice_retorno_total` é a meta ao ano, nível, não índice) | Mercado (gráfico de juros) | estimativa pelo índice `CDI` (`selicPelaSerieCdi`); o valor de hoje já vem de `mercado_dia.selic_meta` |
| `series_diarias/BRENT` | nenhum lugar ainda (não há gráfico de Brent); `serieDoCampo` já pula pontos indisponíveis | — |
| `mercado_dia.ipca_mensal` (`[{mes_ref, variacao}]`, mês de referência) | Hoje (barras do IPCA) | derivado da série `IPCA` (degrau no 1º dia útil, cortado por `ipca_ate`) |
| `mercado_dia.cdi_mensal` (12 meses completos) | Hoje (barras do CDI) | série `CDI` de 1 ano (só 11 meses completos) |

## Conteúdo e linguagem

- Todo texto de interface fica em `src/lib/textos.js` (`TEXTOS`). Textos com dois níveis
  usam `{ simples, tecnico }` e são lidos com `porNivel(valor, nivel)`; os dois precisam ser diferentes.
- Conteúdo educativo, nunca indicação. `src/test/lib/linguagem.test.js` varre todo o `src`
  (inclusive comentários), `docs/`, `README.md` e `PRODUCT.md` e reprova termos de conselho de
  investimento, imperativo de compra, promessa de chance única e ranking de "as melhores". Veja a
  lista lá antes de escrever texto ou comentário.
- Sem caixa-alta com espaçamento aberto. Frases curtas, sem jargão no nível simples.

## Código

- Nomes, comentários e mensagens em português, no estilo do arquivo vizinho; comentários curtos.
- Pastas: `src/components/<área>`, `src/hooks`, `src/lib` (funções puras), `src/services`
  (rede), `src/styles/<área>.css`, `src/test` espelhando `src`.
- Valor ausente é `null`, nunca `0`. Nada inventado para preencher lacuna.
- ESLint: `no-unused-vars` é erro (exceto nomes com maiúscula ou `_`); arquivo `.jsx` só
  exporta componentes — funções puras vão para `.js`.
- Gráficos: ECharts modular (`echarts/core` + só os módulos usados), renderer SVG, opções em
  funções puras testáveis (`src/components/graficos/opcoes*.js`). ECharts não lê `var()`:
  cores passam por `resolverCor` / `temaGraficos()` de `src/lib/temaGraficos.js` (com `RESERVA`).
- Não adicionar dependência sem necessidade clara.

## Visual e acessibilidade

- Siga `DESIGN.md`. Cores e medidas só por tokens (`src/styles/tokens.css`).
- Cartões de vidro com receita única (`--vidro`, em `base.css`); a cor do assunto vem de
  `data-brilho` (`alta | queda | acento | dado | lavanda | aco`). Na página Hoje o vidro é
  translúcido (`--vidro-base-translucido` + `--vidro-desfoque`), com volta ao opaco em
  `prefers-reduced-transparency`.
- Alta e queda nunca só por cor: sempre com sinal, palavra ou ícone.
- Movimento reduzido: `movimentoReduzido()` (`src/lib/movimento.js`) no JS e
  `:root[data-movimento='reduzido']` no CSS. Toda animação nova respeita os dois.
- Conteúdo recolhido fica no DOM com `inert`; botões de abrir usam `aria-expanded` + `aria-controls`.
- Gráfico tem `role="img"` com `aria-label` descrevendo o que mostra.
- Tipografia: Atkinson Hyperlegible Next (títulos e texto) e Atkinson Hyperlegible Mono (só números de dado e códigos), self-hosted por `@fontsource`.

## Comandos

- `npm run dev` — servidor local (dados de `public/dados/` por padrão).
- `npx vitest run` — testes (jsdom; `src/test/setup.js`). `fetch` de teste responde 503 fora de `dados/*.json`.
- `npm run lint` — ESLint.
- `npx vite build` — build de produção.

Antes de dizer que terminou: testes, lint e build passando.
