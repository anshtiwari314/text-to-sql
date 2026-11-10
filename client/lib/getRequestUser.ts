import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { readMobileToken } from "@/lib/mobileToken";

export type RequestUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/** Website cookie session, or Authorization: Bearer from the phone app. */
export async function getRequestUser(req: Request): Promise<RequestUser | null> {
  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) {
    try {
      const user = readMobileToken(header.slice("Bearer ".length).trim());
      if (!user) {
        console.log("[auth] mobile bearer rejected");
        return null;
      }
      console.log("[auth] mobile bearer accepted", user.email);
      return user;
    } catch (error) {
      console.error("[auth] mobile bearer error", error);
      return null;
    }
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };
}
