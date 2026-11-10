export type ChatRole = "user" | "ai";

export interface ChatMessage {
  id: number;
  role: ChatRole;
  content: string;
  sql?: string | null;
  columns?: string[];
  rows?: Record<string, unknown>[];
}

export interface DatabaseConnection {
  id: string;
  name: string;
  engine: string;
  host: string;
  port?: number;
  db_name?: string;
  readOnly: boolean;
}

export interface SavedChatSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  database_id: string;
  db_name: string;
}

export interface ParsedTableSchema {
  name: string;
  ddl: string;
}

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
