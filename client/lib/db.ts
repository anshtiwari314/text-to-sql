import { Pool } from 'pg';

// Creates a single connection pool to your primary application database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // e.g., postgres://user:pass@host:5432/sql_app
  max: 10, // Max number of connections
});

export const query = (text: string, params?: any[]) => pool.query(text, params);