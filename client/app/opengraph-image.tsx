import { ImageResponse } from "next/og";
import { DATABASE_NAMES, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE} for ${DATABASE_NAMES.join(", ")}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#020617",
          color: "#f8fafc",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          Query<span style={{ color: "#818cf8" }}>AI</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 36, color: "#94a3b8" }}>
          Text-to-SQL AI
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: "#cbd5e1" }}>
          {DATABASE_NAMES.join("  ·  ")}
        </div>
      </div>
    ),
    { ...size }
  );
}
