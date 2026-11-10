import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { API_URL } from "../api";
import { tokenFromAuthUrl } from "../authLink";

WebBrowser.maybeCompleteAuthSession();

/** Web has no native sign-in sheet, so it uses the Next.js browser handoff. */
async function browserOAuth(provider: "google" | "github") {
  const returnUrl = Linking.createURL("auth");
  const start = `${API_URL}/auth/mobile?provider=${provider}&return=${encodeURIComponent(returnUrl)}`;
  console.log("[mobile] browser oauth", provider);
  const result = await WebBrowser.openAuthSessionAsync(start, returnUrl);
  if (result.type === "cancel" || result.type === "dismiss") {
    throw new Error("cancelled");
  }
  if (result.type !== "success") {
    throw new Error("Sign-in did not finish. Check EXPO_PUBLIC_API_URL.");
  }
  const token = tokenFromAuthUrl(result.url);
  if (!token) throw new Error("Sign-in finished without a token.");
  return token;
}

export function signInWithGoogle() {
  return browserOAuth("google");
}

export function signInWithGitHub() {
  return browserOAuth("github");
}
