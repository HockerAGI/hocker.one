import type { MetadataRoute } from "next";
import {
  HOCKER_PRIVATE_ROUTES,
  HOCKER_PROTECTED_ROUTES,
  HOCKER_PUBLIC_SITEMAP_ROUTES,
  HOCKER_TECHNICAL_NOINDEX_ROUTES,
} from "@/lib/hocker-public-private-topology";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hockerone.vercel.app").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [...HOCKER_PUBLIC_SITEMAP_ROUTES],
        disallow: [
          "/api/",
          ...HOCKER_PRIVATE_ROUTES,
          ...HOCKER_PROTECTED_ROUTES,
          ...HOCKER_TECHNICAL_NOINDEX_ROUTES,
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
