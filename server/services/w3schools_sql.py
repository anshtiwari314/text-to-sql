"""W3Schools MySQL table names are PascalCase — match the course agent.py."""

import logging
import re

logger = logging.getLogger(__name__)

W3SCHOOLS_TABLES = [
    "Customers",
    "Categories",
    "Employees",
    "OrderDetails",
    "Orders",
    "Products",
    "Shippers",
    "Suppliers",
]


def enforce_w3schools_table_casing(sql_string, engine):
    if not sql_string or engine != "mysql":
        return sql_string

    corrected = sql_string
    for valid_table in W3SCHOOLS_TABLES:
        pattern = re.compile(rf"\b{re.escape(valid_table)}\b", re.IGNORECASE)
        corrected = pattern.sub(valid_table, corrected)

    if corrected != sql_string:
        logger.info("w3schools_sql: adjusted table name casing in SQL")
    return corrected
