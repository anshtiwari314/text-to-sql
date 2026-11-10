import crypto from "crypto";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { ensureAuthTables } from "@/lib/ensureAuthTables";

const OTP_MINUTES = 10;

export function generateOtpCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}

/** Store a new OTP for this email (replaces any older OTP). */
export async function storeEmailOtp(email: string, code: string) {
  await ensureAuthTables();
  const normalized = email.trim().toLowerCase();
  const codeHash = await bcrypt.hash(code, 10);
  const expires = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
  await query("DELETE FROM email_otps WHERE LOWER(email) = $1", [normalized]);
  await query(
    "INSERT INTO email_otps (email, code_hash, expires_at) VALUES ($1, $2, $3)",
    [normalized, codeHash, expires]
  );
  console.log("[email-otp] stored for", normalized);
}

/** Returns the canonical email on success. */
export async function verifyEmailOtp(email: string, code: string): Promise<string | null> {
  await ensureAuthTables();
  const normalized = email.trim().toLowerCase();
  const rows = await query(
    "SELECT email, code_hash, expires_at FROM email_otps WHERE LOWER(email) = $1 ORDER BY created_at DESC LIMIT 1",
    [normalized]
  );
  const row = rows.rows[0];
  if (!row) {
    console.log("[email-otp] no row for", normalized);
    return null;
  }
  if (new Date(row.expires_at) < new Date()) {
    console.log("[email-otp] expired for", normalized);
    return null;
  }
  const ok = await bcrypt.compare(code, row.code_hash);
  if (!ok) {
    console.log("[email-otp] wrong code for", normalized);
    return null;
  }
  await query("DELETE FROM email_otps WHERE LOWER(email) = $1", [normalized]);
  console.log("[email-otp] verified", normalized);
  return row.email as string;
}
