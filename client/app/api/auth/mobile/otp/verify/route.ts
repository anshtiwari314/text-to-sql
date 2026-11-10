import { NextResponse } from "next/server";
import { verifyEmailOtp } from "@/lib/emailOtpStore";
import { ensureUserAfterOtp } from "@/lib/ensureUserAfterOtp";
import { signMobileToken } from "@/lib/mobileToken";
import { notifyAdminLogin } from "@/lib/notifyLogin";

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

    const row = await ensureUserAfterOtp(verifiedEmail, body.name);
    const user = { id: row.id, name: row.name, email: row.email, image: row.image };
    const token = signMobileToken(user);
    console.log("[mobile-auth] otp session", user.email);
    await notifyAdminLogin(
      { email: user.email, name: user.name },
      "mobile-otp",
      { localTime: body.localTime, timezone: body.timezone, location: body.location }
    );
    return NextResponse.json({ token, user });
  } catch (error) {
    console.error("[mobile-auth] otp verify failed", error);
    return NextResponse.json({ error: "Could not verify code" }, { status: 500 });
  }
}
