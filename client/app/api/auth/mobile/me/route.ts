import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/getRequestUser";

/** Phone app checks the saved token on launch. */
export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  console.log("[mobile-auth] me", user.email);
  return NextResponse.json({ user });
}
