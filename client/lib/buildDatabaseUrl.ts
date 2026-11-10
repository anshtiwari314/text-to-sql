/** Build a connection URL from form fields (inverse of parseDatabaseUrl). */

const ENGINE_SCHEME: Record<string, string> = {
  PostgreSQL: "postgresql",
  MySQL: "mysql",
  SQLite: "sqlite",
  "SQL Server": "sqlserver",
};

export type ConnectionFields = {
  engine: string;
  host: string;
  port: string;
  db_username: string;
  db_password: string;
  db_name: string;
};

export function buildDatabaseUrl(fields: ConnectionFields): string {
  const scheme = ENGINE_SCHEME[fields.engine] || "postgresql";

  if (fields.engine === "SQLite") {
    const path = fields.db_name || fields.host;
    if (!path) return "";
    return `sqlite:///${path.replace(/^\//, "")}`;
  }

  if (!fields.host.trim() || !fields.db_name.trim()) return "";

  const user = encodeURIComponent(fields.db_username);
  const pass = encodeURIComponent(fields.db_password);
  let auth = "";
  if (fields.db_username || fields.db_password) {
    auth = `${user}:${pass}@`;
  }

  const portPart = fields.port.trim() ? `:${fields.port.trim()}` : "";
  const dbPath = fields.db_name.split("/").map(encodeURIComponent).join("/");

  return `${scheme}://${auth}${fields.host.trim()}${portPart}/${dbPath}`;
}
