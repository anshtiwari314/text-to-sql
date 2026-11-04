"""
Offline backend flow test (fake LLM). Uses same JSON {sql, explanation} as agent.py.

Run:  uv run python tests/test_flow.py
"""

import json
import os
import sqlite3
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_core.messages import AIMessage

from app import app
import services.llm_service as llm_service

DB_PATH = os.path.join(tempfile.mkdtemp(), "shop.db")
sqlite3.connect(DB_PATH).executescript("""
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount DECIMAL(10,2));
INSERT INTO customers (name, email) VALUES ('Ava','ava@x.com'), ('Ben','ben@x.com');
INSERT INTO orders (customer_id, amount) VALUES (1, 50.5), (1, 20), (2, 99.9);
""")

CREDENTIALS = {"engine": "SQLite", "db_name": DB_PATH}
llm_service.OPENROUTER_API_KEY = "test-key"
seen = {}


class FakeChatOpenAI:
    def invoke(self, messages):
        seen["system"] = messages[0].content
        seen["history"] = messages[1:-1]
        question = messages[-1].content
        if "sales" in question.lower():
            payload = {"sql": "", "explanation": "Do you mean total amount or order count?"}
        else:
            payload = {
                "sql": (
                    "SELECT c.name, SUM(o.amount) AS total FROM customers c "
                    "JOIN orders o ON o.customer_id = c.id GROUP BY c.name ORDER BY total DESC"
                ),
                "explanation": "Total spend per customer.",
            }
        return AIMessage(content=json.dumps(payload))


llm_service.ChatOpenAI = lambda **_kwargs: FakeChatOpenAI()

client = app.test_client()

response = client.post("/api/schema", json={"credentials": CREDENTIALS}).get_json()
print("1) /api/schema connected =", response["connected"])
print("   CREATE TABLE count =", response["schema"].upper().count("CREATE TABLE"))

response = client.post("/api/fullfill_query", json={
    "prompt": "who spent the most?",
    "history": [
        {"role": "user", "content": "hi"},
        {"role": "ai", "content": "hello"},
    ],
    "credentials": CREDENTIALS,
}).get_json()

print("\n2) /api/fullfill_query (clear question)")
print("   type =", response["type"], "| rows =", response["rows"])
print("   sql  =", " ".join(response["sql"].split()))
print("   LLM history messages =", len(seen["history"]))

response = client.post("/api/fullfill_query", json={
    "prompt": "show me sales",
    "credentials": CREDENTIALS,
}).get_json()

print("\n3) /api/fullfill_query (empty sql from model)")
print("   type =", response["type"], "| message =", response["message"], "| sql =", response["sql"])
