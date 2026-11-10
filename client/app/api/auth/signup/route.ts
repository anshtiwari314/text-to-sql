import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { ensureAuthTables } from '@/lib/ensureAuthTables';
import { storeEmailVerification } from '@/lib/emailVerificationStore';
import { sendVerificationEmail } from '@/lib/sendVerificationEmail';
import { authBaseUrl } from '@/lib/oauthEnv';

export async function POST(req: Request) {
  try {
    const { name, email: rawEmail, password } = await req.json();
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    if (!email || !password || String(password).length < 8) {
      return NextResponse.json({ error: 'Email and a password of at least 8 characters are required' }, { status: 400 });
    }

    await ensureAuthTables();
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO users (name, email, password_hash, email_verified, welcome_mailed) VALUES ($1, $2, $3, false, false)',
      [name || email, email, hash]
    );

    const token = await storeEmailVerification(email);
    const link = `${authBaseUrl()}/verify-email?token=${token}`;
    console.log('[auth] signup verification mail', email);
    await sendVerificationEmail(email, link);

    return NextResponse.json({
      ok: true,
      needsVerification: true,
      message: 'Account created. Check your inbox for a verification link, then sign in.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[auth] signup error:', msg);
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
  }
}
