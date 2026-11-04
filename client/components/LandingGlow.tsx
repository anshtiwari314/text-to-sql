"use client";

import { useEffect } from "react";

/** Soft indigo / cyan / blue blobs from the public landing page. */
export default function LandingGlow() {
  useEffect(() => {
    console.log("[theme] landing glow: indigo-600, cyan-600, blue-600 on slate-950");
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-[10%] -top-[10%] h-96 w-96 rounded-full bg-indigo-600/20 blur-[100px]" />
      <div className="absolute -right-[10%] top-[20%] h-96 w-96 rounded-full bg-cyan-600/20 blur-[100px]" />
      <div className="absolute -bottom-[20%] left-[20%] h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" />
    </div>
  );
}
