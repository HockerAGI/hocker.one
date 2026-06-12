import type { MetadataRoute } from "next";
import { HOCKER_PUBLIC_SITEMAP_ROUTES } from "@/lib/hocker-public-private-topology";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hockerone.vercel.app").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return HOCKER_PUBLIC_SITEMAP_ROUTES.map((route) => ({
    url: `${SITE_URL}${route === "/" ? "" : route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.75,
  }));
}
