import { query } from '@/lib/db';

let ready = false;

export async function ensureAuthTables() {
  // Always apply column alters (safe with IF NOT EXISTS).
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_mailed BOOLEAN`);
  await query(`UPDATE users SET welcome_mailed = true WHERE welcome_mailed IS NULL`);
  await query(`ALTER TABLE users ALTER COLUMN welcome_mailed SET DEFAULT false`);

  if (ready) return;
  await query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS user_logins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      method VARCHAR(50),
      location TEXT,
      local_time VARCHAR(64),
      timezone VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS user_logins_user_id_idx ON user_logins (user_id)`);
  await query(`CREATE INDEX IF NOT EXISTS user_logins_local_time_idx ON user_logins (local_time)`);
  ready = true;
}
