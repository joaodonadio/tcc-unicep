# agente-chat — o agente explicador do InvestIA

Implementação de [`docs/AGENTE-CHAT-IA.md`](../docs/AGENTE-CHAT-IA.md). Serviço
FastAPI que alimenta a tela **Perguntar ao sistema** (RF-4.x).

**Papel do agente:** ele *não gera análise financeira* — quem analisa é o
pipeline de ML. O agente traduz, contextualiza e explica análises que já
existem. É essa separação (analisar ≠ explicar) que torna cada afirmação
rastreável a um dado estruturado, e alucinações detectáveis por validação
automática.

## Rodar

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -e ".[dev]"   # Linux/macOS: .venv/bin/python
cp .env.example .env                               # opcional
.venv/Scripts/python -m uvicorn app.main:app --port 8100
```

Sem `ANTHROPIC_API_KEY` o serviço **sobe normalmente e responde 100% em modo
regra** (RA-9). `GET /saude` diz em qual modo está:

```json
{ "ok": true, "modo": "fallback", "modelo": null, "snapshot": "seed", "recomendacoes": 6 }
```

Para ligar o front a este serviço sem precisar da API de predições, use
`VITE_USE_CHAT_SERVICE=true` no `.env` do front.

## Testes

```bash
.venv/Scripts/python -m pytest -q
```

29 testes: guardrails (sanitização, rate limit, validador, filtro de
aconselhamento), golden set (§9.1) e contrato HTTP (§7).

O golden set roda em **qualquer modo**. Os critérios `nao_pode_conter` e a
validação numérica valem sempre; os marcados `deve_conter_llm` só são exigidos
com `RODAR_GOLDEN_LLM=1`. Rodar a suíte com e sem chave produz exatamente o
comparativo **modo regra × modo LLM grounded** previsto na §9.7.

## Como o pipeline roda (§1)

```
sanitização → grounding (snapshot + tools) → geração → validação → log
```

| Arquivo | Papel |
|---|---|
| `app/contexto.py` | Snapshot do dia, cache TTL 60s (§3, camada 1) |
| `app/tools.py` | As 4 tools assinadas do §3, camada 2 |
| `app/prompt.py` | Prompt normativo do §5 + delimitação da pergunta (regra 7) |
| `app/guardrails.py` | §6: sanitização, validador de números/tickers, filtro de aconselhamento |
| `app/provedor.py` | SDK isolado atrás de uma interface (§4) |
| `app/fallback.py` | Modo regra (RA-9) |
| `app/auditoria.py` | Log estruturado + teto de orçamento (§6.5, §10) |

## Decisões que se afastam da letra do documento

Três pontos onde a implementação diverge — todos por incompatibilidade interna
da especificação, não por conveniência:

**1. Streaming não é token a token.** A §6.2 manda *descartar a resposta
inteira* quando o validador reprova. Isso é incompatível com emitir tokens crus
enquanto o modelo escreve: não há como retirar da tela um número que já
apareceu. O serviço gera e valida primeiro, depois transmite em fatias o texto
já aprovado. A UI mantém o efeito de digitação e a garantia de correção
numérica continua de pé; o custo é que o "tempo até o primeiro token" (RA-6)
passa a ser o tempo da resposta completa. Trocar essa escolha significa
enfraquecer o validador.

**2. Modelo.** A §4 escolhe "a variante rápida/econômica da família". Aqui isso
é `claude-haiku-4-5` ($1/$5 por milhão de tokens), configurável em
`AGENTE_MODELO`. **A estimativa de custo da §10 fica desatualizada:** com ~4k
tokens de entrada e ~300 de saída por mensagem, uma conversa de 5 mensagens
custa ≈ **US$ 0,027**, não "< US$ 0,01" — a faixa de US$ 0,15–0,60/1M citada no
documento não corresponde a nenhum modelo atual desta família. A ordem de
grandeza do documento se mantém (poucos dólares no semestre), e o teto de
`ORCAMENTO_MENSAL_USD` corta para o modo regra antes de estourar.

**3. Loop de ferramentas manual**, em vez do tool runner do SDK: o runner é
beta, e um artefato acadêmico precisa ser reproduzível na defesa.

## Fora do escopo desta implementação

- **Classificação de intenção em passada separada** (§1, passo 2): o prompt de
  sistema já orienta escopo e recusa, e as tools cobrem o roteamento por
  ticker. Uma passada extra dobraria latência e custo sem ganho observável.
- **Memória de longo prazo** (§8): registrada no próprio documento como
  trabalho futuro.
