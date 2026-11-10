import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { authorize } from "react-native-app-auth";
import { API_URL } from "../api";

const GITHUB_REDIRECT = "sqlai://oauth/github";

let googleReady = false;

function configureGoogle() {
  if (googleReady) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  GoogleSignin.configure({ webClientId });
  googleReady = true;
  console.log("[mobile] google sign-in configured", Boolean(webClientId));
}

/** Native Google sheet → idToken → Next.js session token. */
export async function signInWithGoogle() {
  configureGoogle();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (response.type !== "success") throw new Error("cancelled");
  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error("Google did not return an idToken. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to the Web client id.");
  }
  console.log("[mobile] posting google idToken");
  const res = await fetch(`${API_URL}/api/auth/mobile/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    throw new Error(data.error || "Google sign-in failed");
  }
  return data.token as string;
}

/** GitHub via react-native-app-auth. Next.js exchanges the code and returns our JWT. */
export async function signInWithGitHub() {
  const clientId = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
  if (!clientId) throw new Error("Set EXPO_PUBLIC_GITHUB_CLIENT_ID in mobileApp/.env");
  console.log("[mobile] github app-auth start");
  const result = await authorize({
    clientId,
    redirectUrl: GITHUB_REDIRECT,
    scopes: ["read:user", "user:email"],
    additionalHeaders: { Accept: "application/json" },
    serviceConfiguration: {
      authorizationEndpoint: "https://github.com/login/oauth/authorize",
      tokenEndpoint: `${API_URL}/api/auth/mobile/github/token`,
    },
  });
  if (!result.accessToken) throw new Error("GitHub sign-in did not return a session");
  return result.accessToken;
}
