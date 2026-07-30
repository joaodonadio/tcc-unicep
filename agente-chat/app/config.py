"""Configuração por variáveis de ambiente (AGENTE-CHAT-IA.md §4, §6, §10)."""

from __future__ import annotations

import os
from dataclasses import dataclass, field

# Famílias que rejeitam `temperature` / `top_p` / `top_k` com HTTP 400.
# Isolar isso aqui permite trocar AGENTE_MODELO sem quebrar o serviço.
_MODELOS_SEM_TEMPERATURA = (
    "claude-opus-5",
    "claude-opus-4-7",
    "claude-opus-4-8",
    "claude-sonnet-5",
    "claude-fable-5",
    "claude-mythos-5",
)


def _f(nome: str, padrao: float) -> float:
    try:
        return float(os.getenv(nome, padrao))
    except ValueError:
        return padrao


def _i(nome: str, padrao: int) -> int:
    try:
        return int(os.getenv(nome, padrao))
    except ValueError:
        return padrao


@dataclass(frozen=True)
class Config:
    api_key: str = field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", ""))
    modelo: str = field(default_factory=lambda: os.getenv("AGENTE_MODELO", "claude-haiku-4-5"))
    temperatura: float = field(default_factory=lambda: _f("AGENTE_TEMPERATURA", 0.2))
    max_tokens: int = field(default_factory=lambda: _i("AGENTE_MAX_TOKENS", 700))

    api_predicoes: str = field(
        default_factory=lambda: os.getenv("API_PREDICOES_URL", "http://localhost:8000")
    )
    snapshot_ttl: int = field(default_factory=lambda: _i("SNAPSHOT_TTL_SEGUNDOS", 60))

    limite_caracteres: int = field(default_factory=lambda: _i("LIMITE_CARACTERES", 500))
    limite_turnos: int = field(default_factory=lambda: _i("LIMITE_TURNOS_HISTORICO", 20))
    rate_limit: int = field(default_factory=lambda: _i("RATE_LIMIT_POR_MINUTO", 20))

    orcamento_mensal_usd: float = field(
        default_factory=lambda: _f("ORCAMENTO_MENSAL_USD", 5.0)
    )
    origem_front: str = field(
        default_factory=lambda: os.getenv("ORIGEM_FRONT", "http://localhost:5173")
    )

    timeout_llm_segundos: float = 10.0  # gatilho de fallback (§4)

    @property
    def llm_disponivel(self) -> bool:
        """Sem chave, o serviço sobe e responde 100% em modo regra (RA-9)."""
        return bool(self.api_key)

    @property
    def aceita_temperatura(self) -> bool:
        return not self.modelo.startswith(_MODELOS_SEM_TEMPERATURA)


config = Config()
