"""
MySQL / MariaDB schema text for the LLM.
"""

import logging

from sqlalchemy import text

from services.schema_format import SCHEMA_EMPTY, rows_to_schema_text

logger = logging.getLogger(__name__)


def _information_schema_rows(connection, db):
    return connection.execute(
        text(
            """
            SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY
            FROM information_schema.COLUMNS
            WHERE LOWER(TABLE_SCHEMA) = LOWER(:db)
            ORDER BY TABLE_NAME, ORDINAL_POSITION
            """
        ),
        {"db": db},
    ).fetchall()


def _show_tables_fallback(connection):
    table_rows = connection.execute(text("SHOW TABLES")).fetchall()
    if not table_rows:
        return []

    out = []
    for row in table_rows:
        table_name = row[0]
        col_rows = connection.execute(text(f"SHOW COLUMNS FROM `{table_name}`")).fetchall()
        for col in col_rows:
            field_name, col_type, _null, key, *_rest = col
            out.append((table_name, field_name, col_type, key or ""))
    return out


def fetch_mysql_schema_text(connection, database_name):
    active_db = connection.execute(text("SELECT DATABASE()")).scalar()
    saved_db = (database_name or "").strip()
    candidates = []
    for name in (active_db, saved_db):
        if name and name not in candidates:
            candidates.append(name)

    rows = []
    used_db = None
    for db in candidates:
        rows = _information_schema_rows(connection, db)
        if rows:
            used_db = db
            break

    if not rows:
        logger.warning(
            "mysql_schema: information_schema empty for candidates %r (DATABASE()=%r)",
            candidates,
            active_db,
        )
        raw = _show_tables_fallback(connection)
        if raw:
            schema_text = rows_to_schema_text(raw)
            logger.info(
                "mysql_schema: SHOW TABLES fallback -> %s tables, %s chars",
                schema_text.count('Table "'),
                len(schema_text),
            )
            return schema_text
        return SCHEMA_EMPTY

    schema_text = rows_to_schema_text(rows)
    logger.info(
        "mysql_schema: loaded %s tables, %s chars for schema %r",
        schema_text.count('Table "'),
        len(schema_text),
        used_db,
    )
    return schema_text
