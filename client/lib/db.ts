import { Pool } from 'pg';

/** Prisma adds ?schema=public; node-pg should not receive that query string. */
function pgUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  const noQuery = raw.split('?')[0];
  if (noQuery === raw) return raw;
  console.log('[db] DATABASE_URL: stripped Prisma query params for pg driver');
  return noQuery;
}

const pool = new Pool({
  connectionString: pgUrl(),
  max: 10,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);