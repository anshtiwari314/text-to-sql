import { NextResponse } from "next/server";
import { verifyEmailOtp } from "@/lib/emailOtpStore";
import { ensureUserAfterOtp } from "@/lib/ensureUserAfterOtp";

/** Validates OTP and returns user id for NextAuth email-otp provider (web uses signIn). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim();
    const code = String(body.code || "").trim();
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const verifiedEmail = await verifyEmailOtp(email, code);
    if (!verifiedEmail) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    const user = await ensureUserAfterOtp(verifiedEmail, body.name);
    return NextResponse.json({ ok: true, userId: user.id, email: user.email });
  } catch (error) {
    console.error("[auth] otp verify error:", error);
    return NextResponse.json({ error: "Could not verify code" }, { status: 500 });
  }
}
