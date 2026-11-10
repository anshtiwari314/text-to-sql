import { createMailer, mailFrom } from "@/lib/smtp";

export async function sendResetEmail(to: string, link: string, appLink?: string) {
  const mailer = createMailer();
  if (!mailer) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in client/.env");
  }

  console.log("[sendResetEmail] to=", to);
  await mailer.sendMail({
    from: mailFrom(),
    to,
    subject: "Reset your QueryAI password",
    text: `Open this link to set a new password (valid for 1 hour):\n\n${link}\n${appLink ? `\nOn the phone app:\n${appLink}\n` : ""}`,
    html: `<p>Open this link to set a new password (valid for 1 hour):</p><p><a href="${link}">${link}</a></p>${appLink ? `<p>Phone app: <a href="${appLink}">${appLink}</a></p>` : ""}`,
  });
}
