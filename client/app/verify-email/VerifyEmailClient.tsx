"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailClient() {
  const params = useSearchParams();
  const token = params.get("token");
  const [message, setMessage] = useState("Verifying…");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage("Missing verification token.");
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Verification failed");
        setOk(true);
        setMessage(data.message || "Email verified.");
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Verification failed"));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Email verification</h1>
        <p className={ok ? "text-emerald-400" : "text-slate-300"}>{message}</p>
        <Link href={ok ? "/auth?verified=1" : "/auth"} className="inline-block text-indigo-400 font-semibold">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
