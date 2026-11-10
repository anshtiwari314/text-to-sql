"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import TextToSqlApp from "@/components/TextToSqlApp";

/** Session gate for /app — client-only so production build does not prerender auth. */
export default function AppGate() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading…
      </div>
    );
  }

  if (!session?.user) return null;

  return <TextToSqlApp user={session.user} />;
}
