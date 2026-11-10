/** Only send the OAuth token back to this app (sqlai://, Expo Go, or local web). */

export function mobileAuthReturnUrl(raw: string | null): string {
  const scheme = (process.env.MOBILE_APP_SCHEME || "sqlai").replace("://", "");
  const fallback = `${scheme}://auth`;
  if (!raw) return fallback;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    console.log("[mobile-auth] return url is not a URL");
    return fallback;
  }

  const last = url.pathname.split("/").filter(Boolean).pop() || url.hostname;
  if (last !== "auth") {
    console.log("[mobile-auth] return path rejected", url.pathname, url.hostname);
    return fallback;
  }

  const proto = url.protocol.replace(":", "");
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const ok =
    proto === scheme ||
    proto === "exp" ||
    proto === "exps" ||
    ((proto === "http" || proto === "https") && local);
  if (!ok) {
    console.log("[mobile-auth] return scheme rejected", proto);
    return fallback;
  }

  url.search = "";
  url.hash = "";
  console.log("[mobile-auth] return url allowed", url.protocol);
  return url.toString();
}
