import { cookies } from "next/headers";
import { GEO_COOKIE, LOCAL_TIME_COOKIE, TZ_COOKIE } from "@/lib/geoCookie";
import { recordLogin, type LoginStamp } from "@/lib/recordLogin";

async function cookieVal(name: string) {
  try {
    const jar = await cookies();
    const raw = decodeURIComponent(jar.get(name)?.value || "").trim();
    return raw || null;
  } catch {
    return null;
  }
}

export async function notifyAdminLogin(
  user: { email?: string | null; name?: string | null },
  method?: string | null,
  extra?: Partial<LoginStamp>
) {
  try {
    await recordLogin({
      email: user.email,
      name: user.name,
      method,
      location: extra?.location ?? (await cookieVal(GEO_COOKIE)),
      localTime: extra?.localTime ?? (await cookieVal(LOCAL_TIME_COOKIE)),
      timezone: extra?.timezone ?? (await cookieVal(TZ_COOKIE)),
    });
  } catch (error) {
    console.error("[login-log] record failed", error);
  }
}
