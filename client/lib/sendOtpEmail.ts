import { createMailer, mailFrom } from "@/lib/smtp";

export async function sendOtpEmail(to: string, code: string) {
  const mailer = createMailer();
  if (!mailer) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in client/.env");
  }
  console.log("[sendOtpEmail] to=", to);
  await mailer.sendMail({
    from: mailFrom(),
    to,
    subject: "Your QueryAI sign-in code",
    text: `Your one-time code is: ${code}\n\nIt expires in 10 minutes. If you did not request this, ignore this email.`,
    html: `<p>Your one-time code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>Expires in 10 minutes.</p>`,
  });
}
