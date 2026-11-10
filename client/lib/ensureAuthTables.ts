import { query } from '@/lib/db';

let ready = false;

export async function ensureAuthTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255),
      email VARCHAR(255) NOT NULL,
      image TEXT,
      last_login TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email)`);

  // Always apply column alters (safe with IF NOT EXISTS).
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true`);
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
    CREATE TABLE IF NOT EXISTS email_verifications (
      token TEXT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS email_otps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS email_otps_email_idx ON email_otps (LOWER(email))`);
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
