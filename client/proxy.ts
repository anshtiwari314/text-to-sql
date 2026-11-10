import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/** Lets the Expo web build call these APIs. Native apps ignore CORS. */
export function proxy(req: NextRequest) {
  if (req.method === "OPTIONS") {
    console.log("[cors] options", req.nextUrl.pathname);
    return new NextResponse(null, { status: 204, headers: cors });
  }
  const res = NextResponse.next();
  for (const [key, value] of Object.entries(cors)) res.headers.set(key, value);
  return res;
}

export const config = { matcher: "/api/:path*" };
