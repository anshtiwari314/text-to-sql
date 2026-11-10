"""
Everything that touches the USER's database lives here (not Flask, not the LLM).

Two jobs:
  1. fetch_schema()  - read table + column names, build a simple text schema
  2. run_sql()       - execute the SQL the LLM wrote, return rows
"""

import logging
import re

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from core.config import MAX_ROWS, QUERY_TIMEOUT_MS
from services.schema_reflect_ddl import fetch_schema_ddl
from services.schema_format import SCHEMA_EMPTY

logger = logging.getLogger(__name__)


def _make_engine(conn):
    """Open a connection using the standard connection info from engines.py."""
    engine_name = conn["engine"]

    if engine_name == "sqlite":
        return create_engine(conn["sqlalchemy_url"])

    if engine_name == "sqlserver":
        # SQL Server needs a special timeout argument
        return create_engine(conn["sqlalchemy_url"], connect_args={"timeout": QUERY_TIMEOUT_MS // 1000})

    return create_engine(
        conn["sqlalchemy_url"],
        # PostgreSQL / MySQL: kill a query that runs too long
        connect_args={"options": f"-c statement_timeout={QUERY_TIMEOUT_MS}"} if engine_name == "postgresql" else {},
    )


# ---------------------------------------------------------------------------
# 1. SCHEMA
# ---------------------------------------------------------------------------
def fetch_schema(conn):
    """
    Returns CREATE TABLE DDL text (same strategy as Ai-course/3-text-to-sql/agent.py).
    """
    engine = _make_engine(conn)

    host, port = conn.get("host"), conn.get("port")
    logger.info("fetch_schema dial %s:%s engine=%s db=%r", host, port, conn["engine"], conn.get("database"))
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        schema_text, table_count = fetch_schema_ddl(engine)
        if table_count == 0:
            logger.warning("fetch_schema: DDL reflect empty for engine=%s db=%r", conn["engine"], conn.get("database"))
        return schema_text
    except SQLAlchemyError as error:
        hint = ""
        if host and "ngrok" in str(host).lower() and port in (3306, "3306", None, ""):
            hint = " (ngrok needs the public port from the ngrok UI, not 3306)"
        logger.error("fetch_schema failed %s:%s — %s", host, port, error)
        raise ConnectionError(f"Could not connect to the database at {host}:{port}{hint}: {error}") from error
    finally:
        engine.dispose()


def count_tables_in_schema(schema_text):
    if not schema_text or schema_text == SCHEMA_EMPTY:
        return 0
    n = schema_text.upper().count("CREATE TABLE")
    if n:
        return n
    return schema_text.count('Table "')


# ---------------------------------------------------------------------------
# 2. RUN SQL
# ---------------------------------------------------------------------------
# Only SELECT-ish statements are allowed. This is the read-only guard.
_READ_ONLY_START = re.compile(r"^\s*(select|with)\b", re.IGNORECASE)
_DANGEROUS = re.compile(
    r"\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|attach|detach|pragma)\b",
    re.IGNORECASE,
)


def is_read_only(sql):
    """True only for a single SELECT / WITH ... SELECT statement."""
    cleaned = sql.strip().rstrip(";")
    return bool(_READ_ONLY_START.match(cleaned)) and not _DANGEROUS.search(cleaned)


def run_sql(sql, conn):
    """
    Execute the SQL and return a list of dicts (JSON friendly).
    LIMIT is added automatically when the query doesn't already limit rows.
    """
    if not is_read_only(sql):
        raise ValueError("Only read-only SELECT queries are allowed.")

    final_sql = sql.strip().rstrip(";")
    if not re.search(r"\blimit\b", final_sql, re.IGNORECASE) and conn["engine"] != "sqlserver":
        final_sql = f"{final_sql} LIMIT {MAX_ROWS}"

    engine = _make_engine(conn)
    try:
        with engine.connect() as connection:
            result = connection.execute(text(final_sql))
            columns = list(result.keys())
            # Convert every value to something JSON can handle (dates, decimals, bytes...)
            fetched = result.fetchall()
            rows = [
                {column: _to_json_safe(value) for column, value in zip(columns, row)}
                for row in fetched[:MAX_ROWS]
            ]
            return columns, rows, len(fetched) > MAX_ROWS  # (rows, was_truncated)

    except SQLAlchemyError as error:
        raise ValueError(f"SQL failed to run: {error}") from error
    finally:
        engine.dispose()


def _to_json_safe(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, (bytes, bytearray)):
        return value.decode("utf-8", errors="replace")
    return str(value)  # dates, Decimals, UUIDs, ...


def run_schema_query(sql, conn):
    """Run a query the LLM wrote for schema questions, merging rows into one text block."""
    columns, rows = run_sql(sql, conn)
    return "Schema query results:\n" + "\n".join(f"{row}" for row in rows)
