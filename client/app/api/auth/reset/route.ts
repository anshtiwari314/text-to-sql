import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { ensureAuthTables } from '@/lib/ensureAuthTables';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || !password || String(password).length < 8) {
      return NextResponse.json({ error: 'A valid link and a password of at least 8 characters are required' }, { status: 400 });
    }

    await ensureAuthTables();
    const row = await query(
      'SELECT email, expires_at FROM password_resets WHERE token = $1',
      [token]
    );
    if (row.rows.length === 0 || new Date(row.rows[0].expires_at) < new Date()) {
      return NextResponse.json({ error: 'This reset link is invalid or expired' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const email = row.rows[0].email;
    console.log('[reset] updating password for', email);
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
    await query('DELETE FROM password_resets WHERE token = $1', [token]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('reset:', error);
    return NextResponse.json({ error: 'Could not reset password' }, { status: 500 });
  }
}
