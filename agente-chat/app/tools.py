"""
Grounding — camada 2 do §3: tools para o que não cabe no snapshot.

As 4 ferramentas mapeiam 1:1 aos endpoints da API de predições do documento do
back-end. Todas leem dados estruturados: o agente nunca *calcula* nada, só
consulta e explica — é isso que torna a resposta auditável.
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from .config import config

DEFINICOES = [
    {
        "name": "get_recomendacao",
        "description": (
            "Detalhe completo da análise de UM ativo de hoje (confiança, risco, "
            "evidências, leitura técnica, glossário, consenso de especialistas). "
            "Chame quando o usuário perguntar sobre um ticker específico e o "
            "CONTEXTO DO DIA não trouxer o detalhe necessário."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string", "description": "Ex.: PETR4"},
            },
            "required": ["ticker"],
        },
    },
    {
        "name": "get_historico",
        "description": (
            "Série de preços de um ativo em 1M, 6M ou 1A. Chame para perguntas "
            "sobre o passado — 'como VALE3 se comportou no ano?'."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string"},
                "periodo": {"type": "string", "enum": ["1M", "6M", "1A"]},
            },
            "required": ["ticker", "periodo"],
        },
    },
    {
        "name": "get_sentimento",
        "description": (
            "Detalhe do NLP de sentimento de um ativo: número de notícias, "
            "percentual por tom e manchetes-exemplo."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"ticker": {"type": "string"}},
            "required": ["ticker"],
        },
    },
    {
        "name": "get_indicadores",
        "description": "Indicadores macro do dia (Selic, IPCA, dólar, índices).",
        "input_schema": {"type": "object", "properties": {}},
    },
]


async def _buscar(caminho: str, params: dict[str, Any] | None = None) -> Any:
    async with httpx.AsyncClient(base_url=config.api_predicoes, timeout=6.0) as cliente:
        resposta = await cliente.get(caminho, params=params)
        resposta.raise_for_status()
        return resposta.json()


async def executar(nome: str, argumentos: dict[str, Any], snapshot: dict[str, Any]) -> str:
    """
    Executa uma tool e devolve o resultado serializado.

    Resolve primeiro pelo snapshot (já em memória, custo zero) e só vai à API
    quando o dado não está lá.
    """
    try:
        if nome == "get_recomendacao":
            alvo = str(argumentos.get("ticker", "")).upper()
            for r in snapshot.get("recomendacoes", []):
                if r.get("ticker") == alvo:
                    return json.dumps(r, ensure_ascii=False)
            return json.dumps(
                {"erro": f"{alvo} não está entre os ativos analisados hoje."},
                ensure_ascii=False,
            )

        if nome == "get_indicadores":
            return json.dumps(snapshot.get("indicadores", []), ensure_ascii=False)

        if nome == "get_historico":
            ticker = str(argumentos.get("ticker", "")).upper()
            periodo = argumentos.get("periodo", "6M")
            dados = await _buscar(f"/history/{ticker}", {"periodo": periodo})
            return json.dumps(dados, ensure_ascii=False)

        if nome == "get_sentimento":
            ticker = str(argumentos.get("ticker", "")).upper()
            dados = await _buscar(f"/sentiment/{ticker}")
            return json.dumps(dados, ensure_ascii=False)

    except httpx.HTTPError as erro:
        return json.dumps(
            {"erro": f"Dado indisponível no momento ({type(erro).__name__})."},
            ensure_ascii=False,
        )

    return json.dumps({"erro": f"Ferramenta desconhecida: {nome}"}, ensure_ascii=False)
