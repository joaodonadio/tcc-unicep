# Sistema Inteligente para Análise de Dados Financeiros e Investimentos — Front-end

Front-end do TCC, desenvolvido com React + Vite + JavaScript (React Router, Axios, React Query, React Hook Form, React Bits).

## Documentação

- **[Arquitetura da Interface (InvestIA)](docs/ARQUITETURA-INTERFACE.md)** — documento de arquitetura do front-end no formato de capítulo de TCC: inventário completo do protótipo (4 telas + camada de experiência) como requisitos rastreáveis (RF-x.y), contratos de dados JSON, decisões técnicas justificadas, IHC como requisito e métricas de avaliação (SUS, Lighthouse, testes com usuários).
- **[Agente de Chat IA](docs/AGENTE-CHAT-IA.md)** — especificação completa do agente conversacional da tela "Perguntar ao sistema": papel explicador (não recomendador), grounding RAG + tools sobre a API de predições, prompt de sistema normativo, guardrails com detector de alucinação, contrato `POST /chat` com streaming, fallback rule-based, avaliação (golden set, groundedness, rubrica humana) e custos.

- **[Plano de Desenvolvimento do Front-end](docs/PLANO-FRONTEND.md)** — planejamento completo organizado como **receita de bolo em 19 fases (0–18)**: o sumário é o próprio passo a passo, do "instalar o Node.js" ao teste de usabilidade. Cada fase traz a decisão de design tomada naquele momento (cores, tipografia, ícones…), um bloco **"Em palavras simples"** para leigos, um bloco **🔧 Tecnicamente** com o aprofundamento de engenharia (APIs, padrões e trade-offs) e um bloco **🧠 IHC** conectando a fase aos 12 mandamentos de IHC do projeto. Base: React + Vite. Inclui análise de 14 plataformas financeiras, blueprint do dashboard zona por zona, catálogo de componentes e avaliação de IHC para a monografia.

## Como rodar

### Interface (React + Vite)

```bash
npm install
npm run dev          # http://localhost:5173
```

Funciona sem back-end: a estratégia **mock-first** (`ARQUITETURA-INTERFACE.md` §3)
serve os dados de `src/mocks/` com latência simulada. Copie `.env.example` para
`.env` para apontar para as APIs reais (`VITE_USE_MOCKS=false`) ou para exercitar
os estados de erro dos cards (`VITE_MOCK_ERROR_RATE=0.3`).

```bash
npm run build        # build de produção com code splitting por rota
npm run lint         # ESLint
npm test             # Vitest — validação de contratos e projeção do mapa
```

### Agente conversacional (FastAPI)

```bash
cd agente-chat
python -m venv .venv
.venv/Scripts/python -m pip install -e ".[dev]"    # Linux/macOS: .venv/bin/python
.venv/Scripts/python -m uvicorn app.main:app --port 8100
.venv/Scripts/python -m pytest -q                  # 29 testes (guardrails + golden set)
```

Sem `ANTHROPIC_API_KEY` o serviço sobe e responde em **modo regra** (RA-9) — útil
para a defesa e para o comparativo "regras × LLM grounded" da §9.7. Para ligar o
front a ele mantendo os dados em mock: `VITE_USE_CHAT_SERVICE=true`.

Detalhes, decisões e divergências em relação ao documento: [`agente-chat/README.md`](agente-chat/README.md).

## Mapa do código

| Caminho | Papel |
|---|---|
| `src/pages/` | As 4 telas: Hoje (RF-1), Recomendações (RF-2), Mercado (RF-3), Perguntar (RF-4) |
| `src/components/canvas/` | Globo 3D de ativos, mapa do Brasil, orbe da IA — canvas a 60fps (§4.3) |
| `src/components/graficos/` | Sparkline e gráfico interativo com crosshair — SVG (§4.3) |
| `src/components/experiencia/` | Camada transversal: níveis, Modo Calmo, zoom, tour (RF-5) |
| `src/context/` | Estado de cliente: preferências, tour e diário (§4.1) |
| `src/services/` | Axios, adapter mock-first e validação de payload (§3) |
| `src/styles/tokens.css` | Design system; o Modo Calmo reescreve 5 variáveis, nunca componentes |
| `agente-chat/app/` | Serviço do agente: grounding, prompt normativo, guardrails, fallback |
