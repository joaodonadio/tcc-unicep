"""
Guardrails — AGENTE-CHAT-IA.md §6. Camadas independentes, defesa em profundidade.

1. Sanitização de entrada
2. Validador de números e tickers (o detector objetivo de alucinação do TCC)
3. Filtro de aconselhamento
4. Disclaimer (anexado pelo serviço, em contratos.RespostaChat)
5. Auditoria (auditoria.py)
"""

from __future__ import annotations

import json
import re
import time
from collections import defaultdict, deque
from typing import Any

from .config import config

# ---------------------------------------------------------------- 6.1 entrada

# Qualquer coisa que imite os delimitadores do sistema é removida antes de a
# mensagem virar turno de usuário.
_DELIMITADORES = re.compile(
    r"</?\s*(pergunta_do_usuario|contexto_da_interface|system|sistema|"
    r"regras_inviolaveis|contexto_do_dia)\s*>",
    re.IGNORECASE,
)

_janelas: dict[str, deque[float]] = defaultdict(deque)


def sanitizar_entrada(mensagem: str) -> str:
    limpa = _DELIMITADORES.sub(" ", mensagem)
    limpa = re.sub(r"\s+", " ", limpa).strip()
    return limpa[: config.limite_caracteres]


def dentro_do_rate_limit(sessao: str) -> bool:
    """Janela deslizante de 60s por sessão (§6.1)."""
    agora = time.monotonic()
    janela = _janelas[sessao]
    while janela and agora - janela[0] > 60:
        janela.popleft()
    if len(janela) >= config.rate_limit:
        return False
    janela.append(agora)
    return True


# -------------------------------------------------- 6.2 números e tickers

_RE_TICKER = re.compile(r"\b[A-Z]{4}\d{1,2}\b")
_RE_PERCENTUAL = re.compile(r"(\d{1,3}(?:[.,]\d+)?)\s*%")

# Percentuais genéricos que não precisam existir no snapshot: o agente os usa
# para explicar escalas ("não significa 100% de chance"), não para afirmar dados.
_PERCENTUAIS_GENERICOS = {"0", "50", "100"}


def _normalizar(numero: str) -> str:
    """
    "6,20" e "6.2" são o mesmo número; "100" e "1" não são.

    Zeros à direita só são insignificantes DEPOIS da vírgula decimal — remover
    os de um inteiro transformaria 100 em 1 (e faria "3%" passar por "30%").
    """
    n = numero.replace(",", ".")
    if "." in n:
        n = n.rstrip("0").rstrip(".")
    return n or "0"


def percentuais_do_snapshot(snapshot: dict[str, Any]) -> set[str]:
    """
    Todo percentual que o agente tem permissão de afirmar.

    Coletado do snapshot serializado inteiro — isso cobre os campos numéricos
    (confiança, adequação, potencial) e também os que aparecem dentro de texto
    ("volume 38% acima da média"), que é onde a maioria das citações mora.
    """
    bruto = json.dumps(snapshot, ensure_ascii=False)
    permitidos = {_normalizar(n) for n in _RE_PERCENTUAL.findall(bruto)}
    # números soltos do snapshot que a resposta pode legitimamente formatar como %
    for chave in ("confianca", "adequacao_perfil"):
        for valor in re.findall(rf'"{chave}"\s*:\s*(\d+(?:\.\d+)?)', bruto):
            permitidos.add(_normalizar(valor))
    for valor in re.findall(r'"(?:variacao_30d|potencial)"\s*:\s*"?([+-]?\d+[.,]?\d*)"?', bruto):
        permitidos.add(_normalizar(valor.lstrip("+-")))
    return permitidos | _PERCENTUAIS_GENERICOS


class ResultadoValidacao:
    def __init__(self, ok: bool, motivo: str = "", tickers: list[str] | None = None):
        self.ok = ok
        self.motivo = motivo
        self.tickers = tickers or []


def validar_saida(
    texto: str, snapshot: dict[str, Any], tickers_validos: set[str]
) -> ResultadoValidacao:
    """
    Detector objetivo de alucinação (§6.2).

    Possível justamente porque o agente só explica dados estruturados: todo
    ticker e todo percentual afirmado tem de existir no snapshot, com
    tolerância zero. Divergência → resposta descartada.
    """
    citados = sorted(set(_RE_TICKER.findall(texto)))
    desconhecidos = [t for t in citados if t not in tickers_validos]
    if desconhecidos:
        return ResultadoValidacao(
            False, f"ticker fora do snapshot: {', '.join(desconhecidos)}", citados
        )

    permitidos = percentuais_do_snapshot(snapshot)
    inventados = [
        n for n in _RE_PERCENTUAL.findall(texto) if _normalizar(n) not in permitidos
    ]
    if inventados:
        return ResultadoValidacao(
            False, f"percentual fora do snapshot: {', '.join(inventados)}%", citados
        )

    return ResultadoValidacao(True, tickers=citados)


# ---------------------------------------------- 6.3 filtro de aconselhamento

_PROIBIDOS = re.compile(
    r"\b(compre|comprem|venda agora|vendam|invista em|garanto|garantido|"
    r"vai subir|vai cair|lucro certo|retorno garantido|recomendo que voc[êe] compre)\b",
    re.IGNORECASE,
)

INSTRUCAO_CORRETIVA = (
    "Sua resposta anterior foi rejeitada pelo validador do sistema: {motivo}. "
    "Reescreva usando SOMENTE números e tickers presentes no CONTEXTO DO DIA, "
    "sem linguagem de aconselhamento ('compre', 'venda', 'vai subir', "
    "'garanto') e sem promessa de retorno."
)


def contem_aconselhamento(texto: str) -> str | None:
    achado = _PROIBIDOS.search(texto)
    return achado.group(0) if achado else None
