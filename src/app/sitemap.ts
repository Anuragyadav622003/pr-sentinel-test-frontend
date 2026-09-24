import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // The current app is authentication-gated; do not advertise private routes
  // to crawlers until a public marketing page exists.
  return [];
}
