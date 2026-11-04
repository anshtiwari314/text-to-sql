"""
PostgreSQL schema text for the LLM.

Postgres "database" (db_name) is NOT the same as table schema — tables usually
live in `public`. Using db_name as schema name returns zero tables (root cause
of missing Country column for W3Schools on Postgres).
"""

import logging

from sqlalchemy import text

from services.schema_format import SCHEMA_EMPTY, rows_to_schema_text

logger = logging.getLogger(__name__)

_PG_COLUMNS_SQL = """
SELECT c.table_name, c.column_name, c.data_type,
       CASE WHEN EXISTS (
         SELECT 1
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_schema = kcu.constraint_schema
          AND tc.constraint_name = kcu.constraint_name
         WHERE tc.constraint_type = 'PRIMARY KEY'
           AND tc.table_schema = c.table_schema
           AND kcu.table_name = c.table_name
           AND kcu.column_name = c.column_name
       ) THEN 'PRI' ELSE '' END AS column_key
FROM information_schema.columns c
WHERE c.table_schema = :pg_schema
ORDER BY c.table_name, c.ordinal_position
"""


def fetch_postgres_schema_text(connection):
    rows = connection.execute(text(_PG_COLUMNS_SQL), {"pg_schema": "public"}).fetchall()
    used = "public"

    if not rows:
        logger.warning("postgres_schema: no columns in public, scanning user schemas")
        schema_names = [
            r[0]
            for r in connection.execute(
                text(
                    """
                    SELECT schema_name FROM information_schema.schemata
                    WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
                      AND schema_name NOT LIKE 'pg_%'
                    ORDER BY schema_name
                    """
                )
            ).fetchall()
        ]
        combined = []
        for name in schema_names:
            combined.extend(
                connection.execute(text(_PG_COLUMNS_SQL), {"pg_schema": name}).fetchall()
            )
        rows = combined
        used = ",".join(schema_names) or "none"

    if not rows:
        logger.warning("postgres_schema: no tables found in any user schema")
        return SCHEMA_EMPTY

    schema_text = rows_to_schema_text(rows)
    logger.info(
        "postgres_schema: loaded %s tables, %s chars (source=%s)",
        schema_text.count('Table "'),
        len(schema_text),
        used,
    )
    return schema_text
