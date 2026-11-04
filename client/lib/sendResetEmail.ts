import nodemailer from 'nodemailer';

export async function sendResetEmail(to: string, link: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in client/.env');
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });

  // Gmail SMTP: From should match SMTP_USER unless that address is a verified alias.
  const from = process.env.SMTP_FROM?.includes('@') ? process.env.SMTP_FROM : `"SQL AI" <${user}>`;

  console.log('[sendResetEmail] to=', to);
  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your SQL AI password',
    text: `Open this link to set a new password (valid for 1 hour):\n\n${link}\n`,
    html: `<p>Open this link to set a new password (valid for 1 hour):</p><p><a href="${link}">${link}</a></p>`,
  });
}
