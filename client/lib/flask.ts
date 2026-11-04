// Where the Flask server lives. Override with FLASK_URL in .env.local.
export const FLASK_URL = process.env.FLASK_URL || "http://127.0.0.1:8000";

// How many old chat messages we pass to Flask (the LLM gets only these).
export const HISTORY_LIMIT = 4;

/**
 * A small helper so every Next.js API route handles Flask the same way.
 * Returns { ok, status, data } and never throws for "Flask said no".
 */
export async function callFlask(path: string, body: unknown) {
  let response: Response;
  try {
    response = await fetch(`${FLASK_URL}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Flask isn't running or the port is wrong
    return {
      ok: false,
      status: 503,
      data: { error: `Cannot reach the Flask server at ${FLASK_URL}. Is it running?` },
    };
  }

  const data = await response.json().catch(() => ({ error: "Flask returned a non-JSON response" }));
  return { ok: response.ok, status: response.status, data };
}
