/** Product name, SEO copy, and the databases QueryAI can connect to. */

export const SITE_NAME = "QueryAI";
export const SITE_TAGLINE = "Text-to-SQL AI";

export const SUPPORTED_DATABASES = [
  {
    name: "PostgreSQL",
    short: "Postgres",
    detail: "v10–v16, RDS, Cloud SQL, and local",
    summary: "Native Postgres dialect with CTEs, window functions, JSONB, and LIMIT.",
  },
  {
    name: "MySQL",
    short: "MySQL",
    detail: "5.7 / 8.0",
    summary: "Backtick identifiers and LIMIT for MySQL schemas.",
  },
  {
    name: "MariaDB",
    short: "MariaDB",
    detail: "MySQL-compatible",
    summary: "Connect MariaDB with the same driver as MySQL.",
  },
  {
    name: "SQLite",
    short: "SQLite",
    detail: "File-based",
    summary: "Point QueryAI at a local .db / .sqlite file.",
  },
  {
    name: "Microsoft SQL Server",
    short: "SQL Server",
    detail: "T-SQL / Azure SQL",
    summary: "T-SQL dialect with TOP N instead of LIMIT. Includes Azure SQL.",
  },
] as const;

export const DATABASE_NAMES = SUPPORTED_DATABASES.map((db) => db.name);

export const DATABASE_LIST = DATABASE_NAMES.join(", ");
export const DATABASE_LIST_AND =
  DATABASE_NAMES.slice(0, -1).join(", ") + ", and " + DATABASE_NAMES[DATABASE_NAMES.length - 1];

export const SITE_DESCRIPTION =
  `QueryAI is a text-to-SQL AI that turns natural language into SQL and runs it on your database. ` +
  `Connect ${DATABASE_LIST_AND} and chat with your data in plain English.`;

export const SITE_KEYWORDS = [
  "QueryAI",
  "text-to-SQL",
  "text to SQL AI",
  "text-to-sql AI",
  "natural language to SQL",
  "NLP to SQL",
  "AI SQL generator",
  "chat with your database",
  "SQL chatbot",
  "generate SQL from English",
  ...DATABASE_NAMES,
  "PostgreSQL text to SQL",
  "MySQL text to SQL",
  "MariaDB text to SQL",
  "SQLite text to SQL",
  "SQL Server text to SQL",
  "Azure SQL AI",
];

export function siteUrl() {
  const raw = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
