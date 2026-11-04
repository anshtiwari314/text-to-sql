import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { ensureAuthTables } from '@/lib/ensureAuthTables';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password || String(password).length < 8) {
      return NextResponse.json({ error: 'Email and a password of at least 8 characters are required' }, { status: 400 });
    }

    await ensureAuthTables();
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
      [name || email, email, hash]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('signup:', error);
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
  }
}
