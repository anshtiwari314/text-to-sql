"""Shared schema text parsing helpers (all engines)."""

import re

SCHEMA_EMPTY = "(this database has no tables)"


def rows_to_schema_text(rows):
    """rows: list of (table_name, column_name, column_type, column_key)."""
    tables = {}
    for table_name, column_name, column_type, column_key in rows:
        tables.setdefault(table_name, []).append(
            (column_name, column_type, column_key == "PRI")
        )

    lines = []
    for table_name in sorted(tables):
        lines.append(f'Table "{table_name}"')
        for column_name, column_type, is_pk in tables[table_name]:
            note = ", primary key" if is_pk else ""
            lines.append(f"  - {column_name} ({column_type}{note})")
        lines.append("")

    return "\n".join(lines).strip()


def find_table_for_column(schema_text, column_name):
    """Return (table_name, column_name) if listed in schema text (case-insensitive)."""
    if not schema_text or schema_text == SCHEMA_EMPTY:
        return None

    current_table = None
    target = column_name.lower()
    for line in schema_text.splitlines():
        table_match = re.match(r'^Table "([^"]+)"\s*$', line)
        if table_match:
            current_table = table_match.group(1)
            continue
        if not current_table or not line.strip().startswith("- "):
            continue
        col_match = re.match(r"^\s*-\s*(\w+)", line)
        if col_match and col_match.group(1).lower() == target:
            return current_table, col_match.group(1)
    return None


def prompt_mentions_country(prompt):
    text_lower = (prompt or "").lower()
    return "country" in text_lower or "countries" in text_lower
