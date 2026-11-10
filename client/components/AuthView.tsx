"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Zap, Mail, ArrowRight } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GoogleIcon, GitHubIcon } from "@/components/OAuthBrandIcons";
import LandingGlow from "@/components/LandingGlow";
import { requestLoginLocation, stampLoginClient } from "@/lib/requestLoginLocation";

type Mode = "login" | "signup" | "forgot";

const inputClass =
  "w-full border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500";

const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block";

type ProviderInfo = {
  id: string;
  callbackUrl?: string;
};

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Could not start OAuth. Check GOOGLE_* / GITHUB_* in client/.env.",
  OAuthCallback:
    "OAuth was rejected or the callback URL is not registered with Google/GitHub. Add the exact callback URLs below to your OAuth app settings.",
  OAuthCreateAccount: "Could not create your account after sign-in.",
  AccessDenied:
    "Sign-in was blocked (no email from the provider, or the app database rejected the login). Check Docker logs for [auth] OAuth signIn DB error.",
  Callback: "Sign-in failed during callback. Verify OAuth callback URLs match NEXTAUTH_URL.",
  Configuration: "Auth is misconfigured. Set NEXTAUTH_URL and NEXTAUTH_SECRET in client/.env.",
  google: "Google sign-in failed. Register the Google callback URL in Google Cloud Console.",
  github: "GitHub sign-in failed. Check that the OAuth App callback URL matches NEXTAUTH_URL in client/.env.",
};

export default function AuthView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState<Record<string, ProviderInfo>>({});

  const oauthError = searchParams.get("error");
  const oauthHint = useMemo(() => {
    if (!oauthError) return null;
    return OAUTH_ERROR_MESSAGES[oauthError] || "Sign-in failed. Try again or use email.";
  }, [oauthError]);

  useEffect(() => {
    requestLoginLocation();
  }, []);

  useEffect(() => {
    if (status === "authenticated") router.replace("/app");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data) => setProviders(data))
      .catch(() => setProviders({}));
  }, []);

  const googleCallback = providers.google?.callbackUrl;
  const githubCallback = providers.github?.callbackUrl;
  const showGoogle = Boolean(providers.google);
  const showGitHub = Boolean(providers.github);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not send email");
        setInfo(data.message || "Check your inbox for a reset link.");
        return;
      }

      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not sign up");
      }

      stampLoginClient();
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/app",
        redirect: false,
      });
      if (result?.error) throw new Error("Email or password is incorrect");
      window.location.href = result?.url || "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-50">
      <LandingGlow />
      <div className="relative z-10 hidden w-1/2 flex-col justify-between p-12 lg:flex">
        <div className="mb-10 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white">
            <Zap size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Query<span className="text-indigo-400">AI</span>
          </span>
        </div>
        <div className="mb-20">
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
              Chat with your database in
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              plain English.
            </span>
          </h1>
          <p className="max-w-md text-lg text-slate-400">
            Connect PostgreSQL or MySQL and generate SQL in seconds.
          </p>
        </div>
        <div className="text-sm text-slate-500">© 2026 QueryAI</div>
      </div>

      <div className="relative z-10 flex w-full items-center justify-center overflow-y-auto p-8 lg:w-1/2">
        <div className="w-full max-w-md rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-px shadow-2xl shadow-indigo-900/20">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/80 p-8 backdrop-blur-lg">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white">
                <Zap size={18} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Query<span className="text-indigo-400">AI</span>
              </span>
            </div>
            <h2 className="mb-2 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-3xl font-extrabold text-transparent">
              {mode === "login" && "Welcome back"}
              {mode === "signup" && "Create an account"}
              {mode === "forgot" && "Reset password"}
            </h2>
            <p className="text-slate-400">
              {mode === "forgot" ? "We will email you a one-time link." : "Use Google, GitHub, or email."}
            </p>
          </div>

          {oauthHint && (
            <div className="mb-6 space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              <p>{oauthHint}</p>
              {(googleCallback || githubCallback) && (
                <ul className="space-y-1 break-all font-mono text-xs text-amber-100">
                  {googleCallback && <li>Google: {googleCallback}</li>}
                  {githubCallback && <li>GitHub: {githubCallback}</li>}
                </ul>
              )}
            </div>
          )}

          {mode !== "forgot" && (showGoogle || showGitHub) && (
            <div className="space-y-3 mb-8">
              {showGoogle && (
                <button
                  type="button"
                  onClick={() => {
                    stampLoginClient();
                    void signIn("google", { callbackUrl: "/app" });
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-bold text-slate-100 hover:border-slate-600 hover:bg-slate-800"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              )}
              {showGitHub && (
                <button
                  type="button"
                  onClick={() => {
                    stampLoginClient();
                    void signIn("github", { callbackUrl: "/app" });
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-[#24292F] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#1b1f23]"
                >
                  <GitHubIcon className="h-5 w-5 text-white" />
                  Continue with GitHub
                </button>
              )}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className={labelClass} htmlFor="auth-name">
                  Full name
                </label>
                <input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label className={labelClass} htmlFor="auth-email">
                Email address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-3.5 text-slate-500 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>
            {mode !== "forgot" && (
              <div>
                <label className={labelClass} htmlFor="auth-password">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={inputClass}
                />
              </div>
            )}
            {mode === "login" && (
              <div className="flex justify-end">
                <button type="button" onClick={() => setMode("forgot")} className="text-sm font-semibold text-indigo-300 hover:text-cyan-300">
                  Forgot password?
                </button>
              </div>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            {info && <p className="text-sm text-emerald-400">{info}</p>}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 disabled:opacity-60"
            >
              {busy ? "Working..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send reset link"}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-400">
            {mode === "login" && (
              <button type="button" onClick={() => setMode("signup")} className="font-bold text-indigo-300 hover:text-cyan-300">
                Don&apos;t have an account? Sign up
              </button>
            )}
            {mode !== "login" && (
              <button type="button" onClick={() => setMode("login")} className="font-bold text-indigo-300 hover:text-cyan-300">
                Back to sign in
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
