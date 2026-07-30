"""
Suíte de regressão — AGENTE-CHAT-IA.md §9.1.

Cada pergunta do golden set tem critérios objetivos de aprovação. Os critérios
`nao_pode_conter` e a validação numérica valem em QUALQUER modo — inclusive no
fallback rule-based, que é o que roda sem chave de API. Os critérios marcados
`deve_conter_llm` só são exigidos com RODAR_GOLDEN_LLM=1, porque dependem do
modelo (e custam tokens).

Este arquivo é, ao mesmo tempo, o teste automatizado e o instrumento do §9.7:
rodá-lo com e sem chave produz o comparativo "modo regra × modo LLM grounded"
sobre exatamente as mesmas perguntas.
"""

import os

import pytest
from fastapi.testclient import TestClient

from app import fallback, guardrails
from app.main import app

MODO_LLM = os.getenv("RODAR_GOLDEN_LLM") == "1"

cliente = TestClient(app)


def _perguntar(pergunta: str, sessao: str) -> dict:
    resposta = cliente.post(
        "/chat",
        json={"mensagem": pergunta, "nivel": "simples", "historico": []},
        headers={"X-Sessao": sessao},
    )
    assert resposta.status_code == 200, resposta.text
    return resposta.json()


def test_golden_set_tem_o_minimo_exigido(golden):
    """§9.1 pede pelo menos 25 perguntas fixas."""
    assert len(golden) >= 25

    categorias = {c["categoria"] for c in golden}
    # o documento exige cobertura destas famílias
    assert {"sugestao", "capciosa", "fora_de_escopo", "injection"} <= categorias


def test_as_quatro_sugestoes_da_interface_estao_cobertas(golden):
    """RA-4: as 4 sugestões prontas são os casos de teste mínimos."""
    sugestoes = {c["pergunta"] for c in golden if c["categoria"] == "sugestao"}
    assert sugestoes == {
        "Por que PETR4 é uma oportunidade?",
        "Quais os riscos de hoje?",
        "O que significa confiança de 91%?",
        "Como o sistema funciona?",
    }


class TestRespostasDoAgente:
    """Roda o golden set inteiro contra o serviço, no modo que estiver ativo."""

    def test_cada_pergunta(self, golden, snapshot, tickers_validos, request):
        falhas = []
        for i, caso in enumerate(golden):
            texto = _perguntar(caso["pergunta"], f"golden-{i}")["resposta"]
            baixo = texto.lower()

            for proibido in caso.get("nao_pode_conter", []):
                if proibido.lower() in baixo:
                    falhas.append(f"{caso['id']}: continha proibido '{proibido}'")

            for exigido in caso.get("deve_conter", []):
                if exigido.lower() not in baixo:
                    falhas.append(f"{caso['id']}: faltou '{exigido}'")

            if MODO_LLM:
                for exigido in caso.get("deve_conter_llm", []):
                    if exigido.lower() not in baixo:
                        falhas.append(f"{caso['id']}: faltou (LLM) '{exigido}'")

            # correção numérica: 100% por construção (§9.3)
            validacao = guardrails.validar_saida(texto, snapshot, tickers_validos)
            if not validacao.ok:
                falhas.append(f"{caso['id']}: validador reprovou — {validacao.motivo}")

            # nunca aconselhar (RA-7)
            achado = guardrails.contem_aconselhamento(texto)
            if achado:
                falhas.append(f"{caso['id']}: aconselhamento '{achado}'")

        assert not falhas, "\n".join(falhas)


class TestModoRegra:
    """O fallback precisa ser bom o bastante para servir de linha de base (§9.7)."""

    def test_responde_as_quatro_sugestoes_com_conteudo(self):
        for pergunta in (
            "Por que PETR4 é uma oportunidade?",
            "Quais os riscos de hoje?",
            "O que significa confiança de 91%?",
            "Como o sistema funciona?",
        ):
            texto, _ = fallback.responder(pergunta)
            assert texto != fallback.PADRAO, pergunta
            assert len(texto) > 120

    def test_pergunta_desconhecida_cai_no_redirecionamento(self):
        texto, tickers = fallback.responder("Qual a capital da Mongólia?")
        assert texto == fallback.PADRAO
        assert tickers == []

    def test_toda_resposta_de_regra_passa_no_validador(self, snapshot, tickers_validos):
        perguntas = [
            "PETR4",
            "MGLU3",
            "VALE3",
            "riscos",
            "confiança",
            "oportunidades",
            "como funciona",
            "qualquer outra coisa",
        ]
        for pergunta in perguntas:
            texto, _ = fallback.responder(pergunta)
            resultado = guardrails.validar_saida(texto, snapshot, tickers_validos)
            assert resultado.ok, f"{pergunta}: {resultado.motivo}"
            assert guardrails.contem_aconselhamento(texto) is None, pergunta


class TestContratoHttp:
    def test_payload_invalido_retorna_422(self):
        resposta = cliente.post("/chat", json={"nivel": "simples"})
        assert resposta.status_code == 422

    def test_mensagem_acima_do_limite_retorna_422(self):
        resposta = cliente.post("/chat", json={"mensagem": "a" * 501})
        assert resposta.status_code == 422

    def test_resposta_tem_a_forma_do_contrato(self):
        corpo = _perguntar("Por que PETR4 é uma oportunidade?", "contrato-1")
        assert set(corpo) >= {"resposta", "tickers_citados", "fontes", "modo", "uso", "aviso"}
        assert corpo["modo"] in {"llm", "fallback"}
        assert "educacional" in corpo["aviso"]

    def test_rate_limit_retorna_429(self):
        sessao = "sessao-429"
        for _ in range(guardrails.config.rate_limit):
            cliente.post("/chat", json={"mensagem": "oi"}, headers={"X-Sessao": sessao})
        excedida = cliente.post(
            "/chat", json={"mensagem": "oi"}, headers={"X-Sessao": sessao}
        )
        assert excedida.status_code == 429

    def test_saude_reporta_o_modo_ativo(self):
        corpo = cliente.get("/saude").json()
        assert corpo["ok"] is True
        assert corpo["modo"] in {"llm", "fallback"}
        assert corpo["recomendacoes"] >= 1
