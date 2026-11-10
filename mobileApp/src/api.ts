import { AuthUser } from "./types";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");

let token: string | null = null;

export function setAuthToken(next: string | null) {
  token = next;
  console.log("[mobile-api] token", next ? "set" : "cleared");
}

export async function api<T = Record<string, unknown>>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (opts.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  console.log("[mobile-api]", opts.method || "GET", path);
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function loginRequest(email: string, password: string) {
  return api<{ token: string; user: AuthUser }>("/api/auth/mobile/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
