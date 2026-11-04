export type ViewState =
  | 'chat'
  | 'chat_history'
  | 'db_list'
  | 'db_schemas'
  | 'new_db'
  | 'db_details';

export interface ParsedTableSchema {
  name: string;
  ddl: string;
}

export interface SavedChatSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  database_id: string;
  db_name: string;
}

export interface DatabaseConnection {
  id: string; // Changed from number to string to support Postgres UUIDs
  name: string;
  engine: string;
  host: string;
  port?: number;
  db_name?: string;
  readOnly: boolean;
}
export type ChatRole = "user" | "ai";

// One bubble in the chat. This is ALSO what we send to Flask as "history".
export interface ChatMessage {
  id: number;
  role: ChatRole;
  content: string;
  sql?: string | null;
  columns?: string[];
  rows?: Record<string, unknown>[];
}

// What Flask's /api/fullfill_query replies with.
export type QueryResultType = "success" | "clarification" | "error";

export interface QueryResult {
  type: QueryResultType;
  message: string;
  sql: string | null;
  columns: string[];
  rows: Record<string, unknown>[];
  truncated?: boolean;
}

// Connection details we forward to Flask (never returned to the browser).
export interface DbCredentials {
  engine: string;
  host: string;
  port?: number | null;
  db_name: string;
  db_username: string;
  db_password: string;
}
