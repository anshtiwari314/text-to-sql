import { query } from '@/lib/db';

let ready = false;

/** Creates chat_sessions / chat_messages if missing (idempotent). */
export async function ensureChatTables() {
  if (ready) return;
  await query(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      database_id UUID NOT NULL REFERENCES saved_databases(id),
      title VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role VARCHAR(10) NOT NULL,
      content TEXT NOT NULL,
      sql TEXT,
      columns JSONB,
      rows JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  ready = true;
}
