import { NextResponse } from "next/server";
import { githubOAuthCreds } from "@/lib/oauthEnv";
import { signMobileToken } from "@/lib/mobileToken";
import { upsertOAuthUser } from "@/lib/upsertOAuthUser";

/**
 * Token endpoint for react-native-app-auth.
 * The phone sends GitHub's authorization code. The client secret stays on this server.
 * The access_token we return is our session JWT, not GitHub's token.
 */
export async function POST(req: Request) {
  try {
    const github = githubOAuthCreds();
    if (!github) {
      return NextResponse.json({ error: "GitHub sign-in is not configured on the server" }, { status: 500 });
    }

    const params = new URLSearchParams(await req.text());
    const code = params.get("code");
    const redirectUri = params.get("redirect_uri");
    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }
    console.log("[mobile-auth] github code exchange");

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: github.clientId,
        client_secret: github.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      console.log("[mobile-auth] github token exchange failed", tokenJson.error || tokenRes.status);
      return NextResponse.json({ error: "GitHub did not accept the login" }, { status: 401 });
    }

    const ghHeaders = {
      Authorization: `Bearer ${tokenJson.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "sql-ai",
    };
    const profileRes = await fetch("https://api.github.com/user", { headers: ghHeaders });
    const profile = await profileRes.json();
    if (!profileRes.ok) {
      console.log("[mobile-auth] github profile failed", profileRes.status);
      return NextResponse.json({ error: "Could not read the GitHub profile" }, { status: 401 });
    }

    let email = typeof profile.email === "string" ? profile.email : "";
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", { headers: ghHeaders });
      const emails = await emailsRes.json();
      const list = Array.isArray(emails) ? emails : [];
      const picked = list.find((row) => row.primary && row.verified) || list.find((row) => row.verified);
      email = picked?.email || "";
    }
    if (!email) {
      return NextResponse.json({ error: "GitHub did not share an email address" }, { status: 400 });
    }

    const user = await upsertOAuthUser({
      email,
      name: profile.name || profile.login || null,
      image: profile.avatar_url || null,
    });
    const token = signMobileToken(user);
    console.log("[mobile-auth] github session issued", user.email);
    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      expires_in: 30 * 24 * 60 * 60,
    });
  } catch (error) {
    console.error("[mobile-auth] github token route failed", error);
    return NextResponse.json({ error: "Could not sign in with GitHub" }, { status: 500 });
  }
}
