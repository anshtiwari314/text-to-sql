import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureAuthTables } from "@/lib/ensureAuthTables";
import { storeEmailVerification } from "@/lib/emailVerificationStore";
import { sendVerificationEmail } from "@/lib/sendVerificationEmail";
import { authBaseUrl } from "@/lib/oauthEnv";

export async function POST(req: Request) {
  try {
    const email = String((await req.json()).email || "")
      .trim()
      .toLowerCase();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    await ensureAuthTables();
    const user = await query(
      "SELECT email, email_verified FROM users WHERE LOWER(email) = $1",
      [email]
    );
    if (user.rows[0] && !user.rows[0].email_verified) {
      const token = await storeEmailVerification(user.rows[0].email as string);
      const link = `${authBaseUrl()}/verify-email?token=${token}`;
      console.log("[auth] resend verification", email);
      await sendVerificationEmail(user.rows[0].email as string, link);
    }
    return NextResponse.json({
      ok: true,
      message: "If that account is unverified, a new verification link was sent.",
    });
  } catch (error) {
    console.error("[auth] resend verification error:", error);
    return NextResponse.json({ error: "Could not send email" }, { status: 500 });
  }
}
