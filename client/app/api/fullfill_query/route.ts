import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { ensureChatTables } from '@/lib/ensureChatTables';
import { callFlask } from '@/lib/flask';
import { authOptions } from '@/lib/authOptions';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prompt, databaseId, history = [], chatSessionId = null } = await req.json();

    if (!prompt?.trim() || !databaseId) {
      return NextResponse.json({ error: 'prompt and databaseId are required' }, { status: 400 });
    }

    const dbResult = await query(
      `SELECT engine, host, port, db_name, db_username, db_password
       FROM saved_databases WHERE id = $1 AND user_id = $2`,
      [databaseId, session.user.id]
    );

    if (dbResult.rows.length === 0) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    }

    await ensureChatTables();

    const { ok, status, data } = await callFlask('/fullfill_query', {
      prompt,
      databaseId,
      history,
      credentials: dbResult.rows[0],
    });
    if (!ok) {
      const errorMessage = data.error || 'Flask failed';
      const llmProviderFailed = status === 500 && !errorMessage.includes('connect');
      return NextResponse.json({ error: errorMessage }, { status: llmProviderFailed ? 502 : status });
    }

    let sessionId = chatSessionId as string | null;
    if (!sessionId) {
      const title = prompt.trim().slice(0, 80) || 'Chat';
      const created = await query(
        `INSERT INTO chat_sessions (user_id, database_id, title)
         VALUES ($1, $2, $3) RETURNING id`,
        [session.user.id, databaseId, title]
      );
      sessionId = created.rows[0].id;
    } else {
      await query(
        `UPDATE chat_sessions SET updated_at = now() WHERE id = $1 AND user_id = $2`,
        [sessionId, session.user.id]
      );
    }

    await query(
      `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
      [sessionId, prompt.trim()]
    );

    const aiContent = data.message || data.error || 'Done';
    await query(
      `INSERT INTO chat_messages (session_id, role, content, sql, columns, rows)
       VALUES ($1, 'ai', $2, $3, $4, $5)`,
      [
        sessionId,
        aiContent,
        data.sql ?? null,
        JSON.stringify(data.columns ?? []),
        JSON.stringify(data.rows ?? []),
      ]
    );

    data.chatSessionId = sessionId;
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in /api/fullfill_query:', error);
    return NextResponse.json({ error: 'Failed to process the question' }, { status: 500 });
  }
}
