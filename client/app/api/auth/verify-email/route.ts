import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureAuthTables } from "@/lib/ensureAuthTables";
import { consumeEmailVerification } from "@/lib/emailVerificationStore";

/** GET ?token=… — marks user verified (link from email). */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const email = await consumeEmailVerification(token);
    if (!email) {
      return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
    }

    await ensureAuthTables();
    await query("UPDATE users SET email_verified = true WHERE LOWER(email) = LOWER($1)", [email]);
    console.log("[auth] email verified", email);
    return NextResponse.json({ ok: true, message: "Email verified. You can sign in now." });
  } catch (error) {
    console.error("[auth] verify-email error:", error);
    return NextResponse.json({ error: "Could not verify email" }, { status: 500 });
  }
}
