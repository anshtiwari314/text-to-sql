import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/getRequestUser";
import { getQueryQuota } from "@/lib/queryQuota";

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const quota = await getQueryQuota(user);
  return NextResponse.json(quota);
}
