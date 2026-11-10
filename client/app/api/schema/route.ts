import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callFlask } from '@/lib/flask';
import { getRequestUser } from '@/lib/getRequestUser';

/**
 * STEP 1: the user picked a database in the UI.
 * 1. load its credentials from Postgres (only if they belong to this user)
 * 2. ask Flask to connect + read the schema  -> proves the DB works
 * 3. return the schema text (the browser keeps it for the chat)
 */
export async function POST(req: Request) {
  const user = await getRequestUser(req);
  console.log("[api] schema POST", user?.email || "anonymous");
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { databaseId } = await req.json();
  if (!databaseId) {
    return NextResponse.json({ error: "databaseId is required" }, { status: 400 });
  }

  const dbResult = await query(
    `SELECT engine, host, port, db_name, db_username, db_password
     FROM saved_databases WHERE id = $1 AND user_id = $2`,
    [databaseId, user.id]
  );

  if (dbResult.rows.length === 0) {
    return NextResponse.json({ error: "Database not found" }, { status: 404 });
  }

  const { ok, status, data } = await callFlask('/schema', { credentials: dbResult.rows[0] });
  if (!ok) {
    // Connection failed -> the UI shows this as "database not connected"
    return NextResponse.json({ error: data.error || "Could not connect" }, { status });
  }

  return NextResponse.json(data, { status: 200 });
}
