"""
Grounding — camada 1 do §3: o snapshot do dia sempre no contexto.

A análise vigente é buscada na API de predições e cacheada em memória com TTL
de 60s. Ela vai inteira no prompt porque ~90% das perguntas são sobre "hoje":
ter tudo em contexto elimina uma rodada de tool call e reduz a latência (RA-6).
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import httpx

from .config import config

# Seed de desenvolvimento: sem a API de predições no ar, o serviço usa o mesmo
# mock que o front consome, para que o agente seja testável de ponta a ponta.
_SEED = Path(__file__).resolve().parents[2] / "src" / "mocks" / "analise-do-dia.json"

_cache: dict[str, Any] = {"dados": None, "expira_em": 0.0, "origem": "nenhuma"}


def _carregar_seed() -> dict[str, Any] | None:
    try:
        return json.loads(_SEED.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


async def obter_snapshot(forcar: bool = False) -> tuple[dict[str, Any] | None, str]:
    """Devolve (snapshot, origem). `origem` ∈ api | seed | cache | nenhuma."""
    agora = time.monotonic()
    if not forcar and _cache["dados"] is not None and agora < _cache["expira_em"]:
        return _cache["dados"], "cache"

    dados = None
    origem = "nenhuma"
    try:
        async with httpx.AsyncClient(base_url=config.api_predicoes, timeout=5.0) as cliente:
            resposta = await cliente.get("/api/analise-do-dia")
            resposta.raise_for_status()
            dados = resposta.json()
            origem = "api"
    except (httpx.HTTPError, ValueError):
        dados = _carregar_seed()
        origem = "seed" if dados else "nenhuma"

    if dados is not None:
        _cache.update(dados=dados, expira_em=agora + config.snapshot_ttl, origem=origem)
    return dados, origem


def compactar(snapshot: dict[str, Any]) -> dict[str, Any]:
    """
    Versão enxuta do snapshot para o prompt (~3–4k tokens).

    Mantém tudo que a regra 2 do prompt exige citar (confiança, risco,
    evidências) e descarta o que só interessa ao desenho da interface.
    """
    return {
        "gerado_em": snapshot.get("gerado_em"),
        "sentimento_geral": snapshot.get("sentimento_geral"),
        "estatisticas": snapshot.get("estatisticas"),
        "resumo_simples": snapshot.get("resumo_simples"),
        "recomendacoes": [
            {
                "id": r.get("id"),
                "ticker": r.get("ticker"),
                "nome": r.get("nome"),
                "setor": r.get("setor"),
                "tipo": r.get("tipo"),
                "confianca": r.get("confianca"),
                "risco": r.get("risco"),
                "variacao_30d": r.get("variacao_30d"),
                "preco_atual": r.get("preco_atual"),
                "resumo": r.get("resumo"),
                "evidencias": r.get("evidencias"),
                "porque": r.get("porque"),
                "explicacao_simples": r.get("explicacao_simples"),
                "leitura_tecnica": r.get("leitura_tecnica"),
                "glossario": r.get("glossario"),
                "adequacao_perfil": r.get("adequacao_perfil"),
                "consenso": r.get("consenso"),
            }
            for r in snapshot.get("recomendacoes", [])
        ],
        "indicadores": snapshot.get("indicadores"),
        "setores": snapshot.get("setores"),
        "alertas": snapshot.get("alertas"),
        "agenda": snapshot.get("agenda"),
        "leituras": snapshot.get("leituras"),
    }


def tickers_conhecidos(snapshot: dict[str, Any]) -> set[str]:
    """Universo de tickers que o agente pode citar (validador, §6.2)."""
    tickers = {a.get("ticker") for a in snapshot.get("ativos", [])}
    tickers |= {r.get("ticker") for r in snapshot.get("recomendacoes", [])}
    return {t for t in tickers if t}
