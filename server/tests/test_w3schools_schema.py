"""
Schema + LLM tests aligned with Ai-course/3-text-to-sql/agent.py (DDL reflect + JSON sql).

Run:  uv run python tests/test_w3schools_schema.py
"""

import json
import os
import sqlite3
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_core.messages import AIMessage

from app import app
from core.engines import get_credentials
from services.db_service import count_tables_in_schema, fetch_schema
import services.llm_service as llm_service


W3_CUSTOMERS_DDL = """
CREATE TABLE customers (
  CustomerID INTEGER PRIMARY KEY,
  CustomerName TEXT,
  ContactName TEXT,
  Address TEXT,
  City TEXT,
  PostalCode TEXT,
  Country TEXT
);
CREATE TABLE orders (
  OrderID INTEGER PRIMARY KEY,
  CustomerID INTEGER,
  OrderDate TEXT
);
INSERT INTO customers (CustomerName, Country) VALUES ('Acme', 'Germany');
"""


def _sqlite_w3_path():
    path = os.path.join(tempfile.mkdtemp(), "w3schools_like.db")
    sqlite3.connect(path).executescript(W3_CUSTOMERS_DDL)
    return path


class FakeChatOpenAI:
    def __init__(self, on_invoke):
        self._on_invoke = on_invoke

    def invoke(self, messages):
        return AIMessage(content=self._on_invoke(messages))


def test_fetch_schema_ddl_includes_country():
    path = _sqlite_w3_path()
    conn = get_credentials({"credentials": {"engine": "SQLite", "db_name": path}})
    schema = fetch_schema(conn)
    assert "CREATE TABLE" in schema.upper(), schema[:400]
    assert "Country" in schema
    assert count_tables_in_schema(schema) >= 2


def test_llm_system_prompt_contains_ddl():
    path = _sqlite_w3_path()
    llm_service.OPENROUTER_API_KEY = "test-key"
    captured = {}

    def on_invoke(messages):
        captured["system"] = messages[0].content
        return json.dumps(
            {
                "sql": "SELECT DISTINCT Country FROM customers ORDER BY Country",
                "explanation": "Distinct countries.",
            }
        )

    llm_service.ChatOpenAI = lambda **_kwargs: FakeChatOpenAI(on_invoke)

    client = app.test_client()
    response = client.post(
        "/api/fullfill_query",
        json={
            "prompt": "list unique countries for customers",
            "credentials": {"engine": "SQLite", "db_name": path},
        },
    ).get_json()

    assert response["type"] == "success", response
    assert "CREATE TABLE" in captured["system"]
    assert "Country" in captured["system"]


def test_empty_sql_uses_country_fallback():
    path = _sqlite_w3_path()
    llm_service.OPENROUTER_API_KEY = "test-key"

    def on_invoke(_messages):
        return json.dumps({"sql": "", "explanation": "unsure"})

    llm_service.ChatOpenAI = lambda **_kwargs: FakeChatOpenAI(on_invoke)

    client = app.test_client()
    response = client.post(
        "/api/fullfill_query",
        json={
            "prompt": "Give me a list of unique countries where our customers are located.",
            "credentials": {"engine": "SQLite", "db_name": path},
        },
    ).get_json()

    assert response["type"] == "success", response
    assert response["sql"] and "Country" in response["sql"]


if __name__ == "__main__":
    test_fetch_schema_ddl_includes_country()
    test_llm_system_prompt_contains_ddl()
    test_empty_sql_uses_country_fallback()
    print("All w3schools schema tests passed.")
