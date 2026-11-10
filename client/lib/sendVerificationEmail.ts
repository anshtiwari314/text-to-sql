import { createMailer, mailFrom } from "@/lib/smtp";

export async function sendVerificationEmail(to: string, link: string) {
  const mailer = createMailer();
  if (!mailer) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in client/.env");
  }
  console.log("[sendVerificationEmail] to=", to);
  await mailer.sendMail({
    from: mailFrom(),
    to,
    subject: "Verify your QueryAI email",
    text: `Welcome to QueryAI.\n\nConfirm your email (valid 24 hours):\n\n${link}\n`,
    html: `<p>Welcome to QueryAI.</p><p><a href="${link}">Click here to verify your email</a> (link valid 24 hours).</p>`,
  });
}
