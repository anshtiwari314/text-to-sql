import { query } from "@/lib/db";
import { ensureAuthTables } from "@/lib/ensureAuthTables";

/** Create or refresh a user after Google or GitHub sign-in. */
export async function upsertOAuthUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  await ensureAuthTables();
  const email = input.email.trim();
  const existing = await query(
    "SELECT id, name, email, image FROM users WHERE LOWER(email) = LOWER($1)",
    [email]
  );

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    await query(
      `UPDATE users
       SET last_login = CURRENT_TIMESTAMP,
           name = COALESCE($2, name),
           image = COALESCE($3, image)
       WHERE id = $1`,
      [row.id, input.name || null, input.image || null]
    );
    console.log("[mobile-auth] oauth user updated", row.email);
    return {
      id: String(row.id),
      email: row.email as string,
      name: (input.name || row.name) as string | null,
      image: (input.image || row.image) as string | null,
    };
  }

  const created = await query(
    "INSERT INTO users (name, email, image) VALUES ($1, $2, $3) RETURNING id, name, email, image",
    [input.name || email, email, input.image || null]
  );
  const row = created.rows[0];
  console.log("[mobile-auth] oauth user created", row.email);
  return {
    id: String(row.id),
    email: row.email as string,
    name: row.name as string | null,
    image: row.image as string | null,
  };
}
