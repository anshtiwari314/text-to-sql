"use client";

import { Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { requestLoginLocation, stampLoginClient } from "@/lib/requestLoginLocation";

function MobileOAuthStart() {
  const params = useSearchParams();
  const provider = params.get("provider") === "github" ? "github" : "google";
  const ret = params.get("return") || "";

  useEffect(() => {
    requestLoginLocation();
    stampLoginClient();
    const callbackUrl = `${window.location.origin}/api/auth/mobile/handoff?return=${encodeURIComponent(ret)}`;
    console.log("[mobile-oauth] start", provider, callbackUrl);
    void signIn(provider, { callbackUrl });
  }, [provider, ret]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <p>Opening {provider} sign-in…</p>
    </main>
  );
}

export default function MobileOAuthPage() {
  return (
    <Suspense fallback={null}>
      <MobileOAuthStart />
    </Suspense>
  );
}
