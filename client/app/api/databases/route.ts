import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT 
        id, 
        conn_name AS name, 
        engine, 
        host, 
        port, 
        db_name,
        read_only
      FROM saved_databases 
      WHERE user_id = $1`,
      [session.user.id]
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
  // 1. Verify user session
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { conn_name, engine, host, port, db_username, db_password, db_name } = data;

    // 2. Save to database using the pg pool
    const result = await query(
      `INSERT INTO saved_databases 
      (user_id, conn_name, engine, host, port, db_username, db_password, db_name) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [session.user.id, conn_name, engine, host, port, db_username, db_password, db_name]
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