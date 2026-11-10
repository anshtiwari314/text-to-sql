import { query } from "@/lib/db";
import { ensureAuthTables } from "@/lib/ensureAuthTables";
import { sendLoginEmail } from "@/lib/sendLoginEmail";

export type LoginStamp = {
  email?: string | null;
  name?: string | null;
  method?: string | null;
  location?: string | null;
  localTime?: string | null;
  timezone?: string | null;
};

export async function recordLogin(stamp: LoginStamp) {
  const email = (stamp.email || "").trim();
  if (!email) {
    console.log("[login-log] skip, no email");
    return;
  }

  await ensureAuthTables();
  const found = await query(
    "SELECT id, name, email, welcome_mailed FROM users WHERE LOWER(email) = LOWER($1)",
    [email]
  );
  const user = found.rows[0];
  if (!user) {
    console.log("[login-log] skip, no user", email);
    return;
  }

  const location = stamp.location?.trim() || null;
  const localTime = stamp.localTime?.trim() || null;
  const timezone = stamp.timezone?.trim() || null;
  const method = stamp.method || "unknown";
  const isNew = user.welcome_mailed !== true;

  await query(
    `INSERT INTO user_logins (user_id, email, method, location, local_time, timezone)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.id, user.email, method, location, localTime, timezone]
  );
  await query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1", [user.id]);
  console.log("[login-log] saved", email, method, localTime, timezone, location, "new=", isNew);

  if (!isNew) return;

  await sendLoginEmail({
    userEmail: user.email,
    userName: stamp.name || user.name,
    method,
    location,
    localTime,
    timezone,
  });
  await query("UPDATE users SET welcome_mailed = true WHERE id = $1", [user.id]);
}
