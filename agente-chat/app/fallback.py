"""
Modo regra — AGENTE-CHAT-IA.md §4 / RA-9.

O dicionário de respostas fixas do protótipo, promovido a fallback. Gatilhos:
timeout do LLM (>10s), erro do provedor, orçamento mensal excedido, ausência de
chave de API. Benefício acadêmico: permite comparar no TCC as duas gerações
(regras × LLM grounded) com as mesmas perguntas (§9.7).
"""

from __future__ import annotations

import re

_REGRAS: list[tuple[re.Pattern[str], str, list[str]]] = [
    (
        re.compile(r"petr", re.IGNORECASE),
        """A análise de PETR4 tem 91% de confiança e se apoia em 4 sinais:

↗ volume 38% acima da média — mais gente negociando o papel;
↗ alta de 6,2% no mês, de forma consistente;
↗ 78% das 24 notícias analisadas com tom positivo;
↗ indicadores técnicos em zona favorável.

O risco é moderado: o setor de petróleo depende do preço internacional do barril, que pode oscilar. Em resumo: sinais positivos convergindo, mas sem garantia — por isso a confiança não é 100%.""",
        ["PETR4"],
    ),
    (
        re.compile(r"mglu|magazine", re.IGNORECASE),
        """MGLU3 está marcada como ponto de atenção (risco alto). O papel caiu 9,4% no mês com oscilações diárias acima de 4%, e 61% do noticiário recente é negativo.

Se você já possui o ativo, vale revisar o tamanho da posição. Se não possui, o sistema sugere aguardar sinais de estabilização antes de considerar entrada.""",
        ["MGLU3"],
    ),
    (
        re.compile(r"vale", re.IGNORECASE),
        """VALE3 sinaliza um possível ponto de entrada: o preço está próximo de um suporte respeitado há 6 meses (nível onde historicamente aparecem compradores) e o minério de ferro se recupera há 3 semanas.

Ponto de cautela: o volume ainda está 12% abaixo da média, então o sistema recomenda acompanhar a confirmação antes de decidir.""",
        ["VALE3"],
    ),
    (
        re.compile(r"risco", re.IGNORECASE),
        """Hoje o sistema identificou 2 riscos importantes:

⚠ MGLU3 — volatilidade elevada: queda de 9,4% com oscilações bruscas e noticiário negativo.
⚠ HAPV3 — pressão do noticiário: custos do setor de saúde pressionam o papel, sem sinal de reversão.

O nível de risco considera volatilidade, tom das notícias e comportamento do volume — nunca apenas um fator isolado.""",
        ["MGLU3", "HAPV3"],
    ),
    (
        re.compile(r"confian", re.IGNORECASE),
        """A confiança mede o quanto os sinais analisados apontam na mesma direção. Quando volume, tendência, notícias e indicadores técnicos convergem, a confiança sobe; quando se contradizem, ela cai.

Importante: 91% de confiança não significa 91% de chance de lucro — significa que os dados disponíveis são fortemente consistentes entre si.""",
        [],
    ),
    (
        re.compile(r"oportunidad", re.IGNORECASE),
        """As 4 oportunidades de hoje:

↗ PETR4 (91%) — volume, tendência e notícias convergindo;
↗ WEGE3 (88%) — crescimento consistente com baixa oscilação;
↗ VALE3 (84%) — preço próximo de suporte histórico;
↗ ITUB4 (79%) — dividendos acima da média com estabilidade.

Abra a Central de Recomendações para ver as evidências completas de cada uma.""",
        ["PETR4", "WEGE3", "VALE3", "ITUB4"],
    ),
    (
        re.compile(r"funciona|como|sistema", re.IGNORECASE),
        """O sistema trabalha em 5 etapas contínuas:

1. DADOS — coleta preços, volumes e notícias da B3;
2. PROCESSAMENTO — limpa e organiza esses dados;
3. INTELIGÊNCIA — cruza sinais e identifica padrões;
4. RECOMENDAÇÃO — traduz os padrões em análises explicadas;
5. DECISÃO — você decide, com os dados a seu favor.

Cada recomendação mostra as evidências e o nível de confiança para você nunca depender de uma "caixa-preta".""",
        [],
    ),
]

PADRAO = """Posso explicar qualquer análise de hoje. Experimente perguntar:

· "Por que PETR4 é uma oportunidade?"
· "Quais os riscos de hoje?"
· "O que significa confiança de 91%?"
· "Como o sistema funciona?\""""


def responder(mensagem: str) -> tuple[str, list[str]]:
    """Devolve (texto, tickers_citados) em modo regra."""
    for padrao, texto, tickers in _REGRAS:
        if padrao.search(mensagem or ""):
            return texto, tickers
    return PADRAO, []
