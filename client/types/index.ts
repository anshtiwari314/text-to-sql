export type ViewState = "chat" | "chat_history" | "db_list" | "new_db" | "db_details";

export interface DatabaseConnection {
  id: number;
  name: string;
  engine: string;
  host: string;
  readOnly: boolean;
}