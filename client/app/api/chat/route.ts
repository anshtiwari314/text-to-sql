import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, databaseId } = await req.json();

    // 1. Fetch the decrypted database credentials from Postgres
    const dbResult = await query(
      'SELECT engine, host, port, db_username, db_password, db_name FROM saved_databases WHERE id = $1 AND user_id = $2', 
      [databaseId, session.user.id]
    );

    if (dbResult.rows.length === 0) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    const targetDb = dbResult.rows[0];

    // 2. Call your Python Flask backend to generate the SQL
    const flaskResponse = await fetch('http://localhost:8000/api/generate-sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        credentials: targetDb // Flask uses this to connect and fetch the schema
      })
    });
    
    if (!flaskResponse.ok) {
       throw new Error("Flask backend failed to generate SQL");
    }

    const data = await flaskResponse.json();

    // 3. Save the prompt and generated SQL to chat_histories
    const historyResult = await query(
      'INSERT INTO chat_histories (user_id, database_id, prompt, generated_sql) VALUES ($1, $2, $3, $4) RETURNING id',
      [session.user.id, databaseId, prompt, data.sql_string]
    );

    // 4. Return the generated SQL back to the frontend ChatView
    return NextResponse.json({
       chatId: historyResult.rows[0].id,
       sql_string: data.sql_string
    }, { status: 200 });

  } catch (error) {
    console.error("Error generating SQL or saving history:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}


// import { NextResponse } from 'next/server';
// import { query } from '@/lib/db';
// import { getServerSession } from 'next-auth';

// export async function POST(req: Request) {
//   const session = await getServerSession();
//   const { prompt, databaseId } = await req.json();

//   // 1. Get the AWS database credentials from your App DB
//   const dbResult = await query(
//     'SELECT host, port, db_username, db_password, db_name FROM saved_databases WHERE id = $1 AND user_id = $2', 
//     [databaseId, session?.user?.id]
//   );
  
//   const targetDb = dbResult.rows[0];

//   // 2. Send credentials + prompt to Flask to do the heavy lifting
//   const flaskResponse = await fetch('http://localhost:8000/api/generate-sql', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       prompt: prompt,
//       credentials: targetDb // Flask uses this to connect to AWS
//     })
//   });
//   const data = await flaskResponse.json();

//   // 3. Save the chat history in your App DB
//   await query(
//     'INSERT INTO chat_histories (user_id, database_id, prompt, generated_sql) VALUES ($1, $2, $3, $4)',
//     [session?.user?.id, databaseId, prompt, data.sql_string]
//   );

//   // 4. Return results to the UI
//   return NextResponse.json(data);
// }