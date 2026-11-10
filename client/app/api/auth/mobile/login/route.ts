import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { ensureAuthTables } from "@/lib/ensureAuthTables";
import { signMobileToken } from "@/lib/mobileToken";

/** Email login for the phone app. Returns a bearer token (no browser cookie). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    console.log("[mobile-auth] login attempt", email);
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await ensureAuthTables();
    const found = await query(
      "SELECT id, name, email, image, password_hash FROM users WHERE email = $1",
      [email]
    );
    const row = found.rows[0];
    if (!row?.password_hash) {
      return NextResponse.json({ error: "Email or password is incorrect" }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Email or password is incorrect" }, { status: 401 });
    }

    const user = { id: row.id, name: row.name, email: row.email, image: row.image };
    const token = signMobileToken(user);
    return NextResponse.json({ token, user });
  } catch (error) {
    console.error("[mobile-auth] login failed", error);
    return NextResponse.json({ error: "Could not sign in" }, { status: 500 });
  }
}
