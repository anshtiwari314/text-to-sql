import { parseDatabaseUrl } from "./parseDatabaseUrl";

export type DatabaseConnectionInput = {
  conn_name?: string;
  connection_url?: string;
  engine?: string | null;
  host?: string;
  port?: number | null;
  db_username?: string;
  db_password?: string;
  db_name?: string;
};

function defaultPort(engine: string): number | null {
  if (engine === "SQLite") return null;
  if (engine === "MySQL") return 3306;
  if (engine === "SQL Server") return 1433;
  return 5432;
}

/** Normalize POST/PUT body: either connection_url or discrete fields. */
export function resolveDatabaseConnection(data: DatabaseConnectionInput) {
  const conn_name = (data.conn_name || "").trim();
  if (!conn_name) throw new Error("Connection name is required");

  const url = (data.connection_url || "").trim();
  if (url) {
    const parsed = parseDatabaseUrl(url);
    console.log("[db-config] resolve from URL", conn_name, parsed.engine);
    return {
      conn_name,
      engine: parsed.engine,
      host: parsed.host,
      port: parsed.port,
      db_username: parsed.db_username,
      db_password: parsed.db_password,
      db_name: parsed.db_name,
    };
  }

  const engine = (data.engine || "").trim();
  const host = (data.host || "").trim();
  const db_name = (data.db_name || "").trim();
  const db_username = data.db_username ?? "";
  const db_password = data.db_password ?? "";

  if (!engine || !host || !db_name) {
    throw new Error("Fill in all fields or paste a connection URL");
  }
  if (!db_username || !db_password) {
    throw new Error("Username and password are required (or use a connection URL)");
  }

  console.log("[db-config] resolve from fields", conn_name, engine);
  return {
    conn_name,
    engine,
    host,
    port: data.port ?? defaultPort(engine),
    db_username,
    db_password,
    db_name,
  };
}

/** PUT: URL replaces connection; fields mode allows empty password (keep saved). */
export function resolveDatabaseConnectionUpdate(data: DatabaseConnectionInput) {
  const conn_name = (data.conn_name || "").trim();
  if (!conn_name) throw new Error("Connection name is required");

  const url = (data.connection_url || "").trim();
  if (url) {
    const parsed = parseDatabaseUrl(url);
    console.log("[db-config] update from URL", conn_name, parsed.engine);
    return {
      conn_name,
      engine: parsed.engine,
      host: parsed.host,
      port: parsed.port,
      db_username: parsed.db_username || null,
      db_password: parsed.db_password || null,
      db_name: parsed.db_name,
      fromUrl: true as const,
    };
  }

  return {
    conn_name,
    engine: data.engine ?? null,
    host: data.host ?? null,
    port: data.port ?? null,
    db_name: data.db_name ?? null,
    db_username: data.db_username || null,
    db_password: data.db_password || null,
    fromUrl: false as const,
  };
}
