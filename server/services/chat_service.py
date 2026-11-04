"""
The "brain" behind POST /api/fullfill_query.

Routes stay thin; the order of work lives here:
  connect -> reflect DDL schema -> LLM (JSON sql) -> run SQL -> answer
"""

import logging

from core.engines import get_credentials
from services.db_service import count_tables_in_schema, fetch_schema, run_sql
from services.llm_service import generate_sql
from services.schema_format import SCHEMA_EMPTY
from services.schema_query_hints import try_direct_country_sql
from services.w3schools_sql import enforce_w3schools_table_casing

logger = logging.getLogger(__name__)


def fullfill_query(payload):
    prompt = (payload.get("prompt") or "").strip()
    if not prompt:
        raise ValueError("prompt is required")

    conn = get_credentials(payload)

    schema = fetch_schema(conn)
    table_count = count_tables_in_schema(schema)
    logger.info(
        "fullfill_query: engine=%s db=%r tables=%s schema_chars=%s",
        conn["engine"],
        conn.get("database"),
        table_count,
        len(schema),
    )

    if table_count == 0 or schema == SCHEMA_EMPTY:
        return {
            "type": "error",
            "message": (
                "No tables were loaded. Check Data Sources → engine, host, port, database name "
                "(e.g. MySQL database w3schools like in agent.py). Restart Flask after changes."
            ),
            "sql": None,
            "columns": [],
            "rows": [],
            "schemaTables": 0,
        }

    try:
        llm_out = generate_sql(
            prompt=prompt,
            schema=schema,
            history=payload.get("history"),
            dialect=conn["dialect"],
            dialect_hint=conn["sql_hint"],
        )
        sql = llm_out["sql"]
        message = llm_out["explanation"]
    except RuntimeError as error:
        return {
            "type": "error",
            "message": str(error),
            "sql": None,
            "columns": [],
            "rows": [],
        }

    if not sql:
        direct = try_direct_country_sql(prompt, schema, conn["engine"])
        if direct:
            logger.info("fullfill_query: using direct Country SQL fallback")
            sql = direct
            message = "List of distinct customer countries."
        else:
            return {
                "type": "clarification",
                "message": message or "Could not generate SQL.",
                "sql": None,
                "columns": [],
                "rows": [],
                "schemaTables": table_count,
            }

    sql = enforce_w3schools_table_casing(sql, conn["engine"])

    try:
        columns, rows, truncated = run_sql(sql, conn)
    except ValueError as error:
        return {
            "type": "error",
            "message": str(error),
            "sql": sql,
            "columns": [],
            "rows": [],
        }

    return {
        "type": "success",
        "message": message or f"Found {len(rows)} row(s).",
        "sql": sql,
        "columns": columns,
        "rows": rows,
        "truncated": truncated,
    }
