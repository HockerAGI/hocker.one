import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hockerone.vercel.app").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/one",
          "/empresa",
          "/servicios",
          "/ecosistema",
          "/soluciones",
          "/casos",
          "/seguridad",
          "/contacto",
        ],
        disallow: [
          "/api/",
          "/dashboard",
          "/chat",
          "/live",
          "/map",
          "/apps",
          "/agis",
          "/nodes",
          "/owner",
          "/commands",
          "/integrations",
          "/status",
          "/memory",
          "/governance",
          "/supply",
          "/mobile",
          "/launch",
          "/chido",
          "/security",
          "/admin",
          "/access",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
