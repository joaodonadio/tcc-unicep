"""
Serviço agente-chat — `POST /chat` (AGENTE-CHAT-IA.md §1 e §7).

Pipeline por requisição:
  1. SANITIZAÇÃO   → limites, normalização, defesa contra prompt injection
  2. GROUNDING     → snapshot do dia (cache TTL 60s) + tools sob demanda
  3. GERAÇÃO       → LLM com o prompt normativo, temperatura baixa
  4. VALIDAÇÃO     → números e tickers conferidos contra o snapshot
  5. LOG           → auditoria estruturada
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

from fastapi import FastAPI, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from . import auditoria, contexto, fallback, guardrails, tools
from .config import config
from .contratos import Fonte, PerguntaRequest, RespostaChat, Uso
from .prompt import delimitar_pergunta, montar_prompt
from .provedor import ErroProvedor, criar_provedor

app = FastAPI(title="InvestIA · agente-chat", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.origem_front],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

_provedor = criar_provedor()


def _resposta_fallback(mensagem: str, motivo: str) -> tuple[RespostaChat, str]:
    texto, tickers = fallback.responder(mensagem)
    return RespostaChat(
        resposta=texto,
        tickers_citados=tickers,
        fontes=[],
        modo="fallback",
        uso=Uso(),
    ), motivo


async def _responder(pedido: PerguntaRequest, sessao: str) -> tuple[RespostaChat, dict[str, Any]]:
    """Executa o pipeline completo e devolve (resposta, registro de auditoria)."""
    inicio = time.monotonic()
    registro: dict[str, Any] = {
        "sessao": sessao,
        "nivel": pedido.nivel,
        "modelo": config.modelo,
        "tools_chamadas": [],
        "regeneracoes": 0,
        "validador_ok": None,
        "fallback": None,
    }

    # 1 — SANITIZAÇÃO
    mensagem = guardrails.sanitizar_entrada(pedido.mensagem)
    if not mensagem:
        resposta, motivo = _resposta_fallback("", "mensagem vazia após sanitização")
        registro["fallback"] = motivo
        return resposta, registro

    # 2 — GROUNDING
    snapshot, origem = await contexto.obter_snapshot()
    registro["origem_snapshot"] = origem
    if snapshot is None or _provedor is None:
        motivo = "sem snapshot" if snapshot is None else "sem provedor de LLM"
        resposta, motivo = _resposta_fallback(mensagem, motivo)
        registro["fallback"] = motivo
        return resposta, registro

    # teto de orçamento — corte automático para o modo regra (§4)
    if auditoria.gasto_atual() >= config.orcamento_mensal_usd:
        resposta, motivo = _resposta_fallback(mensagem, "orçamento mensal excedido")
        registro["fallback"] = motivo
        return resposta, registro

    compacto = contexto.compactar(snapshot)
    validos = contexto.tickers_conhecidos(snapshot)
    sistema = montar_prompt(compacto, pedido.nivel)

    historico = [
        {"role": "user" if t.papel == "usuario" else "assistant", "content": t.texto}
        for t in pedido.historico[-config.limite_turnos :]
    ]
    contexto_ui = pedido.contexto_ui.model_dump() if pedido.contexto_ui else None
    mensagens = historico + [
        {"role": "user", "content": delimitar_pergunta(mensagem, contexto_ui)}
    ]

    async def executar_tool(nome: str, argumentos: dict[str, Any]) -> str:
        return await tools.executar(nome, argumentos, snapshot)

    # 3 e 4 — GERAÇÃO + VALIDAÇÃO (uma regeneração permitida, §6.2)
    tokens_entrada = tokens_saida = 0
    for tentativa in range(2):
        try:
            saida = await _provedor.gerar(
                sistema=sistema,
                mensagens=mensagens,
                tools=tools.DEFINICOES,
                executar_tool=executar_tool,
            )
        except ErroProvedor as erro:
            resposta, motivo = _resposta_fallback(mensagem, str(erro))
            registro["fallback"] = motivo
            return resposta, registro

        tokens_entrada += saida.tokens_entrada
        tokens_saida += saida.tokens_saida
        registro["tools_chamadas"] = saida.tools_chamadas

        if saida.recusado_por_seguranca or not saida.texto:
            resposta, motivo = _resposta_fallback(
                mensagem, "recusa dos classificadores de segurança"
            )
            registro["fallback"] = motivo
            return resposta, registro

        validacao = guardrails.validar_saida(saida.texto, snapshot, validos)
        aconselhamento = guardrails.contem_aconselhamento(saida.texto)
        problema = validacao.motivo if not validacao.ok else (
            f"linguagem de aconselhamento: '{aconselhamento}'" if aconselhamento else ""
        )

        if not problema:
            registro["validador_ok"] = True
            registro["latencia_ms"] = round((time.monotonic() - inicio) * 1000)
            custo = auditoria.custo(config.modelo, tokens_entrada, tokens_saida)
            auditoria.registrar_gasto(custo)
            fontes = [
                Fonte(tipo="recomendacao", id=t.lower(), gerado_em=snapshot.get("gerado_em"))
                for t in validacao.tickers
            ]
            return (
                RespostaChat(
                    resposta=saida.texto,
                    tickers_citados=validacao.tickers,
                    fontes=fontes,
                    modo="llm",
                    uso=Uso(
                        tokens_entrada=tokens_entrada,
                        tokens_saida=tokens_saida,
                        custo_usd=round(custo, 6),
                    ),
                ),
                registro,
            )

        # divergência → descarta e regenera UMA vez, avisando o modelo
        registro["validador_ok"] = False
        if tentativa == 0:
            registro["regeneracoes"] = 1
            mensagens = mensagens + [
                {"role": "assistant", "content": saida.texto},
                {
                    "role": "user",
                    "content": guardrails.INSTRUCAO_CORRETIVA.format(motivo=problema),
                },
            ]

    # segunda falha → fallback rule-based
    resposta, motivo = _resposta_fallback(mensagem, "validador reprovou duas vezes")
    registro["fallback"] = motivo
    return resposta, registro


@app.get("/saude")
async def saude() -> dict[str, Any]:
    snapshot, origem = await contexto.obter_snapshot()
    return {
        "ok": True,
        "modo": "llm" if _provedor else "fallback",
        "modelo": config.modelo if _provedor else None,
        "snapshot": origem,
        "recomendacoes": len(snapshot.get("recomendacoes", [])) if snapshot else 0,
        "gasto_usd": round(auditoria.gasto_atual(), 6),
    }


@app.post("/chat")
async def chat(
    pedido: PerguntaRequest,
    request: Request,
    accept: str = Header(default=""),
    x_sessao: str = Header(default=""),
):
    sessao = x_sessao or (request.client.host if request.client else "anonimo")

    if not guardrails.dentro_do_rate_limit(sessao):
        auditoria.registrar({"sessao": sessao, "erro": "rate_limit"})
        return JSONResponse(
            status_code=429,
            content={"detail": "Muitas perguntas em pouco tempo. Aguarde alguns segundos."},
        )

    resposta, registro = await _responder(pedido, sessao)
    registro["tokens_entrada"] = resposta.uso.tokens_entrada
    registro["tokens_saida"] = resposta.uso.tokens_saida
    registro["custo_usd"] = resposta.uso.custo_usd
    registro["modo"] = resposta.modo
    auditoria.registrar(registro)

    if "text/event-stream" not in accept:
        return resposta

    # STREAMING (RA-6) — nota de arquitetura:
    # O validador da §6.2 é pós-geração e pode DESCARTAR a resposta inteira.
    # Emitir tokens crus enquanto o modelo escreve tornaria isso impossível:
    # não há como retirar do usuário um número que já apareceu na tela. Por
    # isso o serviço gera e valida primeiro, e então transmite em fatias o
    # texto já aprovado. A UI mantém o efeito de digitação e a garantia de
    # correção numérica continua valendo — o custo é a latência do primeiro
    # token, que passa a ser a latência da resposta completa.
    async def eventos():
        texto = resposta.resposta
        passo = 24
        for i in range(0, len(texto), passo):
            yield {"event": "delta", "data": texto[i : i + passo]}
            await asyncio.sleep(0.02)
        yield {
            "event": "meta",
            "data": resposta.model_dump_json(exclude={"resposta"}),
        }

    return EventSourceResponse(eventos())
