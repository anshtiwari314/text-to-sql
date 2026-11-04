"""
LLM -> SQL, aligned with Ai-course/3-text-to-sql/agent.py:
  reflect DDL in system prompt, JSON { sql, explanation }, OpenRouter headers.
"""

import logging

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from core.config import (
    HISTORY_LIMIT,
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    OPENROUTER_MODEL,
)
from services.llm_json_parse import message_text, parse_llm_json

logger = logging.getLogger(__name__)

# Same wording as Ai-course/3-text-to-sql/agent.py. {schema} is filled with CREATE TABLE DDL.
SYSTEM_PROMPT = """
    You are an expert {dialect} database administrator and data analyst. Your task is to translate the user's natural language request into a valid, optimized {dialect} query.

    ### DATABASE SCHEMA:
    {schema}

    ### STRICT RULES:
    1. PERMITTED ACTIONS: You may only generate `SELECT` statements.
    2. PROHIBITED ACTIONS: NEVER generate `INSERT`, `DROP`, `DELETE`, `UPDATE`, `ALTER`, or `TRUNCATE` statements under any circumstances.
    3. If the user requests a prohibited action, or asks a question unrelated to the database, leave the SQL string empty.
    4. Use strict {dialect} syntax. Ensure all table names, column names, and relationships exactly match the provided schema case sensitive. Do not hallucinate columns.
    5. You may only use the EXACT table names listed in the schema below.
    6. NEVER invent, assume, or hallucinate tables (e.g., do NOT use a `payments` or `users` table if they are not in the schema).
    7. All revenue and monetary calculations must be derived from OrderDetails (Quantity) and Products (Price).
    {dialect_hint}

    ### OUTPUT FORMAT:
    You must respond with a single, valid JSON object containing exactly two keys:
    - "sql": The raw, executable SQL string.
    - "explanation": A one-sentence plain English summary of exactly what the query does.
    """


def build_chat_history(old_messages):
    recent = (old_messages or [])[-HISTORY_LIMIT:]
    history = []
    for message in recent:
        role = message.get("role", "user")
        content = message.get("content") or ""
        if message.get("sql"):
            content += f"\n(SQL used: {message['sql']})"
        if role == "user":
            history.append(HumanMessage(content=content))
        else:
            history.append(AIMessage(content=content))
    return history


def generate_sql(prompt, schema, history=None, dialect="PostgreSQL", dialect_hint=""):
    if not OPENROUTER_API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY is missing. Set OPENROUTER_API_KEY=sk-or-... in server/.env "
            "(no surrounding quotes; python-dotenv fails on \"\"key\"\")."
        )

    if not schema or schema.startswith("(this database"):
        raise RuntimeError("Database schema is empty — cannot generate SQL.")

    model = ChatOpenAI(
        model=OPENROUTER_MODEL,
        api_key=OPENROUTER_API_KEY,
        base_url=OPENROUTER_BASE_URL,
        temperature=0.1,
        default_headers={
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Text-to-SQL App",
            "Accept": "application/json",
        },
    )

    # replace(), not format(): CREATE TABLE text can contain { } and would break format().
    hint = dialect_hint or ""
    system = (
        SYSTEM_PROMPT.replace("{dialect}", dialect)
        .replace("{schema}", schema)
        .replace("{dialect_hint}", hint)
    )
    messages = [SystemMessage(content=system)]
    messages.extend(build_chat_history(history))
    messages.append(HumanMessage(content=prompt))

    logger.info("llm_service: invoking model=%s schema_chars=%s", OPENROUTER_MODEL, len(schema))
    result = model.invoke(messages)
    raw = message_text(result.content)
    parsed = parse_llm_json(raw)

    if not parsed:
        preview = raw.replace("\n", " ")[:400]
        logger.warning("llm_service: could not read sql from model reply: %s", preview)
        raise RuntimeError("The model did not return valid JSON with sql and explanation.")

    sql = (parsed.get("sql") or "").strip()
    explanation = (parsed.get("explanation") or "").strip() or "Query generated."
    logger.info("llm_service: sql_len=%s", len(sql))
    return {"sql": sql, "explanation": explanation}


# Backward-compatible name for tests that still patch this symbol
def generate_sql_or_clarify(prompt, schema, history=None, dialect="PostgreSQL", dialect_hint=""):
    from models.agent_response import AgentResponse

    out = generate_sql(prompt, schema, history, dialect, dialect_hint)
    if not out["sql"]:
        return AgentResponse(
            needs_clarification=True,
            question=out["explanation"] or "Could not generate SQL for that question.",
            sql="",
        )
    return AgentResponse(needs_clarification=False, question="", sql=out["sql"])
