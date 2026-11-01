export type ViewState = "chat" | "chat_history" | "db_list" | "new_db" | "db_details";

export interface DatabaseConnection {
  id: string; // Changed from number to string to support Postgres UUIDs
  name: string;
  engine: string;
  host: string;
  port?: number;
  db_name?: string;
  readOnly: boolean;
}