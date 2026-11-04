"""
When the LLM returns empty sql but schema clearly has Country (W3Schools).
"""

import re

from services.schema_format import prompt_mentions_country
from services.w3schools_sql import W3SCHOOLS_TABLES


def _schema_has_country_column(schema_text):
    return bool(re.search(r"\bCountry\b", schema_text or "", re.IGNORECASE))


def _w3_customers_table(schema_text):
    for name in W3SCHOOLS_TABLES:
        if name.lower() == "customers":
            if re.search(rf"CREATE TABLE[`\"]?{name}\b", schema_text, re.IGNORECASE):
                return name
    if re.search(r'CREATE TABLE[`"]?customers[`"]?', schema_text, re.IGNORECASE):
        return "Customers"
    return None


def try_direct_country_sql(prompt, schema_text, engine="mysql"):
    if not prompt_mentions_country(prompt) or not _schema_has_country_column(schema_text):
        return None

    table = _w3_customers_table(schema_text) or "Customers"
    if engine == "mysql":
        t, c = f"`{table}`", "`Country`"
    elif engine == "postgresql":
        t, c = f'"{table}"', '"Country"'
    else:
        t, c = table, "Country"

    return (
        f"SELECT DISTINCT {c} FROM {t} "
        f"WHERE {c} IS NOT NULL AND {c} <> '' "
        f"ORDER BY {c}"
    )
