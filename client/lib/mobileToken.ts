import crypto from "crypto";

/** Short HMAC token for the phone app. The website keeps using the NextAuth cookie. */

function secret() {
  const value = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET is not set");
  return value;
}

type MobileUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export function signMobileToken(user: MobileUser) {
  const body = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email ?? null,
      name: user.name ?? null,
      picture: user.image ?? null,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  console.log("[mobile-auth] signed token for", user.email);
  return `${body}.${sig}`;
}

export function readMobileToken(token: string): MobileUser | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (!payload?.sub || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
  return {
    id: String(payload.sub),
    email: payload.email,
    name: payload.name,
    image: payload.picture,
  };
}
