/** OAuth env helpers — keeps callback URLs aligned with NEXTAUTH_URL. */

export function authBaseUrl(): string {
  const raw =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function googleOAuthCreds(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function githubOAuthCreds(): { clientId: string; clientSecret: string } | null {
  const clientId = (
    process.env.GITHUB_ID ||
    process.env.GITHUB_CLIENT_ID ||
    ""
  ).trim();
  const clientSecret = (
    process.env.GITHUB_SECRET ||
    process.env.GITHUB_CLIENT_SECRET ||
    ""
  ).trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function oauthCallbackUrls() {
  const base = authBaseUrl();
  return {
    google: `${base}/api/auth/callback/google`,
    github: `${base}/api/auth/callback/github`,
  };
}
