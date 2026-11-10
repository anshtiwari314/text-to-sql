/** Wall-clock time from the phone, not the server. */
export function clientClock() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    localTime: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  };
}
