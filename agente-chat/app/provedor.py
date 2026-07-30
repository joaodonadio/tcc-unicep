"""
Provedor de LLM isolado atrás de uma interface própria (§4).

Trocar de provedor = escrever outra classe com o mesmo `gerar()`. O resto do
serviço (grounding, guardrails, validador) não sabe qual SDK está por baixo.

Loop agêntico manual em vez do tool runner do SDK: o runner é beta, e este é um
artefato acadêmico que precisa ser reproduzível na defesa. O laço aqui é curto
e explícito — pedido → tool_use → resultado → repete.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any, Protocol

from .config import config

MAX_RODADAS_TOOL = 4


class ErroProvedor(RuntimeError):
    """Falha que deve acionar o fallback rule-based (RA-9)."""


@dataclass
class SaidaLLM:
    texto: str
    tokens_entrada: int = 0
    tokens_saida: int = 0
    tools_chamadas: list[str] = field(default_factory=list)
    recusado_por_seguranca: bool = False


class ProvedorLLM(Protocol):
    async def gerar(
        self,
        *,
        sistema: str,
        mensagens: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        executar_tool,
    ) -> SaidaLLM: ...


class ProvedorAnthropic:
    """Implementação sobre o SDK oficial da Anthropic."""

    def __init__(self) -> None:
        if not config.llm_disponivel:
            raise ErroProvedor("ANTHROPIC_API_KEY ausente.")
        import anthropic  # import tardio: o serviço sobe sem o SDK, em modo regra

        self._anthropic = anthropic
        self._cliente = anthropic.AsyncAnthropic(api_key=config.api_key)

    def _parametros(self) -> dict[str, Any]:
        params: dict[str, Any] = {
            "model": config.modelo,
            "max_tokens": config.max_tokens,
        }
        # Modelos da geração Opus 4.7+/Sonnet 5/Fable 5 rejeitam `temperature`
        # com HTTP 400; o config sabe disso e o serviço simplesmente omite.
        if config.aceita_temperatura:
            params["temperature"] = config.temperatura
        return params

    async def gerar(
        self,
        *,
        sistema: str,
        mensagens: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        executar_tool,
    ) -> SaidaLLM:
        conversa = list(mensagens)
        entrada = saida = 0
        chamadas: list[str] = []

        try:
            for _ in range(MAX_RODADAS_TOOL):
                resposta = await asyncio.wait_for(
                    self._cliente.messages.create(
                        system=sistema,
                        messages=conversa,
                        tools=tools,
                        **self._parametros(),
                    ),
                    timeout=config.timeout_llm_segundos,
                )
                entrada += resposta.usage.input_tokens
                saida += resposta.usage.output_tokens

                # Classificadores de segurança podem recusar: HTTP 200 com
                # stop_reason "refusal" e `content` vazio. Checar antes de ler.
                if resposta.stop_reason == "refusal":
                    return SaidaLLM(
                        texto="",
                        tokens_entrada=entrada,
                        tokens_saida=saida,
                        tools_chamadas=chamadas,
                        recusado_por_seguranca=True,
                    )

                if resposta.stop_reason != "tool_use":
                    texto = "".join(
                        bloco.text for bloco in resposta.content if bloco.type == "text"
                    )
                    return SaidaLLM(texto.strip(), entrada, saida, chamadas)

                conversa.append({"role": "assistant", "content": resposta.content})
                resultados = []
                for bloco in resposta.content:
                    if bloco.type != "tool_use":
                        continue
                    chamadas.append(bloco.name)
                    conteudo = await executar_tool(bloco.name, dict(bloco.input))
                    resultados.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": bloco.id,
                            "content": conteudo,
                        }
                    )
                # todos os tool_result voltam numa ÚNICA mensagem de usuário
                conversa.append({"role": "user", "content": resultados})

            raise ErroProvedor("Limite de rodadas de ferramenta atingido.")

        except asyncio.TimeoutError as erro:
            raise ErroProvedor("Timeout do provedor de LLM.") from erro
        except self._anthropic.RateLimitError as erro:
            raise ErroProvedor("Provedor de LLM com limite de taxa atingido.") from erro
        except self._anthropic.APIStatusError as erro:
            raise ErroProvedor(f"Provedor respondeu HTTP {erro.status_code}.") from erro
        except self._anthropic.APIConnectionError as erro:
            raise ErroProvedor("Falha de conexão com o provedor de LLM.") from erro


def criar_provedor() -> ProvedorLLM | None:
    """`None` significa: operar 100% em modo regra."""
    try:
        return ProvedorAnthropic()
    except (ErroProvedor, ImportError):
        return None
