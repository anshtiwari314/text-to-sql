import { query } from "@/lib/db";
import { ensureAuthTables } from "@/lib/ensureAuthTables";

/** Find or create a user after OTP proof; marks email verified. */
export async function ensureUserAfterOtp(email: string, name?: string) {
  await ensureAuthTables();
  const found = await query(
    "SELECT id, name, email, image FROM users WHERE LOWER(email) = LOWER($1)",
    [email]
  );
  if (found.rows[0]) {
    await query("UPDATE users SET email_verified = true WHERE id = $1", [found.rows[0].id]);
    return found.rows[0];
  }
  const inserted = await query(
    "INSERT INTO users (name, email, email_verified, welcome_mailed) VALUES ($1, $2, true, false) RETURNING id, name, email, image",
    [name || email, email]
  );
  console.log("[auth] OTP created user", email);
  return inserted.rows[0];
}
