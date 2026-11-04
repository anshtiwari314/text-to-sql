"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import LandingGlow from "@/components/LandingGlow";

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not reset password");
      return;
    }
    setMessage("Password updated. You can sign in now.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-6 text-slate-100">
      <LandingGlow />
      <form onSubmit={submit} className="relative z-10 w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl shadow-indigo-900/20 backdrop-blur-lg">
        <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-2xl font-bold text-transparent">
          Set a new password
        </h1>
        {!token && <p className="text-red-400 text-sm">This link is missing a token.</p>}
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {message && <p className="text-emerald-400 text-sm">{message}</p>}
        <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500">
          Update password
        </button>
        <Link href="/auth" className="block text-center text-sm text-indigo-400">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
