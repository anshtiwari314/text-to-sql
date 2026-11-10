import crypto from "crypto";
import { query } from "@/lib/db";
import { ensureAuthTables } from "@/lib/ensureAuthTables";

const HOURS = 24;

export async function storeEmailVerification(email: string): Promise<string> {
  await ensureAuthTables();
  const normalized = email.trim().toLowerCase();
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + HOURS * 60 * 60 * 1000);
  await query("DELETE FROM email_verifications WHERE LOWER(email) = $1", [normalized]);
  await query(
    "INSERT INTO email_verifications (token, email, expires_at) VALUES ($1, $2, $3)",
    [token, normalized, expires]
  );
  console.log("[email-verify] token stored for", normalized);
  return token;
}

/** Returns email if token is valid. */
export async function consumeEmailVerification(token: string): Promise<string | null> {
  await ensureAuthTables();
  const rows = await query(
    "SELECT email, expires_at FROM email_verifications WHERE token = $1",
    [token]
  );
  const row = rows.rows[0];
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) return null;
  await query("DELETE FROM email_verifications WHERE token = $1", [token]);
  console.log("[email-verify] consumed for", row.email);
  return row.email as string;
}
