import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-400">Loading…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
