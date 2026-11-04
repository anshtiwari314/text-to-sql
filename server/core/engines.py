"""
The bridge between the Next.js app and this Flask server.

The Next.js UI lets the user pick PostgreSQL / MySQL / SQLite / SQL Server,
so nothing is hardcoded here: we compare the engine name the user picked
with the aliases in this file, and pick the right SQLAlchemy driver.

To support a NEW engine later, add one entry to ENGINES - that's it.
"""

# What the UI shows  ->  how we connect  &  how we talk to the LLM
ENGINES = {
    "postgresql": {
        "aliases": ["postgresql", "postgres", "pg", "psql"],
        "default_port": 5432,
        "dialect": "PostgreSQL",
        # Driver + URL format for SQLAlchemy
        "sqlalchemy_url": "postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}",
        # Shown to the LLM: which quoting style to use
        "sql_hint": 'Use double quotes for identifiers, e.g. SELECT * FROM "users". Use LIMIT.',
    },
    "mysql": {
        "aliases": ["mysql", "mariadb", "aurora-mysql"],
        "default_port": 3306,
        "dialect": "MySQL",
        "sqlalchemy_url": "mysql+pymysql://{user}:{password}@{host}:{port}/{database}",
        "sql_hint": "Use backticks for identifiers, e.g. SELECT * FROM `users`. Use LIMIT.",
    },
    "sqlserver": {
        "aliases": ["sqlserver", "sql server", "mssql", "azure-sql", "microsoft sql server"],
        "default_port": 1433,
        "dialect": "Microsoft SQL Server (T-SQL)",
        "sqlalchemy_url": "mssql+pyodbc://{user}:{password}@{host}:{port}/{database}?driver={driver}",
        "sql_hint": "Use TOP N instead of LIMIT, e.g. SELECT TOP 10 * FROM users.",
    },
}

# SQLite is a file, so it has its own URL (no host/port/user) - handled separately.
SQLITE_ALIASES = ["sqlite", "sqlite3"]


class UnsupportedEngineError(ValueError):
    """Raised when the UI sends an engine we don't know how to connect to."""


def get_engine(engine_name):
    """
    Turn whatever string the UI sent ('MySQL', 'PostgreSQL', ...) into an
    engine config dict + a clean canonical name.
    """
    name = (engine_name or "").strip().lower()

    if name in SQLITE_ALIASES:
        return "sqlite", {
            "default_port": None,
            "dialect": "SQLite",
            "sql_hint": "Use double quotes for identifiers. Use LIMIT.",
        }

    for canonical, config in ENGINES.items():
        if name in config["aliases"]:
            return canonical, config

    supported = ["PostgreSQL", "MySQL", "SQL Server", "SQLite"]
    raise UnsupportedEngineError(
        f"Engine '{engine_name}' is not supported yet. Supported: {', '.join(supported)}."
    )


def get_credentials(conn):
    """
    Bring connection details into ONE standard shape, no matter which
    engine it is.

    Next.js sends "credentials" (what the schema route cached). If a caller
    forgets it, we also accept the raw database row ("database").
    """
    from urllib.parse import quote_plus  # characters like @ / # in passwords must be escaped

    raw = conn.get("credentials") or conn.get("database") or {}

    engine_name = raw.get("engine", "PostgreSQL")
    canonical, engine = get_engine(engine_name)

    port = raw.get("port") or engine["default_port"]
    database = raw.get("db_name") or raw.get("database") or ""
    user = raw.get("db_username") or raw.get("user") or ""
    password = raw.get("db_password") or raw.get("password") or ""

    values = {
        "user": quote_plus(str(user)),
        "password": quote_plus(str(password)),
        "host": raw.get("host") or "",
        "port": port or "",
        "database": quote_plus(str(database)),  # escaped for the URL only
        "driver": "ODBC Driver 18 for SQL Server",
    }

    return {
        "engine": canonical,
        "dialect": engine["dialect"],
        "sql_hint": engine["sql_hint"],
        "user": user,
        "password": password,
        "host": raw.get("host"),
        "port": port,
        "database": database,
        # SQLite: the "database" field is a file path
        "sqlalchemy_url": f"sqlite:///{database}" if canonical == "sqlite"
        else engine["sqlalchemy_url"].format(**values),
    }
