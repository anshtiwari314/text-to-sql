import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  console.log("[seo] robots.txt", base);
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/app", "/auth/mobile"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
