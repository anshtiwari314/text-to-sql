import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getRequestUser } from '@/lib/getRequestUser';
import { resolveDatabaseConnection } from '@/lib/resolveDatabaseConnection';

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  console.log("[api] databases GET", user?.email || "anonymous");

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await query(
      // The real column is conn_name (the Prisma schema calls it "name").
      `SELECT 
        id, 
        conn_name AS name, 
        engine, 
        host, 
        port, 
        db_name,
        db_username,
        read_only
      FROM saved_databases 
      WHERE user_id = $1`,
      [user.id]
    );

    const databases = result.rows.map(row => ({
      ...row,
      readOnly: row.read_only || false
    }));

    return NextResponse.json({ databases }, { status: 200 });

  } catch (error) {
    console.error("Error fetching databases:", error);
    return NextResponse.json({ error: "Failed to fetch databases" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  console.log("[api] databases POST", user?.email || "anonymous");

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    let resolved;
    try {
      resolved = resolveDatabaseConnection(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid connection details";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { conn_name, engine, host, port, db_username, db_password, db_name } = resolved;

    const result = await query(
      `INSERT INTO saved_databases 
      (user_id, conn_name, engine, host, port, db_username, db_password, db_name) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [user.id, conn_name, engine, host, port, db_username, db_password, db_name]
    );

    return NextResponse.json({ 
      message: "Database connection saved successfully", 
      databaseId: result.rows[0].id 
    }, { status: 200 });

  } catch (error) {
    console.error("Error saving database:", error);
    return NextResponse.json({ error: "Failed to save database connection" }, { status: 500 });
  }
}
