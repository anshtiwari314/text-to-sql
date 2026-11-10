import { query } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";

export function nonAdminQueryLimit() {
  const raw = process.env.NON_ADMIN_QUERY_LIMIT || "5";
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 5;
}

export async function countUserQueries(userId: string) {
  const result = await query(
    `SELECT COUNT(*)::int AS n
     FROM chat_messages m
     JOIN chat_sessions s ON s.id = m.session_id
     WHERE s.user_id = $1 AND m.role = 'user'`,
    [userId]
  );
  return result.rows[0]?.n ?? 0;
}

export async function getQueryQuota(user: { id: string; email?: string | null }) {
  const limit = nonAdminQueryLimit();
  const admin = isAdminEmail(user.email);
  const used = await countUserQueries(user.id);
  if (admin) {
    console.log("[quota] status admin", user.email, used);
    return { used, limit, remaining: null as number | null, isAdmin: true };
  }
  const remaining = Math.max(0, limit - used);
  console.log("[quota] status", user.email, used, "/", limit, "left", remaining);
  return { used, limit, remaining, isAdmin: false };
}

export async function assertCanQuery(user: { id: string; email?: string | null }) {
  const limit = nonAdminQueryLimit();
  if (isAdminEmail(user.email)) {
    console.log("[quota] admin unlimited", user.email);
    return { ok: true as const };
  }

  const used = await countUserQueries(user.id);
  if (used >= limit) {
    console.log("[quota] blocked", user.email, used);
    return {
      ok: false as const,
      error: `Query limit reached (${limit}). Ask the admin for more access.`,
    };
  }
  console.log("[quota] allow", user.email, used, "/", limit);
  return { ok: true as const, used };
}
