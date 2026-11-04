"""
Load schema the same way as the working course agent.py:
MetaData.reflect() -> CREATE TABLE ... DDL for each table.
"""

import logging

from sqlalchemy import MetaData
from sqlalchemy.schema import CreateTable

from services.schema_format import SCHEMA_EMPTY

logger = logging.getLogger(__name__)


def fetch_schema_ddl(engine):
    metadata = MetaData()
    metadata.reflect(bind=engine)
    tables = metadata.sorted_tables

    if not tables:
        logger.warning("schema_reflect_ddl: reflect found 0 tables")
        return SCHEMA_EMPTY, 0

    chunks = []
    for table in tables:
        ddl = str(CreateTable(table).compile(dialect=engine.dialect)).strip()
        chunks.append(ddl + ";")

    text = "\n\n".join(chunks)
    logger.info("schema_reflect_ddl: %s tables, %s chars", len(tables), len(text))
    return text, len(tables)
