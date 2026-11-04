import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ensureChatTables } from '@/lib/ensureChatTables';
import { query } from '@/lib/db';
import { authOptions } from '@/lib/authOptions';

/** Load one chat session and all messages. */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await ensureChatTables();
    const chat = await query(
      `SELECT s.id, s.title, s.database_id, d.conn_name AS db_name
       FROM chat_sessions s
       JOIN saved_databases d ON d.id = s.database_id
       WHERE s.id = $1 AND s.user_id = $2`,
      [id, session.user.id]
    );
    if (chat.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const messages = await query(
      `SELECT id, role, content, sql, columns, rows, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    return NextResponse.json({
      chat: chat.rows[0],
      messages: messages.rows.map((row, index) => ({
        id: index + 1,
        role: row.role,
        content: row.content,
        sql: row.sql,
        columns: row.columns ?? [],
        rows: row.rows ?? [],
      })),
    });
  } catch (error) {
    console.error('GET /api/chats/[id]:', error);
    return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 });
  }
}
