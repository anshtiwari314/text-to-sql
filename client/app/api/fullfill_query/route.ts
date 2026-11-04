import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';
import { callFlask } from '@/lib/flask';
import { authOptions } from '../auth/[...nextauth]/route';

/**
 * STEP 2: the user asked a question in the chat.
 *
 * One route does everything:
 *   credentials -> Flask /api/fullfill_query (LLM + SQL + data) -> save history -> reply
 *
 * Body: { prompt, databaseId, history, schema? }
 *   schema  = optional browser cache; Flask always re-fetches schema from the user's DB
 *   history = last few chat messages, so the LLM remembers the conversation
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, databaseId, history = [] } = await req.json();

    if (!prompt?.trim() || !databaseId) {
      return NextResponse.json({ error: "prompt and databaseId are required" }, { status: 400 });
    }

    // 1. Get the credentials of the selected database
    const dbResult = await query(
      `SELECT engine, host, port, db_name, db_username, db_password
       FROM saved_databases WHERE id = $1 AND user_id = $2`,
      [databaseId, session.user.id]
    );

    if (dbResult.rows.length === 0) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    // 2. Flask generates the SQL, runs it, and returns SQL + data (or a question)
    const { ok, status, data } = await callFlask('/fullfill_query', {
      prompt,
      databaseId,
      history,
      credentials: dbResult.rows[0],
    });
    if (!ok) {
      const errorMessage = data.error || "Flask failed";
      // The LLM provider is misconfigured (bad/missing API key)
      const llmProviderFailed = status === 500 && !errorMessage.includes("connect");
      return NextResponse.json({ error: errorMessage }, { status: llmProviderFailed ? 502 : status });
    }

    // 3. Save the prompt + generated SQL to chat history (skip clarifications)
    if (data.sql) {
      const saved = await query(
        `INSERT INTO chat_histories (user_id, database_id, prompt, generated_sql)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [session.user.id, databaseId, prompt, data.sql]
      );
      data.chatId = saved.rows[0].id;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in /api/fullfill_query:", error);
    return NextResponse.json({ error: "Failed to process the question" }, { status: 500 });
  }
}
