"""
Camada 5 dos guardrails (§6.5) — log estruturado por requisição.

Sem dados pessoais. É a base do capítulo de avaliação (§9): taxa de
regeneração, taxa de fallback, custo médio por conversa, latências.
"""

from __future__ import annotations

import json
import logging
import sys
import threading
from datetime import datetime, timezone
from typing import Any

_logger = logging.getLogger("agente-chat.auditoria")
if not _logger.handlers:
    _handler = logging.StreamHandler(sys.stdout)
    _handler.setFormatter(logging.Formatter("%(message)s"))
    _logger.addHandler(_handler)
    _logger.setLevel(logging.INFO)

# Preços por milhão de tokens (USD). Usados só para o teto de orçamento e para
# a métrica de custo por conversa — não afetam o comportamento do agente.
PRECOS = {
    "claude-haiku-4-5": (1.0, 5.0),
    "claude-sonnet-5": (3.0, 15.0),
    "claude-opus-5": (5.0, 25.0),
}

_lock = threading.Lock()
_gasto_acumulado_usd = 0.0


def custo(modelo: str, tokens_entrada: int, tokens_saida: int) -> float:
    entrada, saida = PRECOS.get(modelo, (1.0, 5.0))
    return (tokens_entrada * entrada + tokens_saida * saida) / 1_000_000


def registrar_gasto(valor_usd: float) -> float:
    global _gasto_acumulado_usd
    with _lock:
        _gasto_acumulado_usd += valor_usd
        return _gasto_acumulado_usd


def gasto_atual() -> float:
    return _gasto_acumulado_usd


def registrar(evento: dict[str, Any]) -> None:
    evento = {"timestamp": datetime.now(timezone.utc).isoformat(), **evento}
    _logger.info(json.dumps(evento, ensure_ascii=False))
