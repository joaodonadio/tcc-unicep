# Plano: Documento de Arquitetura da Interface — InvestIA (Sistema Inteligente para Análise de Dados Financeiros e Investimentos)

## Contexto

Este documento especifica a arquitetura completa do **front-end InvestIA**, a interface do TCC "Sistema Inteligente para Análise de Dados Financeiros e Investimentos". Ele é o **documento-irmão** de dois outros artefatos do projeto:

- **`arquitetura-e-treinamento.md`** (projeto maior / back-end): pipeline de predição — ingestão de notícias/preços/tweets → NLP de sentimento (FinBERT-PT-BR) → séries temporais (XGBoost vs LSTM) → fusão híbrida → **API REST FastAPI** com `/predictions/{ticker}`, `/sentiment/{ticker}`, `/history/{ticker}`. A interface descrita aqui é a **consumidora** dessa API.
- **`PLANO-FRONTEND.md`** (este repositório): a "receita de bolo" de execução em 19 fases, com os 12 mandamentos de IHC (M1–M12) que fundamentam cada decisão abaixo.

A interface já possui um **protótipo funcional de alta fidelidade** (`InvestIA - Sistema Inteligente.html`), construído e validado visualmente. Este documento converte o protótipo em especificação: cada tela, bloco, interação e microdecisão do protótipo vira requisito rastreável, com justificativa técnica e de IHC. O deliverable do desenvolvimento é a reimplementação fiel do protótipo em **React + Vite + JavaScript**, conectada à API real (com camada mock-first até a API existir).

**Princípio central do produto:** o sistema *explica* o mercado para investidores não-profissionais — cada número vem acompanhado de evidências, nível de confiança e tradução em linguagem simples. A interface nunca induz decisão: informa, contextualiza e registra a escolha do usuário.

---

## 1. Visão geral da arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PROJETO MAIOR (back-end)                          │
│  Web Scraping → Pré-proc. → FinBERT-PT-BR + XGBoost/LSTM → PostgreSQL       │
│                                   │                                          │
│                        API REST (FastAPI, JSON)                              │
│   /predictions/{ticker} · /sentiment/{ticker} · /history/{ticker}            │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTPS/JSON
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                        FRONT-END InvestIA (este documento)                   │
│                                                                              │
│  services/ (Axios, instância única, interceptors)                            │
│      │  ↕ adapter mock-first (VITE_USE_MOCKS)                                │
│  hooks/ (React Query — cache, staleTime por tipo, refetch, mutations)        │
│      │                                                                       │
│  ┌─────────┬──────────────────┬───────────┐                                  │
│  │  HOJE   │  RECOMENDAÇÕES   │  MERCADO  │  ← 3 telas                       │
│  └─────────┴──────────────────┴───────────┘                                  │
│      │                                                                       │
│  Camada de EXPERIÊNCIA (transversal a todas as telas):                       │
│  Tour guiado · Modo Calmo · Explicações Simples/Técnicas · Zoom A−/A+ ·      │
│  TTS ("Ouvir o resumo") · Diário de decisões · Disclaimer permanente         │
└─────────────────────────────────────────────────────────────────────────────┘
```

Decisões de alto nível (detalhadas nas seções seguintes):

| Decisão | Escolha | Justificativa resumida |
|---|---|---|
| Padrão de app | SPA (React Router, 3 rotas) | Navegação instantânea entre telas preserva o contexto analítico (M1, M12) |
| Estado de servidor | React Query | Cache + refetch automático eliminam Redux; dados do dia são a única fonte de verdade |
| Estado de cliente | Context API (3 contexts) | Apenas preferências (nível, calmo, zoom) e diário — volume mínimo |
| Dados | Mock-first com adapter | Desenvolvimento e defesa do TCC independem do back-end; troca em 1 ponto |
| Visual | Dark-first, tokens fixos | Padrão de plataformas financeiras; contraste máximo para dados |
| Renderização de dados | Canvas (globo/mapa/orbe) + SVG (sparklines/gráfico) | Canvas para animações densas a 60fps; SVG para gráficos interativos declarativos |

---

## 2. Telas e requisitos funcionais (inventário fiel do protótipo)

Cada requisito é rastreado ao mandamento de IHC (M1–M12, definidos no PLANO-FRONTEND.md) que o justifica. Identificadores `RF-x.y` para citação na monografia.

### 2.1 Navegação global (presente em todas as telas)

| ID | Requisito | IHC |
|---|---|---|
| RF-0.1 | Navbar flutuante fixa com logo pulsante "InvestIA · ANÁLISE INTELIGENTE" e 3 itens: Análise de hoje · Recomendações · Mercado; item ativo com fundo claro invertido | M4, M6 |
| RF-0.2 | Badge de status vivo "ANÁLISE CONCLUÍDA" (ponto verde pulsante); variantes "MERCADO VOLÁTIL" e "ANALISANDO…" conforme estado do sistema | M1 |
| RF-0.3 | Badge "🕊 MODO CALMO" visível na navbar quando ativo | M1, M3 |
| RF-0.4 | Rodapé permanente: "PROTÓTIPO ACADÊMICO · TCC · DADOS FICTÍCIOS" + "As análises exibidas são simuladas e não constituem recomendação de investimento." | Ética/CVM |

### 2.2 Tela HOJE (rota `/`, tela inicial pós-abertura)

| ID | Requisito | IHC |
|---|---|---|
| RF-1.1 | Saudação personalizada "Bom dia, {nome}." + data do dia + frase-síntese com o nº de oportunidades em destaque ciano | M2, M11 |
| RF-1.2 | 4 estatísticas com contadores animados (~1,3s, easing cúbico): oportunidades, riscos importantes, ativos analisados, sentimento do mercado | M1, M11 |
| RF-1.3 | **Globo 3D de ativos** (canvas): esfera de ~950 pontos com rotação contínua e parallax ao mouse; 8 nós de ativos (PETR4, VALE3, WEGE3, ITUB4, MGLU3, HAPV3, BBAS3, ELET3) coloridos por tipo (ciano=oportunidade, âmbar=risco, azul-claro=neutro) com anéis pulsantes nos não-neutros, links entre nós, partículas de entrada ("dados do mercado") e saída ("recomendações") | M1, M11 |
| RF-1.4 | Nós do globo são **clicáveis**: abrem card de insight com tipo, ticker, nome, resumo e botão "Ver recomendação →" (que navega para a Central com o card já expandido); ativos neutros mostram texto padrão "comportamento dentro do padrão esperado" | M6, M12 |
| RF-1.5 | Legenda do globo (oportunidade/risco/neutro) + instrução "CLIQUE NOS ATIVOS PARA EXPLORAR" | M6, M10 |
| RF-1.6 | CTA primário "Explorar análise de hoje →"; link "Primeira vez aqui? Faça o tour guiado →"; timestamp "ÚLTIMA ANÁLISE ÀS HH:MM" | M1, M7, M10 |
| RF-1.7 | **Resumo do dia em 30 segundos**: parágrafo em linguagem 100% leiga + botão **"🔊 Ouvir o resumo"** usando Web Speech API (`SpeechSynthesis`, `pt-BR`, rate 0.95), alternando para "⏹ Parar de ouvir" | M2, M12, acessibilidade |
| RF-1.8 | **Diário de decisões** (aparece só quando há decisões): lista com badge SEGUIR/IGNORAR, ticker, nome e o snapshot "no momento da decisão: confiança X · risco Y" | M1, M6 |
| RF-1.9 | Card **Alertas inteligentes**: 3 itens com ponto colorido por severidade, texto e tempo relativo ("há 18 min") | M1 |
| RF-1.10 | Card **Agenda econômica**: 3 eventos com chip de data/hora, título, subtítulo e badge de impacto (Alto/Médio) | M1, M2 |

### 2.3 Tela CENTRAL DE RECOMENDAÇÕES (rota `/recomendacoes`)

| ID | Requisito | IHC |
|---|---|---|
| RF-2.1 | Cabeçalho + filtros em pills: "Todas · 6", "◆ Oportunidades · 4", "⚠ Atenção · 2" | M6, M12 |
| RF-2.2 | **Card de recomendação** (colapsado): badge de tipo, setor, `TICKER + título em frase` ("PETR4 apresenta cenário favorável"), resumo de 1 frase, **barra de confiança animada com %**, pill de risco (Baixo/Moderado/Alto com cor própria) | M1, M11 |
| RF-2.3 | Botão "Entender esta recomendação ▼" expande a análise completa (transição de max-height ~0,7s) | M12 (progressive disclosure) |
| RF-2.4 | Análise expandida — coluna esquerda: **"O QUE O SISTEMA IDENTIFICOU"** (3–4 evidências com ícone ▲▼→ colorido), **"POR QUE ISSO IMPORTA"** (parágrafo causal), bloco condicional por nível: **"Em palavras simples"** (verde, analogias do dia a dia) OU **"LEITURA TÉCNICA"** (azul, pares chave-valor: RSI, MACD, MM50×MM200, Beta, volume) e **"COMO O SISTEMA CHEGOU AQUI"** (timeline vertical de 4 passos numerados: coletou → processou → identificou → calculou) | M1, M2, M10, M12 |
| RF-2.5 | Análise expandida — coluna direita: sparkline 30 dias com área e cor pelo tipo + variação %; **"TERMOS EXPLICADOS"** (glossário inline com termo sublinhado pontilhado); **simulador "SIMULE ANTES DE DECIDIR"** (slider R$ 100–10.000 → "há 30 dias, teria hoje R$ X" com delta colorido e aviso "rentabilidade passada não garante resultados futuros"); **"ADEQUAÇÃO AO SEU PERFIL"** (barra % com rótulo alta/média/baixa); pergunta de **feedback "Esta análise foi útil?" Sim/Não** com mensagem de confirmação | M1, M5, M10 |
| RF-2.6 | **Registro de decisão**: botões "✓ Seguir recomendação" / "Ignorar por agora" → viram badge de estado com link "desfazer"; decisões alimentam o Diário (RF-1.8) com snapshot de confiança/risco | M1, M3, M5 |
| RF-2.8 | Rodapé de proveniência em cada card: "ANÁLISE GERADA ÀS HH:MM · FONTES: PREÇOS B3, NOTÍCIAS, INDICADORES TÉCNICOS" | M1, transparência |
| RF-2.9 | Seção **"Com base nos especialistas"** (Sistema × Mercado): cards por ticker com barra segmentada compra/neutro/venda, nº de casas de análise, preço-alvo médio, potencial % e frase de concordância ("Sistema e especialistas concordam" / "Especialistas divididos — o sistema recomenda cautela") | M1, M10, transparência |

### 2.4 Tela MERCADO (rota `/mercado`)

| ID | Requisito | IHC |
|---|---|---|
| RF-3.1 | Grade 4×2 de indicadores macro (SELIC, IPCA 12M, Dólar, Ibovespa, S&P 500, NASDAQ, Bitcoin, IFIX) com valor mono e delta colorido | M1, M11 |
| RF-3.2 | **Gráfico interativo do ativo em destaque** (PETR4): seletor de período 1M/6M/1A, linha+área SVG, **crosshair com tooltip** (valor R$ + data) seguindo o mouse, rótulos de início/fim do período | M1, M6 |
| RF-3.3 | **Mapa do Brasil em pontilhado** (canvas, contorno geográfico real simplificado) com pins de notícias georreferenciadas coloridos por sentimento (verde/vermelho/âmbar/neutro) + legenda | M2, M11 |
| RF-3.4 | **Setores em movimento**: 8 barras horizontais (Energia +2,1% … Varejo −1,8%) com cor por sinal e animação de largura | M11, M12 |
| RF-3.5 | **"A leitura do sistema"**: 3 cards de notícia com tag de tema, tom (POSITIVO/ALERTA/NEGATIVO), título, fonte + tempo, e bloco destacado "Leitura do sistema: …" conectando a notícia ao impacto nas recomendações | M1, M2, M12 |

### 2.5 Camada de experiência (controles fixos no canto inferior)

| ID | Requisito | IHC |
|---|---|---|
| RF-5.1 | **EXPLICAÇÕES Simples/Técnicas**: toggle global que alterna, em todos os cards, o bloco "Em palavras simples" ↔ "Leitura técnica" (RF-2.4) | M2, M12 |
| RF-5.2 | **MODO CALMO**: toggle que suaviza todas as cores de perda/alerta para cinza-azulado (`#93a5bf`) — em stats, evidências, barras de setor, badges, consenso — mantendo textos e níveis de risco intactos (cor nunca é o único canal) | M3, M8, acessibilidade |
| RF-5.3 | **TEXTO A−/A+**: zoom global de 90% a 130% em passos de 10%, com % visível | Acessibilidade (WCAG 1.4.4) |
| RF-5.4 | Botão flutuante **"? Ajuda"** abre o tour | M10 |
| RF-5.5 | **Tour guiado em 4 passos** (modal com overlay): Análise de hoje → Recomendações → Mercado → Feito para você; cada passo **navega para a tela correspondente**; dots de progresso, Anterior/Próximo/"Começar a usar", fecha com × | M6, M10 |

---

## 3. Contratos de dados de entrada (schemas JSON)

A interface consome a API REST do projeto maior. Como os endpoints existentes (`/predictions`, `/sentiment`, `/history`) entregam dados brutos de modelo, este documento propõe uma **camada BFF (Backend-for-Frontend)** — ou, na ausência dela, composição no próprio front — com os agregados abaixo. Todos os payloads validados no front (formato + campos obrigatórios); registro inválido → estado de erro do card, nunca tela quebrada.

**`GET /api/analise-do-dia`** — agregado principal (tela Hoje + Recomendações):

```json
{
  "gerado_em": "2026-07-14T09:42:00-03:00",
  "sentimento_geral": "otimista_moderado",
  "resumo_simples": "Bom dia! O mercado está tranquilo hoje...",
  "estatisticas": { "oportunidades": 4, "riscos": 2, "ativos_analisados": 8 },
  "recomendacoes": [{
    "id": "petr4", "ticker": "PETR4", "nome": "Petrobras", "setor": "ENERGIA · PETRÓLEO",
    "tipo": "oportunidade | risco",
    "titulo": "apresenta cenário favorável",
    "resumo": "Volume, tendência e noticiário convergem...",
    "confianca": 91, "risco": "Baixo | Moderado | Alto",
    "variacao_30d": "+6.2",
    "serie_30d": [37.6, 37.9, ...],
    "evidencias": [{ "direcao": "up|down|flat", "texto": "Volume 38% acima da média..." }],
    "porque": "Quando volume crescente acompanha...",
    "explicacao_simples": "Em palavras simples: mais gente está comprando...",
    "leitura_tecnica": [{ "indicador": "RSI (14)", "valor": "58 — zona neutra-positiva" }],
    "glossario": [{ "termo": "Volume negociado", "definicao": "quantidade de ações..." }],
    "adequacao_perfil": 74,
    "consenso": { "casas": 12, "compra": 8, "neutro": 3, "venda": 1,
                  "preco_alvo": 44.10, "potencial": "+10.7", "concordancia": "concordam | divididos" }
  }],
  "alertas": [{ "severidade": "info|positivo|atencao", "texto": "...", "quando": "há 18 min" }],
  "agenda": [{ "dia": "HOJE", "hora": "09:00", "titulo": "IPCA — Junho",
               "subtitulo": "IBGE · Inflação oficial", "impacto": "Alto|Médio" }],
  "indicadores": [{ "label": "SELIC", "valor": "14,75%", "delta": "estável", "sinal": "up|down|flat" }],
  "leituras": [{ "tag": "ENERGIA", "tom": "positivo|negativo|alerta", "titulo": "...",
                 "fonte": "Reuters · há 40 min", "leitura_do_sistema": "Impacto direto positivo para PETR4..." }],
  "mapa_noticias": [{ "lat": -22.9, "lon": -43.2, "tom": "positivo", "titulo": "Petróleo +2,1%", "sub": "PETR4 · litoral RJ" }]
}
```

**Justificativas:** (a) `explicacao_simples` e `leitura_tecnica` vêm **prontos do back-end** — o front nunca gera conteúdo analítico, só o exibe (separação de responsabilidade e auditabilidade); (b) `serie_30d` embutida evita N+1 requests para as sparklines; (c) `gerado_em` alimenta o requisito de timestamp em todo card (M1).

**Endpoints complementares:** `GET /api/historico/{ticker}?periodo=1M|6M|1A` (gráfico interativo, RF-3.2 — proxy de `/history/{ticker}`); `POST /api/decisoes` `{recomendacao_id, acao: "seguir"|"ignorar", snapshot: {confianca, risco}}` (diário, RF-2.6); `POST /api/feedback` `{recomendacao_id, util: bool}` (RF-2.5).

**Estratégia mock-first:** `mocks/` contém exatamente estes JSONs com os dados do protótipo (8 ativos, 6 recomendações, 3 leituras, 5 pins, 5 alertas, 5 eventos); adapter ativado por `VITE_USE_MOCKS` devolve com latência simulada 300–800ms e taxa de erro configurável — os 4 estados de cada card (skeleton/dados/vazio/erro) são exercitados desde o primeiro dia.

---

## 4. Decisões técnicas de implementação

### 4.1 Stack base
- **React 18 + Vite + JavaScript** (exigência do escopo): dev server ESM com HMR; build Rollup com code splitting por rota (`React.lazy` nas 3 telas).
- **React Router**: `createBrowserRouter` + layout com `<Outlet/>`; navbar monta uma única vez.
- **React Query**: `['analise-do-dia']` com `staleTime` 60s e `refetchInterval` 5min (a análise é recalculada periodicamente no back); `['historico', ticker, periodo]` com `staleTime` 5min; mutations com optimistic update para decisões e feedback (resposta instantânea, M1).
- **Context API**: `PreferencesContext` (nível simples/técnico, modo calmo, zoom — persistidos em `localStorage`), `TourContext` (passo atual), `DecisionsContext` (espelho local do diário). Sem Redux: todo estado de servidor vive no React Query.

### 4.2 Design system (tokens extraídos do protótipo)

| Token | Hex | Papel |
|---|---|---|
| `background` | `#04070f` | Fundo (quase-preto azulado) |
| `surface` | `rgba(255,255,255,0.03)` + borda `rgba(255,255,255,0.09)` | Cards translúcidos com blur |
| `primary` | `#2f6bff` | CTAs, links de ação, série do gráfico |
| `accent` | `#7defff` | Identidade IA: oportunidades, destaques, badges |
| `success` | `#3fd99a` | Alta, confirmação |
| `warning` | `#ffc466` | Risco, atenção, agenda |
| `danger` | `#ff7a7a` | Queda, tom negativo (→ `#93a5bf` no Modo Calmo) |
| `text` | `#eef3fb` / `#93a5bf` / `#5c6b84` | 3 níveis de hierarquia |

- **Tipografia:** Sora (display/UI — personalidade tecnológica do protótipo) + JetBrains Mono (valores, tickers, labels de sistema em letter-spacing largo). Self-hosted via `@fontsource`.
- **Implementação:** CSS custom properties + Tailwind `@theme`; Modo Calmo troca só as variáveis de perda/alerta (uma classe no root), nunca componente a componente.

### 4.3 Renderização gráfica — quando canvas, quando SVG
- **Canvas 2D** (imperativo, 60fps): globo 3D de ativos (projeção esférica com rotação por matriz, ~950 pontos + 8 nós com hit-testing próprio para clique/hover), mapa pontilhado do Brasil (polígono geográfico + teste ponto-em-polígono para preencher com dots). Encapsulados em componentes com `useRef` + `requestAnimationFrame`, cleanup por token de invalidação e `ResizeObserver` (padrão já validado no protótipo). `prefers-reduced-motion` congela rotação e pulsos.
- **SVG declarativo**: sparklines dos cards e gráfico interativo do Mercado (path linha+área calculado de `serie_30d`; crosshair como overlay HTML posicionado por %, com hit-area transparente sobre o SVG).
- **Racional:** canvas onde há centenas de elementos animados (DOM/SVG não sustentam); SVG onde há interatividade pontual e acessibilidade textual (tooltip legível, `role="img"` + `aria-label` com resumo da série).

### 4.4 Acessibilidade da camada de experiência
- TTS via `speechSynthesis` com fallback silencioso (botão oculto se API indisponível); zoom por CSS (`font-size` raiz em rem — não `document.body.style.zoom`, não padronizado); toggles com `role="switch"` e `aria-pressed`; tour com focus-trap e `aria-modal`; globo com alternativa textual (a lista de ativos clicáveis também existe como texto nas recomendações — o canvas é canal redundante, não único).

---

## 5. IHC e acessibilidade como requisitos de arquitetura

A tabela liga os recursos diferenciais do protótipo aos mandamentos (M1–M12 do PLANO-FRONTEND.md) — é o núcleo do capítulo de IHC da monografia:

| Recurso do protótipo | Mandamentos | Fundamento |
|---|---|---|
| Confiança % + evidências + "como chegou aqui" | M1, M10 | XAI (explicabilidade): usuário audita a análise, não confia às cegas |
| Simples ↔ Técnico | M2, M12 | Adequação ao repertório; reduz carga cognitiva sem esconder profundidade |
| Modo Calmo | M3, M8 | Reduz ansiedade financeira; cor nunca é canal único (WCAG 1.4.1) |
| Simulador "se você tivesse investido" | M5, M12 | Concretiza abstração (%→R$); previne decisão sem noção de magnitude |
| Diário de decisões com snapshot | M1, M6 | Memória externa; combate viés retrospectivo ("eu sabia") |
| Feedback "foi útil?" | M3 | Usuário como avaliador do sistema; insumo para o back-end |
| Consenso de especialistas | M1, ética | Transparência: sistema se compara ao mercado e admite divergência |
| Tour guiado que navega de verdade | M6, M10 | Aprendizado situado, não manual estático |
| TTS + zoom | WCAG | Perfis de baixa visão/letramento; leitura ocupada (commute) |
| Disclaimer fixo + "não induz decisão" | Ética/CVM | Sistema educacional, não consultoria de valores mobiliários |

---

## 6. Métricas de avaliação da interface

- **Usabilidade percebida:** SUS (Brooke, 1996) — 10 itens, escore 0–100; meta ≥ 68 (média da literatura). Aplicado após teste de tarefas.
- **Avaliação empírica:** 5 usuários (regra de Nielsen: ~85% dos problemas), protocolo think-aloud, tarefas: (1) descobrir a principal oportunidade do dia e por quê; (2) simular R$ 1.000 em PETR4; (3) registrar uma decisão e localizá-la no diário; (4) ativar o Modo Calmo; (5) entender, pela Central de Recomendações, por que MGLU3 é risco. Métricas: sucesso binário, tempo, erros.
- **Avaliação por inspeção:** percurso heurístico com os 12 mandamentos como checklist.
- **Técnicas:** Lighthouse Acessibilidade ≥ 90 e Performance ≥ 85 (build de produção, mediana de 3 execuções); CLS ≈ 0 (skeletons dimensionados); 60fps no globo (DevTools Performance).
- **Específica do domínio:** compreensão das explicações — após a tarefa 1, pedir que o usuário reexplique a recomendação com as próprias palavras; correto/parcial/incorreto (mede se a interface *ensina*, objetivo central do TCC).

---

## 7. Stack front-end (fechada)

`react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `axios`, `react-hook-form` (formulários de preferências/perfil), `tailwindcss` + `@tailwindcss/vite`, `@fontsource/sora`, `@fontsource/jetbrains-mono`, `lucide-react` (ícones utilitários), React Bits (animações pontuais conforme PLANO-FRONTEND.md §Fase 14). Gráfico interativo: SVG próprio (como no protótipo) — Lightweight Charts fica como evolução se surgirem candles. Sem UI kit (Material/Bootstrap vetados pelo escopo).

---

## 8. Referências

- Nielsen, J. — *10 Usability Heuristics for User Interface Design* (Nielsen Norman Group): <https://www.nngroup.com/articles/ten-usability-heuristics/>
- Nielsen, J. — *Why You Only Need to Test with 5 Users*: <https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/>
- Pernice, K. — *F-Shaped Pattern of Reading on the Web* (NN/g): <https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/>
- Brooke, J. (1996) — *SUS: A "quick and dirty" usability scale*. In: Usability Evaluation in Industry. Taylor & Francis.
- W3C — *Web Content Accessibility Guidelines (WCAG) 2.2*: <https://www.w3.org/TR/WCAG22/>
- MDN — *Web Speech API (SpeechSynthesis)*: <https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis>
- Documentação oficial: React <https://react.dev/> · Vite <https://vite.dev/> · TanStack Query <https://tanstack.com/query/latest> · React Router <https://reactrouter.com/> · Tailwind CSS <https://tailwindcss.com/>
- Documentos-irmãos do projeto: `arquitetura-e-treinamento.md` (pipeline de predição, FinBERT-PT-BR, API FastAPI), `PLANO-FRONTEND.md` (receita de execução + mandamentos M1–M12).

## Verificação

- Documento serve como capítulo de arquitetura do TCC: cada RF é citável e rastreável ao protótipo e a um mandamento de IHC.
- Checklist de cobertura do protótipo: 3 telas ✓ · tour ✓ · modo calmo ✓ · níveis ✓ · zoom ✓ · TTS ✓ · diário ✓ · simulador ✓ · feedback ✓ · consenso ✓ · globo/mapa/gráfico ✓ · disclaimer ✓.
- Contratos JSON compatíveis com os endpoints do documento do back-end; nenhuma responsabilidade analítica no front.
