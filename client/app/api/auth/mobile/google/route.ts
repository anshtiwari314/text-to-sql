import { NextResponse } from "next/server";
import { googleOAuthCreds } from "@/lib/oauthEnv";
import { signMobileToken } from "@/lib/mobileToken";
import { upsertOAuthUser } from "@/lib/upsertOAuthUser";

/**
 * Phone app sends the Google idToken from the native sign-in sheet.
 * We check it with Google, then return our own session token.
 */
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    const google = googleOAuthCreds();
    if (!google) {
      return NextResponse.json({ error: "Google sign-in is not configured on the server" }, { status: 500 });
    }

    const infoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    const info = await infoRes.json();
    if (!infoRes.ok || !info.email) {
      console.log("[mobile-auth] google idToken rejected");
      return NextResponse.json({ error: "Google token was rejected" }, { status: 401 });
    }
    if (info.aud !== google.clientId) {
      console.log("[mobile-auth] google token audience mismatch");
      return NextResponse.json({ error: "Google token was not issued for this app" }, { status: 401 });
    }
    if (info.email_verified === "false" || info.email_verified === false) {
      return NextResponse.json({ error: "Google email is not verified" }, { status: 401 });
    }

    const user = await upsertOAuthUser({
      email: info.email,
      name: info.name || null,
      image: info.picture || null,
    });
    const token = signMobileToken(user);
    console.log("[mobile-auth] google session issued", user.email);
    return NextResponse.json({ token, user });
  } catch (error) {
    console.error("[mobile-auth] google route failed", error);
    return NextResponse.json({ error: "Could not sign in with Google" }, { status: 500 });
  }
}
