import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { ensureAuthTables } from '@/lib/ensureAuthTables';
import { sendResetEmail } from '@/lib/sendResetEmail';

export async function POST(req: Request) {
  try {
    const raw = (await req.json()).email;
    const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    await ensureAuthTables();
    const user = await query('SELECT id, email FROM users WHERE LOWER(email) = $1', [email]);
    // Same response whether or not the email exists, so we don't leak accounts.
    if (user.rows.length > 0) {
      const dbEmail = user.rows[0].email as string;
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await query('DELETE FROM password_resets WHERE LOWER(email) = LOWER($1)', [dbEmail]);
      await query(
        'INSERT INTO password_resets (token, email, expires_at) VALUES ($1, $2, $3)',
        [token, dbEmail, expires]
      );
      const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const link = `${base}/reset-password?token=${token}`;
      const scheme = (process.env.MOBILE_APP_SCHEME || 'sqlai').replace('://', '');
      const appLink = `${scheme}://reset-password?token=${token}`;
      console.log('[forgot] sending reset link to', dbEmail);
      await sendResetEmail(dbEmail, link, appLink);
    } else {
      console.log('[forgot] no user for email (no mail sent)');
    }
    return NextResponse.json({
      ok: true,
      message: 'If that email is registered, check your inbox for a reset link (also check spam).',
    });
  } catch (error) {
    console.error('forgot:', error);
    const message = error instanceof Error ? error.message : 'Could not send email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
