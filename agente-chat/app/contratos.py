"""Contratos de `POST /chat` — AGENTE-CHAT-IA.md §7. Pydantic v2."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class TurnoHistorico(BaseModel):
    papel: Literal["usuario", "sistema"]
    texto: str = Field(max_length=4000)


class ContextoUI(BaseModel):
    tela: str | None = None
    recomendacao_id: str | None = None


class PerguntaRequest(BaseModel):
    mensagem: str = Field(min_length=1, max_length=500)
    nivel: Literal["simples", "tecnico"] = "simples"
    historico: list[TurnoHistorico] = Field(default_factory=list, max_length=20)
    contexto_ui: ContextoUI | None = None


class Fonte(BaseModel):
    tipo: str
    id: str
    gerado_em: str | None = None


class Uso(BaseModel):
    tokens_entrada: int = 0
    tokens_saida: int = 0
    custo_usd: float = 0.0


class RespostaChat(BaseModel):
    resposta: str
    tickers_citados: list[str] = Field(default_factory=list)
    fontes: list[Fonte] = Field(default_factory=list)
    modo: Literal["llm", "fallback"] = "llm"
    uso: Uso = Field(default_factory=Uso)
    # O disclaimer é anexado pelo SERVIÇO, não pelo modelo (§6.4): não depende
    # de o LLM lembrar de escrevê-lo.
    aviso: str = (
        "Conteúdo de caráter educacional. Não constitui recomendação de investimento."
    )
