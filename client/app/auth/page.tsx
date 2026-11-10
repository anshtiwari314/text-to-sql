import { Suspense } from "react";
import AuthView from "@/components/AuthView";
import { DATABASE_LIST_AND, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${SITE_NAME}, the text-to-SQL AI for ${DATABASE_LIST_AND}.`,
  alternates: { canonical: "/auth" },
};

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthView />
    </Suspense>
  );
}
