import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";
import { SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password",
  description: `Set a new ${SITE_NAME} password from your email link.`,
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-400">Loading…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
