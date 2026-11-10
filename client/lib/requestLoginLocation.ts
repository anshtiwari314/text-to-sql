import { clientClock } from "@/lib/clientClock";
import { GEO_COOKIE, LOCAL_TIME_COOKIE, TZ_COOKIE } from "@/lib/geoCookie";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=900; SameSite=Lax`;
}

/** Browser local date/time for login rows (not server TZ). */
export function stampLoginClient() {
  const { localTime, timezone } = clientClock();
  setCookie(LOCAL_TIME_COOKIE, localTime);
  setCookie(TZ_COOKIE, timezone);
  console.log("[auth] client clock", localTime, timezone);
}

/** Browser geolocation for login rows + admin mail. Denied → empty cookie (location null). */
export function requestLoginLocation() {
  stampLoginClient();

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    setCookie(GEO_COOKIE, "");
    console.log("[auth] no geolocation API, location null");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setCookie(GEO_COOKIE, `${pos.coords.latitude},${pos.coords.longitude}`);
      console.log("[auth] location granted");
    },
    () => {
      setCookie(GEO_COOKIE, "");
      console.log("[auth] location denied, location null");
    },
    { timeout: 8000, maximumAge: 60_000 }
  );
}
