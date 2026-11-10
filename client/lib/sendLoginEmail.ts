import { adminEmailId } from "@/lib/admin";
import { createMailer, mailFrom } from "@/lib/smtp";

type LoginMail = {
  userEmail?: string | null;
  userName?: string | null;
  method?: string | null;
  location?: string | null;
  localTime?: string | null;
  timezone?: string | null;
};

export async function sendLoginEmail(info: LoginMail) {
  const to = adminEmailId();
  if (!to) {
    console.log("[login-mail] skip, ADMIN_EMAIL_ID empty");
    return;
  }

  const mailer = createMailer();
  if (!mailer) {
    console.log("[login-mail] skip, SMTP not set");
    return;
  }

  const when = info.localTime?.trim() || "null";
  const timezone = info.timezone?.trim() || "null";
  const location = info.location?.trim() || "null";
  const who = info.userEmail || "unknown";
  const method = info.method || "unknown";

  console.log("[login-mail] new user", who, method, when, timezone, location);
  await mailer.sendMail({
    from: mailFrom(),
    to,
    subject: "New login",
    text: `New login\nTime: ${when}\nTimezone: ${timezone}\nUser: ${who}\nName: ${info.userName || "—"}\nMethod: ${method}\nLocation: ${location}\n`,
    html: `<p><b>New login</b></p>
<p>Time: ${when}</p>
<p>Timezone: ${timezone}</p>
<p>User: ${who}</p>
<p>Name: ${info.userName || "—"}</p>
<p>Method: ${method}</p>
<p>Location: ${location}</p>`,
  });
}
