# Ações da B3 — regras do projeto

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

### Dados que faltam na API privada

| Dado | Usaria em | Situação |
|---|---|---|
| Meta da Selic (valor atual e histórico) | Hoje (card da Selic), Mercado (aba "Juros e dólar") | não existe em nenhum pacote; o card e a aba saíram |
| Dólar (USDBRL) em série diária, ou `indices.USDBRL.{m1,m6,a1}` em `mercado_dia` | Hoje (mini gráfico do dólar), Mercado (períodos da linha Dólar) | `mercado_dia` só traz o valor e a variação do dia |
| Brent em série ou por períodos | Mercado (períodos da linha Brent) | só o valor do dia |
| Título das notícias em português (ex.: `titulo_pt`) | Notícias, ficha da ação, "Tom das notícias" | manchetes vêm no idioma original; a tradução saiu |
| IPCA mensal com mês de referência (ex.: `{mes_ref, variacao}`) | Hoje (barras do IPCA) | hoje é derivado da série de índice `IPCA` (degrau no 1º dia útil, cortado por `ipca_ate`) |
| CDI mensal pronto, ou série que cubra 12 meses completos | Hoje (barras do CDI) | a janela `1a` dá só 11 meses completos |

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
