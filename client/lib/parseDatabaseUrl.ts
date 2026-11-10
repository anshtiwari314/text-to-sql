/** Parse standard DB URLs into saved_databases columns. */
export type ParsedDatabaseUrl = {
  engine: string;
  host: string;
  port: number | null;
  db_username: string;
  db_password: string;
  db_name: string;
};

const SCHEME_ENGINE: Record<string, string> = {
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  mariadb: "MySQL",
  sqlite: "SQLite",
  sqlite3: "SQLite",
  mssql: "SQL Server",
  sqlserver: "SQL Server",
};

function engineFromScheme(scheme: string): string | null {
  const base = scheme.split("+")[0].toLowerCase();
  return SCHEME_ENGINE[base] ?? null;
}

function defaultPort(engine: string): number | null {
  if (engine === "SQLite") return null;
  if (engine === "MySQL") return 3306;
  if (engine === "SQL Server") return 1433;
  return 5432;
}

export function parseDatabaseUrl(raw: string): ParsedDatabaseUrl {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Connection URL is empty");

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Invalid connection URL");
  }

  const scheme = url.protocol.replace(/:$/, "");
  const engine = engineFromScheme(scheme);
  if (!engine) {
    throw new Error(`Unsupported URL scheme "${scheme}"`);
  }

  console.log("[db-config] parseDatabaseUrl", engine, url.hostname || "sqlite");

  if (engine === "SQLite") {
    const path = decodeURIComponent(url.pathname.replace(/^\//, ""));
    return {
      engine,
      host: path || trimmed,
      port: null,
      db_username: "",
      db_password: "",
      db_name: path,
    };
  }

  const db_name = decodeURIComponent(url.pathname.replace(/^\//, "").split("?")[0]);
  if (!db_name) throw new Error("URL must include a database name");

  return {
    engine,
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : defaultPort(engine),
    db_username: decodeURIComponent(url.username),
    db_password: decodeURIComponent(url.password),
    db_name,
  };
}
