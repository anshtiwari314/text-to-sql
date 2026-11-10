import * as Linking from "expo-linking";

/** Pull the bearer token out of sqlai://auth?token= (not the reset link). */
export function tokenFromAuthUrl(url: string): string | null {
  const parsed = Linking.parse(url);
  const host = parsed.hostname || "";
  const path = parsed.path || "";
  const isReset = host.includes("reset") || path.includes("reset");
  const isAuth = host === "auth" || path === "auth" || path.endsWith("/auth");
  if (!isAuth || isReset) return null;
  const token = parsed.queryParams?.token;
  console.log("[mobile] auth url", isAuth, Boolean(token));
  return typeof token === "string" ? token : null;
}
