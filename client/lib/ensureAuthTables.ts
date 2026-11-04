import { query } from '@/lib/db';

let ready = false;

export async function ensureAuthTables() {
  if (ready) return;
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`);
  await query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `);
  ready = true;
}
