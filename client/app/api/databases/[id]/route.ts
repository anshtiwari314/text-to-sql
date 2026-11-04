import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { authOptions } from '@/lib/authOptions';

/**
 * Update an existing connection's configuration (/api/databases/[id]).
 * An empty password means "keep the saved one", so the form doesn't have to show it.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { conn_name, engine, host, port, db_name, db_username, db_password } = await req.json();

    const result = await query(
      `UPDATE saved_databases SET
         conn_name   = COALESCE($3, conn_name),
         engine      = COALESCE($4, engine),
         host        = COALESCE($5, host),
         port        = COALESCE($6, port),
         db_name     = COALESCE($7, db_name),
         db_username = COALESCE($8, db_username),
         db_password = COALESCE($9, db_password)
       WHERE id = $1 AND user_id = $2
       RETURNING id, conn_name, engine, host, port, db_name`,
      [
        id,
        session.user.id,
        conn_name ?? null,
        engine ?? null,
        host ?? null,
        port ?? null,
        db_name ?? null,
        db_username ?? null,
        db_password ? db_password : null, // not empty -> update the password
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    return NextResponse.json({ database: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error("Error updating database:", error);
    return NextResponse.json({ error: "Failed to update database connection" }, { status: 500 });
  }
}
