import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
          <p className="text-slate-400">Verifying…</p>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
