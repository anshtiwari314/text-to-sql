import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { ensureChatTables } from '@/lib/ensureChatTables';
import { authOptions } from '@/lib/authOptions';

/** List saved chat sessions for the signed-in user. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureChatTables();
    const result = await query(
      `SELECT s.id, s.title, s.created_at, s.updated_at, s.database_id,
              d.conn_name AS db_name
       FROM chat_sessions s
       JOIN saved_databases d ON d.id = s.database_id
       WHERE s.user_id = $1
       ORDER BY s.updated_at DESC`,
      [session.user.id]
    );
    return NextResponse.json({ chats: result.rows });
  } catch (error) {
    console.error('GET /api/chats:', error);
    return NextResponse.json({ error: 'Failed to load chats' }, { status: 500 });
  }
}

/** Start an empty chat session (New Chat). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { databaseId, title = 'New chat' } = await req.json();
  if (!databaseId) {
    return NextResponse.json({ error: 'databaseId is required' }, { status: 400 });
  }

  const db = await query(
    `SELECT id FROM saved_databases WHERE id = $1 AND user_id = $2`,
    [databaseId, session.user.id]
  );
  if (db.rows.length === 0) {
    return NextResponse.json({ error: 'Database not found' }, { status: 404 });
  }

  try {
    await ensureChatTables();
    const created = await query(
      `INSERT INTO chat_sessions (user_id, database_id, title)
       VALUES ($1, $2, $3) RETURNING id, title, database_id, created_at`,
      [session.user.id, databaseId, title]
    );
    return NextResponse.json({ chat: created.rows[0] });
  } catch (error) {
    console.error('POST /api/chats:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
