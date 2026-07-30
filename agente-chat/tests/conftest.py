import json
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="session")
def snapshot():
    """A mesma análise do dia que o front consome — fonte do validador."""
    caminho = RAIZ / "src" / "mocks" / "analise-do-dia.json"
    return json.loads(caminho.read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def tickers_validos(snapshot):
    from app.contexto import tickers_conhecidos

    return tickers_conhecidos(snapshot)


@pytest.fixture(scope="session")
def golden():
    caminho = Path(__file__).parent / "golden_set.json"
    return json.loads(caminho.read_text(encoding="utf-8"))["perguntas"]
