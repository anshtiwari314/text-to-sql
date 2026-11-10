-- Run against DATABASE_URL (app Postgres, not your user's MySQL/PG data sources):
--   psql "$DATABASE_URL" -f client/scripts/ensure_login_schema.sql

-- welcome_mailed lives on users (not on user_logins). false = admin "New login" mail not sent yet.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_mailed BOOLEAN;
UPDATE users SET welcome_mailed = true WHERE welcome_mailed IS NULL;
ALTER TABLE users ALTER COLUMN welcome_mailed SET DEFAULT false;

CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS user_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  method VARCHAR(50),
  location TEXT,
  local_time VARCHAR(64),
  timezone VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_logins_user_id_idx ON user_logins (user_id);
CREATE INDEX IF NOT EXISTS user_logins_local_time_idx ON user_logins (local_time);
