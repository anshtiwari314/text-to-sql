import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { authBaseUrl } from "@/lib/oauthEnv";
import { signMobileToken } from "@/lib/mobileToken";
import { mobileAuthReturnUrl } from "@/lib/mobileReturnUrl";

/** After Google/GitHub in the browser, send the phone app a token. */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.log("[mobile-auth] handoff with no session");
    return NextResponse.redirect(`${authBaseUrl()}/auth?error=OAuthCallback`);
  }

  const token = signMobileToken({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });
  const ret = new URL(req.url).searchParams.get("return");
  const dest = new URL(mobileAuthReturnUrl(ret));
  dest.searchParams.set("token", token);
  console.log("[mobile-auth] handoff for", session.user.email, "->", dest.protocol);
  return new NextResponse(null, { status: 302, headers: { Location: dest.toString() } });
}
