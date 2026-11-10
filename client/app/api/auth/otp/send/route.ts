import { NextResponse } from "next/server";
import { generateOtpCode, storeEmailOtp } from "@/lib/emailOtpStore";
import { sendOtpEmail } from "@/lib/sendOtpEmail";

export async function POST(req: Request) {
  try {
    const raw = (await req.json()).email;
    const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const code = generateOtpCode();
    await storeEmailOtp(email, code);
    console.log("[auth] otp send", email);
    await sendOtpEmail(email, code);

    return NextResponse.json({
      ok: true,
      message: "If that email can receive mail, you will get a 6-digit code shortly.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send code";
    console.error("[auth] otp send error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
