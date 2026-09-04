# Sistema Inteligente para Análise de Dados Financeiros e Investimentos — Front-end

Front-end do TCC, desenvolvido com React + Vite + JavaScript (React Router, Axios, React Query, React Hook Form, React Bits).

## Documentação

- **[Arquitetura da Interface (InvestIA)](docs/ARQUITETURA-INTERFACE.md)** — documento de arquitetura do front-end no formato de capítulo de TCC: inventário completo do protótipo (3 telas + camada de experiência) como requisitos rastreáveis (RF-x.y), contratos de dados JSON, decisões técnicas justificadas, IHC como requisito e métricas de avaliação (SUS, Lighthouse, testes com usuários).

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

## Mapa do código

| Caminho | Papel |
|---|---|
| `src/pages/` | As 3 telas: Hoje (RF-1), Recomendações (RF-2), Mercado (RF-3) |
| `src/components/canvas/` | Globo 3D de ativos, mapa do Brasil — canvas a 60fps (§4.3) |
| `src/components/graficos/` | Sparkline e gráfico interativo com crosshair — SVG (§4.3) |
| `src/components/experiencia/` | Camada transversal: níveis, Modo Calmo, zoom, tour (RF-5) |
| `src/context/` | Estado de cliente: preferências, tour e diário (§4.1) |
| `src/services/` | Axios, adapter mock-first e validação de payload (§3) |
| `src/styles/tokens.css` | Design system; o Modo Calmo reescreve 5 variáveis, nunca componentes |
